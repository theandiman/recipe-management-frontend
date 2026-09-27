import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create Firestore mock structures
const mockDocData: Record<string, any> = {};
const mockCollectionDocs: Record<string, any[]> = {};
let setCalls: Array<{ path: string; data: any; options?: any }> = [];

const mockDoc = (docPath: string) => ({
  get: vi.fn(async () => ({
    exists: docPath in mockDocData,
    data: () => mockDocData[docPath],
    id: docPath.split('/').pop(),
  })),
  set: vi.fn(async (data: any, options?: any) => {
    setCalls.push({ path: docPath, data, options });
    mockDocData[docPath] = { ...(mockDocData[docPath] || {}), ...data };
  }),
});

const mockCollection = (collName: string) => ({
  doc: vi.fn((docId: string) => mockDoc(`${collName}/${docId}`)),
  where: vi.fn(() => ({
    limit: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: (mockCollectionDocs[collName] || []).map((d) => ({
          id: d.id,
          data: () => d,
        })),
      })),
    })),
  })),
});

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn((name: string) => mockCollection(name)),
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    increment: vi.fn((n: number) => `INCREMENT_${n}`),
  },
}));

vi.mock('firebase-functions', () => ({
  setGlobalOptions: vi.fn(),
}));

vi.mock('firebase-functions/logger', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

// Import modules under test after mocks
import { isAllowedInFirestore, recordAccessRequest, handleBeforeUserCreated } from './index';

describe('Cloud Functions Allowlist Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCalls = [];
    for (const key of Object.keys(mockDocData)) {
      delete mockDocData[key];
    }
    for (const key of Object.keys(mockCollectionDocs)) {
      delete mockCollectionDocs[key];
    }
    delete process.env.ALLOWED_EMAILS;
    delete process.env.ALLOWED_DOMAINS;
  });

  describe('isAllowedInFirestore', () => {
    it('returns true when exact email document exists in allowed_users', async () => {
      mockDocData['allowed_users/developer@example.com'] = {
        target: 'developer@example.com',
        isPattern: false,
      };

      const result = await isAllowedInFirestore('developer@example.com');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('developer@example.com');
    });

    it('returns true when wildcard domain document exists in allowed_users', async () => {
      mockDocData['allowed_users/*@acme.corp'] = {
        target: '*@acme.corp',
        isPattern: true,
      };

      const result = await isAllowedInFirestore('alice@acme.corp');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('*@acme.corp');
    });

    it('returns true when base email exists for plus-addressed email', async () => {
      mockDocData['allowed_users/tester@gmail.com'] = {
        target: 'tester@gmail.com',
        allowPlus: true,
      };

      const result = await isAllowedInFirestore('tester+run42@gmail.com');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('tester@gmail.com');
    });

    it('returns true when custom pattern document matches', async () => {
      mockCollectionDocs['allowed_users'] = [
        { id: 'qa+*@test.org', pattern: 'qa+*@test.org', isPattern: true },
      ];

      const result = await isAllowedInFirestore('qa+build-10@test.org');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('qa+*@test.org');
    });

    it('returns false when no matching record is found', async () => {
      const result = await isAllowedInFirestore('unknown@random.io');
      expect(result.allowed).toBe(false);
    });

    it('returns false if document is revoked', async () => {
      mockDocData['allowed_users/revoked@example.com'] = {
        target: 'revoked@example.com',
        revoked: true,
      };

      const result = await isAllowedInFirestore('revoked@example.com');
      expect(result.allowed).toBe(false);
    });
  });

  describe('recordAccessRequest', () => {
    it('upserts pending request into access_requests collection', async () => {
      await recordAccessRequest('newuser@example.com', {
        displayName: 'New User',
        photoURL: null,
      });

      expect(setCalls.length).toBe(1);
      expect(setCalls[0].path).toBe('access_requests/newuser@example.com');
      expect(setCalls[0].data.email).toBe('newuser@example.com');
      expect(setCalls[0].data.displayName).toBe('New User');
      expect(setCalls[0].data.status).toBe('pending');
      expect(setCalls[0].options).toEqual({ merge: true });
    });
  });

  describe('handleBeforeUserCreated trigger logic', () => {
    it('throws invalid-argument if no email is provided', async () => {
      await expect(
        handleBeforeUserCreated({ data: {} } as any)
      ).rejects.toThrow('Email address is required');
    });

    it('allows registration if email matches static env variable', async () => {
      process.env.ALLOWED_EMAILS = 'envuser@example.com';
      await expect(
        handleBeforeUserCreated({ data: { email: 'envuser@example.com' } } as any)
      ).resolves.toBeUndefined();
    });

    it('allows registration if email is in Firestore allowlist', async () => {
      mockDocData['allowed_users/firestoreuser@example.com'] = {
        target: 'firestoreuser@example.com',
      };

      await expect(
        handleBeforeUserCreated({ data: { email: 'firestoreuser@example.com' } } as any)
      ).resolves.toBeUndefined();
    });

    it('blocks unauthorized registration, records request, and throws permission-denied', async () => {
      await expect(
        handleBeforeUserCreated({
          data: { email: 'stranger@example.com', displayName: 'Stranger' },
        } as any)
      ).rejects.toThrow('Registration is currently invite-only in this dev environment');

      // Verify request was recorded
      expect(setCalls.some((c) => c.path === 'access_requests/stranger@example.com')).toBe(true);
    });
  });
});
