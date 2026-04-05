# Multi-User Post-Deployment Testing Guide

## Overview

The multi-user post-deployment testing system validates real user journeys against a live deployed environment — covering the frontend, API, and auth layers together. Unlike unit or integration tests, these tests run *after* a deployment to confirm the system behaves correctly end-to-end with multiple independent users.

Key scenarios covered:
- User-to-user interactions (sharing, following, liking, saving recipes)
- Authorization boundaries (user A cannot modify user B's private data)
- API behavior under multi-user conditions
- Frontend flows involving more than one authenticated session

Because CookFlow uses an email allowlist enforced by a Firebase `beforeUserCreated` blocking function, the test system requires a special provisioning approach to create test users without disrupting production access controls.

---

## Architecture

### How Test User Provisioning Works

```
┌─────────────────────────────────────────────────────────────┐
│                     CI / Local Machine                       │
│                                                             │
│  TestUserProvisioner                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Firebase Admin SDK  ──► createUser()            │   │
│  │     (bypasses beforeUserCreated)                    │   │
│  │                                                     │   │
│  │  2. Firebase REST API   ──► signInWithPassword()    │   │
│  │     (obtains ID token for test user)                │   │
│  │                                                     │   │
│  │  3. Test Suite          ──► API calls / UI flows    │   │
│  │     (uses token as real authenticated user)         │   │
│  │                                                     │   │
│  │  4. Cleanup             ──► deleteUser()            │   │
│  │     (runs after suite, and on failure)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Two Firebase SDKs are used for different purposes:**

| SDK | Purpose | Allowlist? |
|-----|---------|-----------|
| Firebase Admin SDK | Create / delete users server-side | ❌ Bypasses `beforeUserCreated` |
| Firebase REST API (`identitytoolkit`) | Sign in and obtain ID tokens | ✅ Normal auth flow |

The Admin SDK is privileged and intended for backend/admin use. When it creates a user directly, Firebase does **not** invoke `beforeUserCreated` — which is the intended behavior for administrative provisioning. The REST sign-in call is still subject to normal auth rules, so test users behave exactly like real users once authenticated.

---

## Required Permissions

The Firebase service account used by the test provisioner must have sufficient IAM permissions to create and delete Firebase Auth users.

**Minimum required role:** `roles/firebase.admin` (shown as "Firebase Authentication Admin" in the Google Cloud IAM console)

If you prefer a least-privilege setup, grant these specific permissions:
- `firebaseauth.users.create`
- `firebaseauth.users.delete`
- `firebaseauth.users.get`

### Granting permissions via `gcloud`

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

The service account JSON key must be exported and stored as the `FIREBASE_ADMIN_SERVICE_ACCOUNT` secret (see below).

---

## Required Secrets / Environment Variables

| Variable | Where Stored | Description |
|----------|-------------|-------------|
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | GitHub Secret | Full JSON content of the Firebase service account key with Auth Admin permissions |
| `FIREBASE_WEB_API_KEY` | GitHub Secret | Firebase project Web API key (found in Project Settings → General) |
| `MANAGEMENT_API_URL` | GitHub Secret | Base URL of the deployed backend service (e.g., `https://api.recipe-mgmt-dev.web.app`) |
| `DEPLOYED_APP_URL` | GitHub Secret | Base URL of the deployed frontend app (e.g., `https://recipe-mgmt-dev.web.app`) |

### Obtaining the service account key

1. Go to [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select (or create) the service account for testing
3. Click **Keys** → **Add Key** → **Create new key** → **JSON**
4. Store the full JSON content as the `FIREBASE_ADMIN_SERVICE_ACCOUNT` GitHub secret

> ⚠️ Never commit the service account JSON to source control.

### Obtaining the Web API Key

1. Open [Firebase Console](https://console.firebase.google.com/) → **Project Settings** → **General**
2. Copy the **Web API Key** from the "Your apps" section
3. Store it as the `FIREBASE_WEB_API_KEY` GitHub secret

---

## Running Locally

### Prerequisites

- Node.js ≥ 18
- `npm install` (installs Playwright and dependencies)
- `npx playwright install --with-deps` (installs browser binaries)
- A deployed environment to test against (dev or staging)

### Set up local environment

Create a `.env.test.local` file (this file is in `.gitignore` and will never be committed), then `source` it before running tests since Playwright does not auto-load `.env` files:

```bash
# .env.test.local — DO NOT COMMIT
export FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...",...}'
export FIREBASE_WEB_API_KEY=AIza...
export MANAGEMENT_API_URL=https://api.recipe-mgmt-dev.web.app
export DEPLOYED_APP_URL=https://recipe-mgmt-dev.web.app
```

```bash
# Source the file to export all variables into the current shell
source .env.test.local
```

### Run post-deploy tests

```bash
# Run all post-deploy tests
npm run test:post-deploy

# Run only API post-deploy tests
npx playwright test tests/post-deploy/multi-user-api.spec.ts --project=post-deploy

# Run only frontend post-deploy tests
npx playwright test tests/post-deploy/multi-user-frontend.spec.ts --project=post-deploy

# Run in headed mode to watch the browser
npx playwright test tests/post-deploy/ --project=post-deploy --headed

# Run with UI mode for interactive debugging
npx playwright test tests/post-deploy/ --project=post-deploy --ui
```

> **Note:** Post-deploy tests do **not** start a local dev server. They run against the URLs in `DEPLOYED_APP_URL` and `MANAGEMENT_API_URL`. Make sure those environments are deployed before running.

---

## Running in CI

Post-deploy tests are triggered automatically by the CI/CD pipeline after a successful deployment step. The workflow:

1. Code is merged to `main`
2. CI builds and deploys the app to Firebase Hosting
3. CI deploys the backend service
4. CI runs `npm run test:post-deploy` with the required secrets injected as environment variables
5. Results are reported back to the PR/commit

The required secrets must be configured in the repository's GitHub Actions secrets:
**Settings → Secrets and variables → Actions → New repository secret**

See [CI/CD Documentation](../CI_CD_DOCUMENTATION.md) for the full pipeline structure.

---

## How Test Users Are Provisioned

The `TestUserProvisioner` class in `tests/helpers/test-user-provisioner.ts` handles the full lifecycle of test users.

### Step-by-step flow

**1. Initialize the Admin SDK**

```typescript
const app = initializeApp({
  credential: cert(serviceAccountJson),
});
const auth = getAuth(app);
```

**2. Create a test user via Admin SDK**

```typescript
const userRecord = await auth.createUser({
  email: `test-${uuid}@test-cookflow.example`,
  password: generateSecurePassword(),
  displayName: `Test User ${uuid}`,
});
```

The Admin SDK creates the user directly in Firebase Auth. Because this is an admin operation, the `beforeUserCreated` Cloud Function is **not** invoked — the user is created regardless of whether the email is on the allowlist.

**3. Obtain an ID token via REST API**

```typescript
const response = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userRecord.email,
      password,
      returnSecureToken: true,
    }),
  }
);
const { idToken } = await response.json();
```

This REST call goes through the normal sign-in path — the `beforeUserCreated` function only fires on *creation*, not sign-in, so this succeeds normally and returns a valid ID token.

**4. Use the token in tests**

The ID token is passed to Playwright test pages (via `localStorage`, `sessionStorage`, or `page.evaluate`) or included in `Authorization: Bearer <token>` headers for API tests.

**5. Cleanup**

```typescript
await auth.deleteUser(userRecord.uid);
```

Cleanup is called in an `afterAll` hook and also on failure, ensuring no test users accumulate in Firebase Auth.

---

## Allowlist Bypass Explanation

CookFlow uses a Firebase `beforeUserCreated` blocking function to enforce invite-only registration:

```typescript
// functions/src/index.ts
export const beforecreated = beforeUserCreated((event) => {
  const email = event.data?.email?.toLowerCase();
  if (!email) return;

  const isEmailAllowed = ALLOWED_EMAILS.includes(email);
  const domain = email.split('@')[1];
  const isDomainAllowed = ALLOWED_DOMAINS.includes(domain);

  if (!isEmailAllowed && !isDomainAllowed) {
    throw new HttpsError(
      'permission-denied',
      'Registration is currently invite-only. Please contact support if you believe this is an error.'
    );
  }
});
```

This function fires for **client-initiated** user creation (email/password signup, Google OAuth, etc.). It does **not** fire for Admin SDK `createUser()` calls, because those originate from a trusted server context.

### Security implications

This is intentional and safe:
- Test users are created with random `@test-cookflow.example` addresses that are not real
- Passwords are randomly generated and never stored anywhere except ephemerally during the test run
- Users are deleted immediately after the test suite completes
- The Admin SDK credentials are stored only in GitHub Secrets and never exposed in client-side code or logs
- Even if a test user lingered (e.g., cleanup fails partway through), they cannot access any production data they were not explicitly granted access to in the test

If you want belt-and-suspenders assurance, you can add `@test-cookflow.example` to the `ALLOWED_DOMAINS` env var in non-production environments. This is optional but makes the provisioning path consistent with production sign-up for any sign-in flows you want to test.

---

## Cleanup

### When cleanup runs

| Trigger | Behavior |
|---------|----------|
| `afterAll` hook (normal completion) | All test users provisioned in that run are deleted |
| Test failure mid-suite | Cleanup still runs via `afterAll` — even if tests fail, teardown executes |
| Process killed / runner timeout | Users may not be cleaned up — see manual cleanup below |

### What gets cleaned up

- Firebase Auth user records (via `auth.deleteUser(uid)`)
- Any app data created by test users during the run (recipes, follows, etc.) — cleaned up by test-specific teardown steps or deleted transitively when the user account is removed, depending on Firestore security rules and data model

### Manual cleanup

If test users accumulate (e.g., after a runner crash), clean them up via the Firebase Console or CLI:

```bash
# List all users and look for test-cookflow.example addresses
firebase auth:export users.json --format=json

# Delete a specific user by UID
firebase auth:delete <uid>
```

Or use the Admin SDK in a one-off script:

```typescript
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const { users } = await auth.listUsers();
const testUsers = users.filter(u => u.email?.endsWith('@test-cookflow.example'));
await Promise.all(testUsers.map(u => auth.deleteUser(u.uid)));
console.log(`Deleted ${testUsers.length} test users`);
```

---

## Adding New Test Scenarios

### 1. Add a new spec file

Place new post-deploy specs in `tests/post-deploy/`:

```
tests/
  post-deploy/
    multi-user-api.spec.ts       # API-level multi-user tests
    multi-user-frontend.spec.ts  # Browser-level multi-user tests
    your-new-scenario.spec.ts    # ← add here
```

### 2. Use the provisioner

```typescript
import { TestUserProvisioner } from '../helpers/test-user-provisioner';

let provisioner: TestUserProvisioner;
let userA: { uid: string; idToken: string; email: string };
let userB: { uid: string; idToken: string; email: string };

test.beforeAll(async () => {
  provisioner = new TestUserProvisioner({
    serviceAccount: JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!),
    webApiKey: process.env.FIREBASE_WEB_API_KEY!,
  });

  [userA, userB] = await Promise.all([
    provisioner.createUser(),
    provisioner.createUser(),
  ]);
});

test.afterAll(async () => {
  await provisioner.cleanupAll();
});

test('user A cannot see user B private recipes', async ({ request }) => {
  // Use userA.idToken and userB.idToken in your assertions
  const res = await request.get(`${process.env.MANAGEMENT_API_URL}/api/recipes`, {
    headers: { Authorization: `Bearer ${userA.idToken}` },
  });
  // ...
});
```

### 3. Keep provisioning minimal

Only create as many test users as the scenario requires. Two users cover most authorization boundary tests. Avoid provisioning large numbers of users in a single spec.

### 4. Always clean up in `afterAll`

Never rely on a test passing to trigger cleanup — use `afterAll` unconditionally.

---

## Troubleshooting

### `FIREBASE_ADMIN_SERVICE_ACCOUNT` parse error

**Symptom:** `SyntaxError: Unexpected token` when the provisioner starts.

**Cause:** The secret value is not valid JSON, or it was double-encoded (JSON string of a JSON string).

**Fix:** Verify the secret value is the raw JSON object (starts with `{`), not a quoted string. Re-export the service account key if necessary.

---

### `PERMISSION_DENIED` when creating test users

**Symptom:** Admin SDK `createUser()` throws a `PERMISSION_DENIED` error.

**Cause:** The service account does not have the `Firebase Authentication Admin` role.

**Fix:** Grant `roles/firebase.admin` (or the minimum auth permissions) to the service account as described in [Required Permissions](#required-permissions).

---

### `EMAIL_EXISTS` error during provisioning

**Symptom:** `createUser()` fails with `The email address is already in use by another account`.

**Cause:** A previous test run did not clean up properly.

**Fix:** Follow the [Manual Cleanup](#manual-cleanup) steps to delete lingering test users, then re-run.

---

### Sign-in returns 400 / `INVALID_LOGIN_CREDENTIALS`

**Symptom:** The REST sign-in step fails even though the user was just created.

**Cause:** Firebase Auth propagation delay (rare), incorrect password passed to sign-in, or `FIREBASE_WEB_API_KEY` is wrong.

**Fix:**
1. Verify `FIREBASE_WEB_API_KEY` matches the project's Web API Key in Firebase Console → Project Settings.
2. Add a short retry/delay before the sign-in call if this is intermittent.

---

### Tests pass locally but fail in CI

**Symptom:** Post-deploy tests succeed locally but fail in the CI environment.

**Cause:** Missing or misconfigured GitHub secrets.

**Fix:** Confirm all four secrets (`FIREBASE_ADMIN_SERVICE_ACCOUNT`, `FIREBASE_WEB_API_KEY`, `MANAGEMENT_API_URL`, `DEPLOYED_APP_URL`) are set in **Settings → Secrets and variables → Actions**. Check that the deployment step completed successfully before the test step runs.

---

### Playwright can't reach `DEPLOYED_APP_URL`

**Symptom:** `net::ERR_NAME_NOT_RESOLVED` or timeout errors.

**Cause:** The deployment step failed, or `DEPLOYED_APP_URL` points to the wrong environment.

**Fix:** Confirm the deployment was successful before the test step, and verify `DEPLOYED_APP_URL` in the workflow YAML matches the deployed hosting URL.

---

## Related Documentation

- [EMAIL_ALLOWLIST.md](../EMAIL_ALLOWLIST.md) — How the invite-only allowlist works
- [CI_CD_DOCUMENTATION.md](../CI_CD_DOCUMENTATION.md) — Full CI/CD pipeline reference
- [tests/README.md](../tests/README.md) — General test documentation
- Epic: [theandiman/recipe-management#18](https://github.com/theandiman/recipe-management/issues/18) — Expand post-deployment multi-user testing
