# SonarCloud Quality Gate

This document explains SonarCloud findings and our approach to them.

## Current Status

SonarCloud analyzes code quality, security, and maintainability. The quality gate may show failures for:

### Security Hotspots

Security hotspots are **not vulnerabilities** but code patterns that require security review:

1. **Math.random() usage**
   - **Location**: `AIGenerator.tsx`, `recipeStorageApi.ts`
   - **Purpose**: UI progress simulation and temporary client-side IDs
   - **Risk**: LOW - Not used for security-sensitive operations (no tokens, no auth, no secrets)
   - **Mitigation**: These are acceptable for UI effects and client-side temporary IDs
   - **Status**: ✅ Reviewed and accepted

2. **Firebase API Key**
   - **Location**: `firebase.ts`
   - **Purpose**: Firebase client-side configuration
   - **Risk**: LOW - Public API key is intended for browser use (Firebase security is enforced server-side)
   - **Mitigation**: Proper Firebase Security Rules and Authentication
   - **Status**: ✅ Reviewed and accepted (standard Firebase pattern)

3. **Password handling**
   - **Location**: `AuthContext.tsx`, auth forms
   - **Purpose**: User authentication
   - **Risk**: LOW - Uses Firebase Auth SDK (industry standard)
   - **Mitigation**: Firebase handles hashing, storage, and security
   - **Status**: ✅ Reviewed and accepted

### Code Duplication

**Target**: ≤ 3% duplication on new code

**Common sources**:
- Test files (similar test patterns)
- Type definitions (interface similarities)
- Configuration files (boilerplate)
- Utility functions (error handling patterns)

**Mitigation**:
- Excluded test files, configs, and utility scripts from duplication analysis
- Focus duplication metrics on production code only

## Configuration

SonarCloud is configured via `.sonarcloud.properties` and `sonar-project.properties`:

### What's Excluded

- ✅ Test files (`*.test.tsx`, `*.spec.ts`)
- ✅ Configuration files (`*.config.ts`, `*.config.js`)
- ✅ Build artifacts (`dist/`, `build/`, `coverage/`)
- ✅ Scripts directory (bash utilities)
- ✅ Firebase functions
- ✅ Type definitions (common pattern duplication)

### What's Analyzed

- ✅ `src/` directory (production code)
- ✅ Component logic
- ✅ Business logic
- ✅ API integrations

## Reviewing Security Hotspots

When SonarCloud flags security hotspots:

1. **Review the code context**
   - What is the actual use case?
   - Is sensitive data involved?
   - Are there server-side protections?

2. **Determine risk level**
   - HIGH: Actual security vulnerability (fix immediately)
   - MEDIUM: Potential issue with mitigation (review and document)
   - LOW: False positive or acceptable pattern (document and accept)

3. **Document decisions**
   - Add comments explaining why the pattern is safe
   - Update this document with justification
   - Mark as "Reviewed" in SonarCloud

## Best Practices

### When to use crypto-secure random
✅ **Use `crypto.getRandomValues()`** for:
- Authentication tokens
- Session IDs
- Security-sensitive random data
- Server-side secrets

❌ **OK to use `Math.random()`** for:
- UI animations
- Client-side temporary IDs
- Non-security randomness
- Visual effects

### Handling Firebase API Keys

Firebase API keys are **public by design**:
- They identify the Firebase project
- They're safe to commit and expose
- Security is enforced through Firebase Security Rules
- Authentication validates users server-side

## Resources

- [SonarCloud Security Hotspots Guide](https://docs.sonarcloud.io/digging-deeper/security-hotspots/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
