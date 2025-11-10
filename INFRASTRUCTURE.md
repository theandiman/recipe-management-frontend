# Infrastructure Dependencies

This frontend application depends on infrastructure provisioned by the **`recipe-management-infrastructure`** repository.

## Overview

The Recipe Management platform uses a **centralized infrastructure repository** that manages all GCP projects, Firebase configuration, databases, and services. This frontend repository **does not** contain any Terraform or infrastructure code.

## Repository Structure

```
recipe-management-infrastructure (Separate Repo)
└── Manages: Firebase, GCP projects, databases, services

recipe-management-frontend (This Repo)
└── Consumes: Firebase config from infrastructure repo
```

## Getting Firebase Configuration

### Quick Setup

1. **Clone infrastructure repository:**
   ```bash
   git clone git@github.com:theandiman/recipe-management-infrastructure.git
   ```

2. **Get Firebase configuration for development:**
   ```bash
   cd recipe-management-infrastructure/terraform/environments/dev
   
   # Initialize Terraform (first time only)
   terraform init
   
   # Get Firebase config and save to frontend .env
   terraform output -raw env_file_content > /path/to/recipe-management-frontend/.env
   ```

3. **Restart development server:**
   ```bash
   cd /path/to/recipe-management-frontend
   npm run dev
   ```

### What You Get

The infrastructure repository provides:

- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN`
- ✅ `VITE_FIREBASE_PROJECT_ID`
- ✅ `VITE_FIREBASE_STORAGE_BUCKET`
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `VITE_FIREBASE_APP_ID`

All these values are automatically generated when the infrastructure team deploys the Firebase project.

## Environments

| Environment | Firebase Project | How to Get Config |
|------------|------------------|-------------------|
| **Development** | `recipe-mgmt-dev` | `terraform output` from `terraform/environments/dev` |
| **Staging** | `recipe-mgmt-staging` | `terraform output` from `terraform/environments/staging` (future) |
| **Production** | `recipe-mgmt-prod` | `terraform output` from `terraform/environments/prod` (future) |

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Get Firebase config from infrastructure repo
      - name: Get Firebase Config
        run: |
          git clone https://github.com/theandiman/recipe-management-infrastructure.git infra
          cd infra/terraform/environments/${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
          terraform init
          terraform output -raw env_file_content > $GITHUB_WORKSPACE/.env
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: recipe-mgmt-dev  # or from infrastructure outputs
```

## Updating Configuration

### When Firebase Config Changes

If the infrastructure team updates Firebase configuration (new features, changed settings):

1. **Pull latest from infrastructure repo:**
   ```bash
   cd recipe-management-infrastructure
   git pull
   ```

2. **Re-fetch configuration:**
   ```bash
   cd terraform/environments/dev
   terraform output -raw env_file_content > /path/to/frontend/.env
   ```

3. **Restart dev server:**
   ```bash
   cd /path/to/recipe-management-frontend
   npm run dev
   ```

### Requesting Infrastructure Changes

**Examples:**
- Enable Firestore
- Add Firebase Storage
- Configure CORS rules
- Add custom domain

**Process:**
1. Open an issue in `recipe-management-infrastructure` repository
2. Describe what you need (e.g., "Need Firestore enabled for dev environment")
3. Platform team will update infrastructure
4. You'll be notified to pull new configuration

## Local Development

### First Time Setup

```bash
# 1. Clone both repositories
git clone git@github.com:theandiman/recipe-management-frontend.git
git clone git@github.com:theandiman/recipe-management-infrastructure.git

# 2. Get Firebase config
cd recipe-management-infrastructure/terraform/environments/dev
terraform init
terraform output -raw env_file_content > ../../recipe-management-frontend/.env

# 3. Start frontend
cd ../../recipe-management-frontend
npm install
npm run dev
```

### Ongoing Development

You only need to update `.env` when:
- Infrastructure is redeployed
- Firebase configuration changes
- You switch environments (dev → staging → prod)

## Firebase Projects

All Firebase projects are managed by the infrastructure repository:

- **Created via**: Terraform in infrastructure repo
- **Configured by**: Platform/DevOps team
- **Used by**: Frontend (this repo)

### Project Details

- **Dev Project**: `recipe-mgmt-dev`
  - Purpose: Development and testing
  - Auth: Email/Password enabled
  - Hosting: Enabled
  - Team access: All developers

- **Prod Project**: `recipe-mgmt-prod` (future)
  - Purpose: Production application
  - Auth: Email/Password enabled
  - Hosting: Enabled with custom domain
  - Team access: CI/CD only

## Troubleshooting

### "Firebase configuration not found"

**Solution**: Get config from infrastructure repo:
```bash
cd recipe-management-infrastructure/terraform/environments/dev
terraform output -raw env_file_content > /path/to/frontend/.env
```

### "Firebase auth not working"

**Check**:
1. Is `.env` file present?
2. Does it contain all required `VITE_FIREBASE_*` variables?
3. Try re-fetching from infrastructure repo
4. Verify Firebase project exists in GCP Console

### "Can't access infrastructure repo"

**Solution**:
- Request read access from platform team
- You need it to get Firebase configuration
- Alternative: Ask team member to share `.env` file (it's safe for client-side use)

### "Configuration outdated"

**Solution**: Infrastructure may have been redeployed, re-fetch:
```bash
cd infrastructure-repo/terraform/environments/dev
git pull
terraform refresh
terraform output -raw env_file_content > /path/to/frontend/.env
```

## Security Notes

### Safe to Commit

- ✅ `.env.example` (template with no real values)
- ✅ `firebase.json` (Firebase Hosting configuration)

### Never Commit

- ❌ `.env` (contains Firebase credentials)
- ❌ Any Terraform files (they belong in infrastructure repo)
- ❌ GCP service account keys

### About Firebase API Keys

Firebase API keys in `.env` are **safe to use client-side**. They're not secret credentials. Security is enforced by:
- Firebase Security Rules (managed in infrastructure repo)
- Firebase Authentication
- Domain restrictions (configured in infrastructure)

## Team Responsibilities

### Frontend Team (This Repo)

- ✅ Build and deploy frontend application
- ✅ Get Firebase config from infrastructure repo
- ✅ Focus on application code
- ✅ Request infrastructure changes via issues

### Platform Team (Infrastructure Repo)

- ✅ Manage all GCP projects
- ✅ Provision and configure Firebase
- ✅ Provide configuration outputs
- ✅ Handle infrastructure changes

## Getting Help

- **Firebase config issues**: Check infrastructure repo or ask platform team
- **Frontend build issues**: This repository's issues
- **Infrastructure changes**: Open issue in infrastructure repo

## Links

- **Infrastructure Repository**: https://github.com/theandiman/recipe-management-infrastructure
- **Infrastructure Documentation**: See infrastructure repo's README.md
- **Setup Guide**: See infrastructure repo's terraform/SETUP.md
