output "project_id" {
  description = "The infrastructure project ID"
  value       = google_project.infra_project.project_id
}

output "project_number" {
  description = "The infrastructure project number"
  value       = google_project.infra_project.number
}

output "terraform_state_bucket" {
  description = "The GCS bucket name for Terraform state"
  value       = google_storage_bucket.terraform_state.name
}

output "artifact_registry_repository" {
  description = "The Artifact Registry repository name"
  value       = google_artifact_registry_repository.containers.name
}

output "artifact_registry_location" {
  description = "The Artifact Registry location"
  value       = google_artifact_registry_repository.containers.location
}

output "artifact_registry_url" {
  description = "The full Artifact Registry repository URL"
  value       = "${google_artifact_registry_repository.containers.location}-docker.pkg.dev/${google_project.infra_project.project_id}/${google_artifact_registry_repository.containers.name}"
}

output "terraform_deploy_sa_email" {
  description = "The email of the Terraform deployment service account"
  value       = google_service_account.terraform_deploy.email
}

output "app_deploy_sa_email" {
  description = "The email of the application deployment service account"
  value       = google_service_account.app_deploy.email
}

output "cloud_build_config" {
  description = "Configuration values for Cloud Build"
  value = {
    project_id              = google_project.infra_project.project_id
    state_bucket            = google_storage_bucket.terraform_state.name
    artifact_registry_url   = "${google_artifact_registry_repository.containers.location}-docker.pkg.dev/${google_project.infra_project.project_id}/${google_artifact_registry_repository.containers.name}"
    terraform_sa            = google_service_account.terraform_deploy.email
    app_deploy_sa           = google_service_account.app_deploy.email
  }
}
