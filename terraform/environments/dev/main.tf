terraform {
  required_version = ">= 1.0"
  
  backend "gcs" {
    # Update this bucket name after creating the infra project
    # Get the value from: terraform output -raw terraform_state_bucket (in infra environment)
    bucket = "recipe-mgmt-infra-terraform-state"
    prefix = "environments/dev"
  }
}

provider "google" {
  region = var.region
}

provider "google-beta" {
  region = var.region
}

module "firebase_project" {
  source = "../../modules/firebase-project"
  
  project_name    = "Recipe Management (Dev)"
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.org_id
  folder_id       = var.folder_id
  
  web_app_name = "Recipe Management Web App (Dev)"
  
  labels = {
    environment = "dev"
    managed_by  = "terraform"
    app         = "recipe-management"
  }
}
