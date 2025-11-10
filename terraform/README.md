# Terraform Infrastructure for Recipe Management App

This directory contains Terraform configurations to provision Firebase projects via GCP Cloud Build.

## Structure

```
terraform/
├── modules/
│   └── firebase-project/     # Reusable Firebase project module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/                  # Development environment
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── staging/              # Staging environment (future)
    └── prod/                 # Production environment (future)
```

## Prerequisites

### 1. GCP Setup

1. **Create a GCS bucket for Terraform state**:
   ```bash
   gsutil mb -p YOUR_ADMIN_PROJECT gs://recipe-mgmt-terraform-state
   gsutil versioning set on gs://recipe-mgmt-terraform-state
   ```

2. **Update backend configuration**:
   Edit `terraform/environments/dev/main.tf` and update the bucket name in the `backend "gcs"` block.

3. **Create Cloud Build service account** (or use default):
   ```bash
   gcloud iam service-accounts create terraform-deploy \
     --display-name="Terraform Deployment Service Account"
   ```

4. **Grant required permissions**:
   ```bash
   # Replace YOUR_PROJECT with your Cloud Build project
   # Replace YOUR_ORG_ID with your organization ID
   
   gcloud organizations add-iam-policy-binding YOUR_ORG_ID \
     --member="serviceAccount:terraform-deploy@YOUR_PROJECT.iam.gserviceaccount.com" \
     --role="roles/resourcemanager.projectCreator"
   
   gcloud organizations add-iam-policy-binding YOUR_ORG_ID \
     --member="serviceAccount:terraform-deploy@YOUR_PROJECT.iam.gserviceaccount.com" \
     --role="roles/firebase.admin"
   
   gcloud organizations add-iam-policy-binding YOUR_ORG_ID \
     --member="serviceAccount:terraform-deploy@YOUR_PROJECT.iam.gserviceaccount.com" \
     --role="roles/billing.projectManager"
   ```

### 2. Update Configuration

1. **Update project ID**:
   Edit `terraform/environments/dev/variables.tf` and set your desired `project_id` (must be globally unique).

2. **Set your billing account**:
   Get your billing account ID:
   ```bash
   gcloud billing accounts list
   ```

## Deployment via Cloud Build

### Method 1: Manual Cloud Build Trigger

```bash
gcloud builds submit \
  --config=cloudbuild-terraform.yaml \
  --substitutions=_ENVIRONMENT=dev,_BILLING_ACCOUNT=YOUR_BILLING_ACCOUNT_ID,_ORG_ID=YOUR_ORG_ID \
  --project=YOUR_CLOUDBUILD_PROJECT
```

### Method 2: Create Cloud Build Trigger

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Configure:
   - **Name**: `terraform-deploy-dev`
   - **Event**: Manual invocation (or branch push)
   - **Source**: Connect your GitHub repository
   - **Configuration**: Cloud Build configuration file
   - **Location**: `cloudbuild-terraform.yaml`
   - **Substitution variables**:
     - `_ENVIRONMENT`: `dev`
     - `_BILLING_ACCOUNT`: Your billing account ID
     - `_ORG_ID`: Your organization ID (or leave empty if using folders)
   - **Service account**: Select the service account with required permissions

### Method 3: Local Development (Optional)

```bash
cd terraform/environments/dev

# Initialize
terraform init

# Plan
export TF_VAR_billing_account="YOUR_BILLING_ACCOUNT_ID"
export TF_VAR_org_id="YOUR_ORG_ID"
terraform plan

# Apply
terraform apply
```

## Getting Firebase Config

After Terraform completes, get your Firebase configuration:

```bash
cd terraform/environments/dev

# Get all outputs
terraform output

# Get .env file content (sensitive, so need -raw)
terraform output -raw env_file_content > ../../../.env
```

This will create a `.env` file in your project root with all the Firebase configuration!

## Adding New Environments

To add staging or production:

1. Copy `terraform/environments/dev/` to `terraform/environments/staging/`
2. Update the project_id in `variables.tf`
3. Update the backend prefix in `main.tf` (e.g., `prefix = "environments/staging"`)
4. Create a new Cloud Build trigger with `_ENVIRONMENT=staging`

## Outputs

After successful deployment, you'll get:

- `project_id`: The GCP project ID
- `firebase_config`: Complete Firebase configuration object
- `env_file_content`: Ready-to-use .env file content

## Troubleshooting

### "Project ID already exists"
Project IDs are globally unique. Change the `project_id` in `variables.tf`.

### "Billing account not found"
Ensure the billing account ID is correct and the service account has `roles/billing.projectManager`.

### "Organization not found"
If not using an organization, use `folder_id` instead of `org_id` in the module call.

### "Permission denied"
Ensure the Cloud Build service account has all required roles (see Prerequisites).

## Security Notes

- Terraform state is stored in GCS with versioning enabled
- Firebase API keys are marked as sensitive in outputs
- Use `terraform output -raw env_file_content` to avoid exposing in logs
- Never commit `.env` files to version control

## Clean Up

To destroy resources (be careful!):

```bash
cd terraform/environments/dev
terraform destroy
```

Or via Cloud Build with a custom step.
