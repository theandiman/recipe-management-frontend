# Terraform Infrastructure for Recipe Management App

This directory contains Terraform configurations to provision a multi-project GCP infrastructure with Firebase.

## Quick Start

**🚀 New to this setup?** See [SETUP.md](./SETUP.md) for complete step-by-step instructions.

## Architecture

```
recipe-mgmt-infra (Infrastructure Project)
├── Terraform State (GCS bucket)
├── Cloud Build
├── Artifact Registry
└── Service Accounts
    ├── terraform-deploy
    └── app-deploy

recipe-mgmt-dev (Development Environment)
├── Firebase (Auth, Hosting, Firestore)
└── Future: Cloud Run, Cloud SQL, etc.

recipe-mgmt-prod (Production Environment)
├── Firebase (Auth, Hosting, Firestore)
└── Future: Cloud Run, Cloud SQL, etc.
```

## Structure

```
terraform/
├── modules/
│   ├── infra-project/        # Infrastructure project (state, Cloud Build, etc.)
│   └── firebase-project/     # Reusable Firebase project module
└── environments/
    ├── infra/                # Infrastructure/admin project
    ├── dev/                  # Development environment
    ├── staging/              # Staging environment (future)
    └── prod/                 # Production environment (future)
```

## Prerequisites

### 1. GCP Setup

**First: Deploy the infrastructure project**

The infrastructure project hosts Terraform state and Cloud Build. Deploy it first:

```bash
cd terraform/environments/infra

terraform init
export TF_VAR_billing_account="YOUR_BILLING_ACCOUNT"
export TF_VAR_org_id="YOUR_ORG_ID"  # or TF_VAR_folder_id
terraform apply

# After deployment, note the state bucket name
terraform output terraform_state_bucket
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## Deployment via Cloud Build

All deployments run in the `recipe-mgmt-infra` project.

### Deploy Development Environment

```bash
# Option 1: Using Cloud Build trigger (recommended)
# - Configure trigger in GCP Console
# - Manually run the trigger

# Option 2: Command line
gcloud builds submit \
  --config=cloudbuild-terraform.yaml \
  --substitutions=_ENVIRONMENT=dev,_BILLING_ACCOUNT=XXX,_ORG_ID=XXX \
  --project=recipe-mgmt-infra

# Option 3: Helper script  
./scripts/deploy-terraform.sh dev YOUR_BILLING_ACCOUNT YOUR_ORG_ID
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
