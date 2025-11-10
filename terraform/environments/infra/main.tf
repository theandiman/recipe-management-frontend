terraform {
  required_version = ">= 1.0"
  
  # Note: First deployment uses local state, then migrates to GCS
  # After initial apply, uncomment the backend block and run terraform init -migrate-state
  
  # backend "gcs" {
  #   bucket = "recipe-mgmt-infra-terraform-state"
  #   prefix = "infra/bootstrap"
  # }
}

provider "google" {
  region = var.region
}

provider "google-beta" {
  region = var.region
}

module "infra_project" {
  source = "../../modules/infra-project"
  
  project_name    = "Recipe Management Infrastructure"
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.org_id
  folder_id       = var.folder_id
  
  state_bucket_location      = var.state_bucket_location
  artifact_registry_location = var.artifact_registry_location
  artifact_registry_name     = "recipe-mgmt-containers"
  
  labels = {
    environment = "infra"
    managed_by  = "terraform"
    purpose     = "infrastructure"
    app         = "recipe-management"
  }
}
