import { describe, it, expect } from 'vitest';
import { matchesPattern, getBaseEmail, isEmailAllowedStatic } from './allowlistMatcher';

describe('allowlistMatcher', () => {
  describe('matchesPattern', () => {
    it('matches exact strings', () => {
      expect(matchesPattern('test@example.com', 'test@example.com')).toBe(true);
      expect(matchesPattern('TEST@example.com', 'test@example.com')).toBe(true);
      expect(matchesPattern('test@example.com', 'other@example.com')).toBe(false);
    });

    it('matches wildcard domains (*@domain.com)', () => {
      expect(matchesPattern('*@company.com', 'alice@company.com')).toBe(true);
      expect(matchesPattern('*@company.com', 'bob@company.com')).toBe(true);
      expect(matchesPattern('*@company.com', 'alice@other.com')).toBe(false);
    });

    it('matches plus addressing wildcards (user+*@domain.com)', () => {
      expect(matchesPattern('andy+*@gmail.com', 'andy+test1@gmail.com')).toBe(true);
      expect(matchesPattern('andy+*@gmail.com', 'andy+staging-99@gmail.com')).toBe(true);
      expect(matchesPattern('andy+*@gmail.com', 'other+test1@gmail.com')).toBe(false);
      expect(matchesPattern('andy+*@gmail.com', 'andy@gmail.com')).toBe(false);
    });

    it('handles empty or invalid inputs', () => {
      expect(matchesPattern('', 'test@example.com')).toBe(false);
      expect(matchesPattern('*@example.com', '')).toBe(false);
    });
  });

  describe('getBaseEmail', () => {
    it('extracts base email from plus-addressed emails', () => {
      expect(getBaseEmail('user+dev@gmail.com')).toBe('user@gmail.com');
      expect(getBaseEmail('USER+DEV@GMAIL.COM')).toBe('user@gmail.com');
      expect(getBaseEmail('andy+automated-test-123@recipe.io')).toBe('andy@recipe.io');
    });

    it('returns normalized email if no plus tag is present', () => {
      expect(getBaseEmail('user@gmail.com')).toBe('user@gmail.com');
    });

    it('returns null for invalid email strings', () => {
      expect(getBaseEmail('invalid-email')).toBeNull();
      expect(getBaseEmail('@domain.com')).toBeNull();
      expect(getBaseEmail('+tag@domain.com')).toBeNull();
    });
  });

  describe('isEmailAllowedStatic', () => {
    const allowedEmails = ['dev@example.com', 'qa+*@company.com'];
    const allowedDomains = ['internal.org'];

    it('allows emails explicitly in allowedEmails', () => {
      expect(isEmailAllowedStatic('dev@example.com', allowedEmails, allowedDomains)).toBe(true);
      expect(isEmailAllowedStatic('DEV@EXAMPLE.COM', allowedEmails, allowedDomains)).toBe(true);
    });

    it('allows plus-addressed aliases of an allowed base email', () => {
      expect(isEmailAllowedStatic('dev+feature1@example.com', allowedEmails, allowedDomains)).toBe(true);
    });

    it('allows wildcard patterns in allowedEmails', () => {
      expect(isEmailAllowedStatic('qa+e2e-run1@company.com', allowedEmails, allowedDomains)).toBe(true);
    });

    it('allows emails matching allowedDomains', () => {
      expect(isEmailAllowedStatic('anyone@internal.org', allowedEmails, allowedDomains)).toBe(true);
      expect(isEmailAllowedStatic('someone.else@INTERNAL.ORG', allowedEmails, allowedDomains)).toBe(true);
    });

    it('rejects unlisted emails and domains', () => {
      expect(isEmailAllowedStatic('stranger@gmail.com', allowedEmails, allowedDomains)).toBe(false);
      expect(isEmailAllowedStatic('hacker@external.org', allowedEmails, allowedDomains)).toBe(false);
    });

    it('handles invalid email formats safely', () => {
      expect(isEmailAllowedStatic('', allowedEmails, allowedDomains)).toBe(false);
      expect(isEmailAllowedStatic('invalid', allowedEmails, allowedDomains)).toBe(false);
    });
  });
});
