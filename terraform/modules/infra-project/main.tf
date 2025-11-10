terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# Create the infrastructure/admin project
resource "google_project" "infra_project" {
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.org_id
  folder_id       = var.folder_id
  
  labels = var.labels
}

# Enable required APIs for infrastructure
resource "google_project_service" "infra_apis" {
  project = google_project.infra_project.project_id
  
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "cloudbilling.googleapis.com",
    "iam.googleapis.com",
    "cloudbuild.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com",
    "firebase.googleapis.com",
    "serviceusage.googleapis.com",
  ])
  
  service = each.key
  
  disable_on_destroy = false
}

# Create GCS bucket for Terraform state
resource "google_storage_bucket" "terraform_state" {
  project       = google_project.infra_project.project_id
  name          = "${var.project_id}-terraform-state"
  location      = var.state_bucket_location
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 10
      with_state         = "ARCHIVED"
    }
  }
  
  labels = merge(var.labels, {
    purpose = "terraform-state"
  })
  
  depends_on = [
    google_project_service.infra_apis,
  ]
}

# Create Artifact Registry for container images
resource "google_artifact_registry_repository" "containers" {
  project       = google_project.infra_project.project_id
  location      = var.artifact_registry_location
  repository_id = var.artifact_registry_name
  description   = "Container images for Recipe Management application"
  format        = "DOCKER"
  
  labels = merge(var.labels, {
    purpose = "container-images"
  })
  
  depends_on = [
    google_project_service.infra_apis,
  ]
}

# Service account for Cloud Build (Terraform deployments)
resource "google_service_account" "terraform_deploy" {
  project      = google_project.infra_project.project_id
  account_id   = "terraform-deploy"
  display_name = "Terraform Deployment Service Account"
  description  = "Used by Cloud Build to deploy Terraform infrastructure"
  
  depends_on = [
    google_project_service.infra_apis,
  ]
}

# Service account for Cloud Build (Application deployments)
resource "google_service_account" "app_deploy" {
  project      = google_project.infra_project.project_id
  account_id   = "app-deploy"
  display_name = "Application Deployment Service Account"
  description  = "Used by Cloud Build to deploy applications"
  
  depends_on = [
    google_project_service.infra_apis,
  ]
}

# Grant terraform-deploy access to state bucket
resource "google_storage_bucket_iam_member" "terraform_state_admin" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

# Grant terraform-deploy access to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "terraform_reader" {
  project    = google_project.infra_project.project_id
  location   = google_artifact_registry_repository.containers.location
  repository = google_artifact_registry_repository.containers.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

# Grant app-deploy access to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "app_writer" {
  project    = google_project.infra_project.project_id
  location   = google_artifact_registry_repository.containers.location
  repository = google_artifact_registry_repository.containers.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.app_deploy.email}"
}

# Organization-level permissions for terraform-deploy
# These allow creating projects in the organization
resource "google_organization_iam_member" "terraform_project_creator" {
  count = var.org_id != null ? 1 : 0
  
  org_id = var.org_id
  role   = "roles/resourcemanager.projectCreator"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

resource "google_organization_iam_member" "terraform_firebase_admin" {
  count = var.org_id != null ? 1 : 0
  
  org_id = var.org_id
  role   = "roles/firebase.admin"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

resource "google_organization_iam_member" "terraform_billing_user" {
  count = var.org_id != null ? 1 : 0
  
  org_id = var.org_id
  role   = "roles/billing.user"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

# Folder-level permissions (if using folders instead of org)
resource "google_folder_iam_member" "terraform_project_creator" {
  count = var.folder_id != null ? 1 : 0
  
  folder = var.folder_id
  role   = "roles/resourcemanager.projectCreator"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}

resource "google_folder_iam_member" "terraform_firebase_admin" {
  count = var.folder_id != null ? 1 : 0
  
  folder = var.folder_id
  role   = "roles/firebase.admin"
  member = "serviceAccount:${google_service_account.terraform_deploy.email}"
}
