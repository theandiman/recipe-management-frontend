# Multi-Project Infrastructure Setup

This guide explains how to deploy the infrastructure and application environments.

## Project Structure

```
┌─────────────────────────────────────┐
│  recipe-mgmt-infra                  │  Infrastructure Project
│  ├── Terraform State (GCS)          │  ← Stores all Terraform state
│  ├── Cloud Build                    │  ← Runs Terraform & app deploys
│  ├── Artifact Registry               │  ← Stores container images
│  └── Service Accounts               │  ← terraform-deploy, app-deploy
└─────────────────────────────────────┘
          │
          ├─── Creates & Manages ───┐
          │                         │
    ┌─────▼─────────────┐    ┌─────▼─────────────┐
    │ recipe-mgmt-dev   │    │ recipe-mgmt-prod  │
    │ ├── Firebase      │    │ ├── Firebase      │
    │ ├── Cloud Run     │    │ ├── Cloud Run     │
    │ └── Cloud SQL     │    │ └── Cloud SQL     │
    └───────────────────┘    └───────────────────┘
```

## Step 1: Deploy Infrastructure Project (One-Time Bootstrap)

### Prerequisites

1. **GCP Organization or Folder Access**
   - You need permissions to create projects
   - Required roles: `Organization/Folder Admin` or `Project Creator`

2. **Billing Account**
   ```bash
   gcloud billing accounts list
   # Copy the ACCOUNT_ID
   ```

### Option A: Local Deployment (Recommended for first time)

```bash
cd terraform/environments/infra

# Initialize Terraform
terraform init

# Set variables
export TF_VAR_billing_account="YOUR_BILLING_ACCOUNT_ID"
export TF_VAR_org_id="YOUR_ORG_ID"  # OR
export TF_VAR_folder_id="YOUR_FOLDER_ID"

# Review the plan
terraform plan

# Deploy
terraform apply

# Save outputs
terraform output > infra-outputs.txt
```

### Option B: Cloud Build Deployment

```bash
# From repository root
gcloud builds submit \
  --config=cloudbuild-infra-bootstrap.yaml \
  --substitutions=_BILLING_ACCOUNT=YOUR_BILLING_ACCOUNT,_ORG_ID=YOUR_ORG_ID \
  --project=YOUR_EXISTING_PROJECT
```

### After Infrastructure Deployment

1. **Note the outputs:**
   ```bash
   cd terraform/environments/infra
   terraform output terraform_state_bucket
   # Example: recipe-mgmt-infra-terraform-state
   ```

2. **Migrate to remote state:**
   - Uncomment the `backend "gcs"` block in `terraform/environments/infra/main.tf`
   - Run: `terraform init -migrate-state`
   - Type `yes` to confirm migration

## Step 2: Configure Cloud Build in Infrastructure Project

### Set up GitHub Connection

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=recipe-mgmt-infra)
2. Click "Connect Repository"
3. Select "GitHub" and connect your repository
4. Authorize GitHub access

### Create Terraform Deployment Trigger

1. Click "Create Trigger"
2. Configure:
   - **Name**: `terraform-deploy-dev`
   - **Event**: Manual invocation (or push to main for auto-deploy)
   - **Source**: Your GitHub repository (main branch)
   - **Configuration**: Cloud Build configuration file
   - **Location**: `cloudbuild-terraform.yaml`
   - **Service Account**: `terraform-deploy@recipe-mgmt-infra.iam.gserviceaccount.com`
   - **Substitution variables**:
     - `_ENVIRONMENT`: `dev`
     - `_BILLING_ACCOUNT`: `YOUR_BILLING_ACCOUNT`
     - `_ORG_ID`: `YOUR_ORG_ID` (or leave empty if using folder_id)
     - `_FOLDER_ID`: `YOUR_FOLDER_ID` (or leave empty if using org_id)

## Step 3: Deploy Development Environment

### Update Backend Configuration

1. Edit `terraform/environments/dev/main.tf`
2. Update the backend bucket name:
   ```hcl
   backend "gcs" {
     bucket = "recipe-mgmt-infra-terraform-state"  # From infra outputs
     prefix = "environments/dev"
   }
   ```

### Deploy via Cloud Build

**Option 1: Using the Trigger**
- Go to Cloud Build → Triggers
- Find `terraform-deploy-dev`
- Click "Run Trigger"

**Option 2: Command Line**
```bash
gcloud builds submit \
  --config=cloudbuild-terraform.yaml \
  --substitutions=_ENVIRONMENT=dev,_BILLING_ACCOUNT=YOUR_BILLING_ACCOUNT,_ORG_ID=YOUR_ORG_ID \
  --project=recipe-mgmt-infra
```

