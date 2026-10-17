/**
 * Matcher utilities for email allowlisting with support for wildcards,
 * domain checks, and sub-addressing (plus-addressing).
 */

/**
 * Checks if a string pattern containing '*' wildcards matches a given email.
 * Pattern matching is case-insensitive.
 */
export function matchesPattern(pattern: string, email: string): boolean {
  const p = pattern.trim().toLowerCase();
  const e = email.trim().toLowerCase();
  if (!p || !e) return false;
  if (p === e) return true;
  if (!p.includes('*')) return false;

  const regexString =
    '^' +
    p
      .split('*')
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*') +
    '$';
  const regex = new RegExp(regexString);
  return regex.test(e);
}

/**
 * Extracts the base email address by removing plus-addressing sub-tags.
 * Example: 'user+test123@gmail.com' -> 'user@gmail.com'.
 * Returns the normalized email if no '+' exists, or null if invalid email format.
 */
export function getBaseEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return null;

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain) return null;

  const plusIndex = localPart.indexOf('+');
  if (plusIndex === -1) {
    return trimmed;
  }
  const baseLocal = localPart.slice(0, plusIndex);
  if (!baseLocal) return null;

  return `${baseLocal}@${domain}`;
}

/**
 * Checks if an email is allowed based on static configuration arrays.
 */
export function isEmailAllowedStatic(
  email: string,
  allowedEmails: string[],
  allowedDomains: string[]
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) return false;

  const [, domain] = normalizedEmail.split('@');
  const baseEmail = getBaseEmail(normalizedEmail);

  // Exact email match
  if (allowedEmails.includes(normalizedEmail)) return true;

  // Base email match (for plus-addressing support)
  if (baseEmail && allowedEmails.includes(baseEmail)) return true;

  // Domain match
  if (domain && allowedDomains.includes(domain.toLowerCase())) return true;

  // Wildcard patterns in allowedEmails
  for (const pattern of allowedEmails) {
    if (pattern.includes('*') && matchesPattern(pattern, normalizedEmail)) {
      return true;
    }
  }

  return false;
}
