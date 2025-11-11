# Managing Allowed Emails for CookFlow

CookFlow uses invite-only registration enforced by Firebase Cloud Functions. This document explains how to manage the allowlist.

## 🔒 Security Architecture

The email allowlist is stored in **environment variables** and enforced by Firebase Cloud Functions. This means:
- ✅ Email addresses are **NOT** committed to source control
- ✅ The allowlist runs on Firebase's servers and **cannot be bypassed**
- ✅ Works for both email/password registration AND Google OAuth
- ✅ Each environment (dev, staging, prod) has its own allowlist

## 📝 Setting Up the Allowlist

### 1. Create Local Environment File

```bash
cd functions
cp .env.example .env
```

### 2. Edit `.env` File

```bash
# Add your allowed email addresses (comma-separated)
ALLOWED_EMAILS=user1@example.com,user2@example.com,user3@example.com

# Optional: Allow entire domains
ALLOWED_DOMAINS=yourcompany.com,partner.com
```

**Important**: `.env` is in `.gitignore` and will NOT be committed.

### 3. Deploy to Firebase

```bash
# Deploy with environment variables
firebase deploy --only functions
```

Firebase will read the environment variables from your local `.env` file and store them securely.

## 🔄 Updating the Allowlist

### Option 1: Using Firebase Console (Recommended for Production)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Functions** → **Dashboard**
4. Click on `beforecreated` function
5. Go to **Configuration** tab
6. Update `ALLOWED_EMAILS` and/or `ALLOWED_DOMAINS`
7. Save changes

### Option 2: Using Firebase CLI

```bash
# Set environment variables
firebase functions:config:set \
  allowed.emails="user1@example.com,user2@example.com" \
  allowed.domains="company.com"

# Deploy functions to apply changes
firebase deploy --only functions
```

### Option 3: Update Local .env and Redeploy

```bash
cd functions
# Edit .env file with your changes
nano .env

# Deploy to Firebase
firebase deploy --only functions
```

## 🧪 Testing

### Test with Allowed Email

1. Go to your app's registration page
2. Try to register with an email in `ALLOWED_EMAILS`
3. ✅ Should succeed

### Test with Blocked Email

1. Try to register with an email NOT in the allowlist
2. ❌ Should fail with: "Registration is currently invite-only"

### Test Google OAuth

1. Try to sign in with Google using an allowed email
2. ✅ Should succeed
3. Try with a blocked email
4. ❌ Should fail with invite-only message

## 📋 Format Guidelines

### Email Format
- Comma-separated
- Case-insensitive (automatically lowercased)
- Whitespace is trimmed
```bash
ALLOWED_EMAILS=user@example.com,another@test.com
```

### Domain Format
- Comma-separated
- Just the domain, no @ symbol
- Case-insensitive
```bash
ALLOWED_DOMAINS=company.com,partner.org
```

### Example Combinations

Allow specific emails:
```bash
ALLOWED_EMAILS=admin@example.com,ceo@company.com
ALLOWED_DOMAINS=
```

Allow an entire organization:
```bash
ALLOWED_EMAILS=
ALLOWED_DOMAINS=yourcompany.com
```

Mix both:
```bash
ALLOWED_EMAILS=partner@external.com,consultant@freelance.com
ALLOWED_DOMAINS=yourcompany.com
```

## 🚨 Important Notes

1. **Security**: The `.env` file should NEVER be committed to git
2. **Each environment needs its own configuration**: Dev, staging, and production should have separate allowlists
3. **Changes require redeployment**: After updating environment variables, redeploy the functions
4. **No client-side check**: There is no client-side validation - security is 100% server-side
5. **Works for all auth methods**: Email/password, Google OAuth, or any future auth providers

## 🔍 Troubleshooting

### "Registration is currently invite-only" Error

**Cause**: Email is not in the allowlist

**Solution**: Add the email to `ALLOWED_EMAILS` or add their domain to `ALLOWED_DOMAINS`, then redeploy

### Changes Not Taking Effect

**Cause**: Functions not redeployed or environment variables not updated

**Solution**: 
```bash
firebase deploy --only functions
```

### Empty Allowlist

**Cause**: Environment variables not set

**Solution**: Check that `.env` file exists and has correct format, then redeploy

## 📚 Related Documentation

- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_COMPLETE.md)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