**Option 3: Helper Script**
```bash
./scripts/deploy-terraform.sh dev YOUR_BILLING_ACCOUNT YOUR_ORG_ID
```

### Get Firebase Configuration

After successful deployment:

```bash
cd terraform/environments/dev
terraform init  # If not already initialized
terraform output -raw env_file_content > ../../../.env
```

This creates a `.env` file in your repository root with all Firebase credentials!

## Step 4: Verify Setup

### Check Infrastructure Project

```bash
# View all resources in infra project
gcloud projects describe recipe-mgmt-infra

# Check state bucket
gsutil ls gs://recipe-mgmt-infra-terraform-state/

# Check Artifact Registry
gcloud artifacts repositories list --project=recipe-mgmt-infra
```

### Check Dev Environment

```bash
# View dev project
gcloud projects describe recipe-mgmt-dev

# List enabled APIs
gcloud services list --enabled --project=recipe-mgmt-dev

# Check Firebase auth config
gcloud alpha identity platform config get --project=recipe-mgmt-dev
```

## Project Configuration Files

### Update for Your Organization

**1. Infrastructure Project ID**
Edit `terraform/environments/infra/variables.tf`:
```hcl
variable "project_id" {
  default = "your-org-recipe-mgmt-infra"
}
```

**2. Dev Project ID**
Edit `terraform/environments/dev/variables.tf`:
```hcl
variable "project_id" {
  default = "your-org-recipe-mgmt-dev"
}
```

**3. State Bucket** (after infra deployment)
Edit `terraform/environments/dev/main.tf`:
```hcl
backend "gcs" {
  bucket = "your-actual-bucket-name"
  prefix = "environments/dev"
}
```

## Adding Production Environment

1. **Copy dev configuration:**
   ```bash
   cp -r terraform/environments/dev terraform/environments/prod
   ```

2. **Update prod variables:**
   Edit `terraform/environments/prod/variables.tf`:
   ```hcl
   variable "project_id" {
     default = "recipe-mgmt-prod"
   }
   ```

3. **Update backend prefix:**
   Edit `terraform/environments/prod/main.tf`:
   ```hcl
   backend "gcs" {
     bucket = "recipe-mgmt-infra-terraform-state"
     prefix = "environments/prod"  # Changed from dev
   }
   ```

4. **Create Cloud Build trigger** with `_ENVIRONMENT=prod`

## Common Commands

### View Terraform State
```bash
# From infra project
cd terraform/environments/infra
terraform state list

# From dev environment
cd terraform/environments/dev
terraform state list
```

### Update Infrastructure
```bash
# Make changes to .tf files, then:
cd terraform/environments/[infra|dev|prod]
terraform plan
terraform apply
```

### Destroy Resources (Careful!)
```bash
cd terraform/environments/dev
terraform destroy  # Destroys dev environment
# Note: Don't destroy infra unless removing everything
```

## Troubleshooting

### "Project already exists"
Project IDs are globally unique. Update the `project_id` variable.

### "Permission denied" during infra bootstrap
Ensure you have `Project Creator` role at org/folder level.

### "Backend initialization required"
Run `terraform init` in the environment directory.

### "State file not found"
- Verify bucket name in backend configuration
- Ensure you have access to the state bucket
- Check that terraform-deploy SA has storage.admin on bucket

### Cloud Build fails with "Permission denied"
Verify service account has required permissions at org/folder level:
```bash
# Check service account
gcloud projects get-iam-policy recipe-mgmt-infra \
  --flatten="bindings[].members" \
  --filter="bindings.members:terraform-deploy@recipe-mgmt-infra.iam.gserviceaccount.com"
```

## Security Best Practices

1. **Never commit `.env` files** - They contain Firebase credentials
2. **Use service accounts** for Cloud Build, not user accounts
3. **Limit org-level permissions** to only terraform-deploy SA
4. **Enable state bucket versioning** (already configured)
5. **Review Terraform plans** before applying
6. **Use separate projects** for dev/prod isolation

## Cost Management

- **Infra project**: ~$5-10/month (state storage + Cloud Build)
- **Dev project**: Variable (Firebase free tier + compute usage)
- **Prod project**: Variable (depends on traffic)

Set up billing alerts in GCP Console → Billing → Budgets & alerts

## Next Steps

After infrastructure is deployed:

1. ✅ Deploy dev environment
2. ✅ Get `.env` file for local development
3. ⬜ Set up application deployment (Cloud Run, etc.)
4. ⬜ Configure CI/CD for frontend/backend
5. ⬜ Add staging environment
6. ⬜ Add production environment
