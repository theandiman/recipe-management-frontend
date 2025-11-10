terraform {
  required_version = ">= 1.0"
  
  backend "gcs" {
    bucket = "recipe-mgmt-terraform-state"  # Update with your actual bucket name
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
  
  web_app_name = "Recipe Management Web App (Dev)"
  
  labels = {
    environment = "dev"
    managed_by  = "terraform"
    app         = "recipe-management"
  }
}
