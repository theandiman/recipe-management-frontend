# Managing Allowed Emails for CookFlow

CookFlow uses invite-only registration enforced by Firebase Cloud Functions. Registration is verified via a dynamic Firestore allowlist (`allowed_users`) with static environment variable fallback (`ALLOWED_EMAILS`, `ALLOWED_DOMAINS`).

---

## 🔒 Security Architecture

The allowlist is enforced by the server-side Firebase Identity blocking Cloud Function (`beforeUserCreated`). This means:
- ✅ **Server-Side Enforcement**: Runs directly on Firebase Identity Platform servers and **cannot be bypassed** by client manipulation.
- ✅ **Dynamic & Instant**: Adding users to Firestore takes effect **immediately** without redeploying Cloud Functions.
- ✅ **Wildcards & Sub-Addressing**: Supports wildcards (e.g. `*@company.com`) and sub-addressing / plus-addressing (e.g. `user+*@gmail.com`).
- ✅ **Self-Service Requests**: When an unauthorized user attempts to register in dev, their request is automatically recorded in the `access_requests` collection for administrative review.
- ✅ **Zero Secrets in Git**: No emails are committed to source control.
- ✅ **Provider Agnostic**: Works seamlessly for both email/password registration and Google OAuth sign-in.

---

## 🚀 Quick Start: Managing Allowed Users (Instant CLI)

CookFlow provides CLI commands to manage the Firestore allowlist without needing to edit `.env` files or redeploy Cloud Functions.

### 1. View Current Allowlist

```bash
npm run allowlist:list
```

### 2. Add an Email or Wildcard Pattern

```bash
# Add a single email
npm run allowlist:add developer@example.com

# Add all sub-aliases (plus-addressing) for an email (e.g. tester+1@gmail.com)
npm run allowlist:add "tester+*@gmail.com"

# Allow an entire company domain
npm run allowlist:add "*@mycompany.com"
```

*Note: By default, any allowed individual email also permits plus-addressing (e.g., allowing `andy@gmail.com` permits `andy+stage@gmail.com`).*

### 3. Remove an Email or Pattern

```bash
npm run allowlist:remove developer@example.com
```

### 4. Review & Approve Signup Requests

When a developer or tester attempts to sign up without being allowlisted, an access request is automatically generated.

```bash
# List all pending access requests
npm run allowlist:requests

# Approve an access request (automatically adds to allowlist and marks approved)
npm run allowlist:approve tester@example.com

# Reject an access request
npm run allowlist:reject tester@example.com
```

---

## 🖥️ Alternative: Managing via Firebase Console

You can also manage allowed users directly in the [Firebase Console](https://console.firebase.google.com/):

### Adding Allowed Users in Firestore

1. Open **Firestore Database** in your Firebase project (e.g., `recipe-mgmt-dev`).
2. Go to the `allowed_users` collection.
3. Click **Add document**:
   - **Document ID**: The email or wildcard pattern (e.g., `developer@example.com` or `*@company.com`).
   - Fields:
     - `target`: String (same as document ID)
     - `isPattern`: Boolean (`true` if contains `*`, otherwise `false`)
     - `allowPlus`: Boolean (`true`)

### Approving Access Requests in Firestore

1. Open the `access_requests` collection in Firestore.
2. Review the document matching the user's email.
3. To approve: add a document in `allowed_users` with their email, and update `status: "approved"` in `access_requests`.

---

## ⚙️ Static Environment Variables (Fallback)

For automated CI environments or baseline defaults, static environment variables are still supported as a fallback:

### 1. Edit Local `.env` in `functions/`

```bash
cd functions
cp .env.example .env
```

```bash
# Add comma-separated emails
ALLOWED_EMAILS=admin@example.com,lead@example.com

# Optional: Allow entire domains
ALLOWED_DOMAINS=company.com
```

### 2. Deploy Functions

```bash
firebase deploy --only functions
```

---

## 🧪 Testing

### Test Allowed Registration
1. Go to the registration page (`/register`) or click **Sign up with Google**.
2. Register with an allowed email or wildcard alias.
3. ✅ Registration succeeds and signs the user in.

### Test Unauthorized Registration
1. Try to register with an unlisted email.
2. ❌ Blocked with: *"Registration is currently invite-only in this dev environment. Your access request has been recorded for review."*
3. Check `access_requests` in Firestore or run `npm run allowlist:requests` to verify the request was recorded.

---

## 🔍 Troubleshooting

### Error: `auth/blocking-cloud-function-error`
- **Cause**: The email is not in `allowed_users` or static environment variables.
- **Solution**: Run `npm run allowlist:add <email>` or approve the request via `npm run allowlist:approve <email>`.

### Error: Missing credentials when running CLI
- **Solution**: Ensure you are authenticated with Google Cloud / Firebase CLI:
  ```bash
  gcloud auth application-default login
  ```
  Or specify `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json`.
