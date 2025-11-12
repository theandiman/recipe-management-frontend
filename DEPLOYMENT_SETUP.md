# Firebase Deployment Setup

This guide walks you through setting up automatic deployments to Firebase Hosting.

## Prerequisites

You need to configure GitHub secrets for Firebase deployment.

## Step 1: Get Firebase Service Account Key

From your infrastructure repository:

```bash
cd ~/code/recipe-management-infrastructure/terraform/environments/dev
gcloud secrets versions access latest --secret="firebase-service-account" --project="recipe-mgmt-dev" > ~/service-account-dev.json
```

## Step 2: Add GitHub Secrets

Go to your GitHub repository settings:
`https://github.com/theandiman/recipe-management-frontend/settings/secrets/actions`

Add these secrets:

### FIREBASE_SERVICE_ACCOUNT_DEV
- Copy the entire contents of `~/service-account-dev.json`
- Paste as the secret value (should be a JSON object with service account credentials)

### FIREBASE_PROJECT_ID_DEV
Set the value to: `recipe-mgmt-dev`

Or get it from Terraform:
```bash
cd ~/code/recipe-management-infrastructure/terraform/environments/dev
terraform output -json firebase_config | jq -r '.project_id'
```

## Step 3: Test Deployment

Once secrets are configured:

1. Push to main branch:
   ```bash
   git push origin main
   ```

2. Or manually trigger the workflow:
   - Go to Actions tab in GitHub
   - Select "Deploy to Dev" workflow
   - Click "Run workflow"

## Step 4: Verify Deployment

After the workflow completes:

1. Check the Actions tab for the deployment URL
2. Visit the Firebase Hosting URL
3. Verify the app is working correctly

## Troubleshooting

### Missing Secrets
If workflow fails with "secret not found":
- Double-check secret names match exactly
- Ensure secrets are added to repository (not organization)

### Firebase Project Not Found
If deployment fails with "project not found":
- Verify FIREBASE_PROJECT_ID_DEV is correct
- Check that the Firebase project exists in infrastructure repo

### Build Failures
If build fails:
- Check that `npm run build` works locally
- Verify all dependencies are in package.json
- Review error logs in GitHub Actions

## Manual Deployment (Fallback)

If you need to deploy manually:

```bash
# Build the app
npm run build

# Get Firebase project ID
cd ../recipe-management-infrastructure/terraform/environments/dev
PROJECT_ID=$(terraform output -raw firebase_project_id)

# Deploy
cd ../../recipe-management-frontend
firebase use $PROJECT_ID
firebase deploy --only hosting
```
