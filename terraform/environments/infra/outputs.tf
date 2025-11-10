output "project_id" {
  description = "The infrastructure project ID"
  value       = module.infra_project.project_id
}

output "terraform_state_bucket" {
  description = "The GCS bucket for Terraform state"
  value       = module.infra_project.terraform_state_bucket
}

output "artifact_registry_url" {
  description = "The Artifact Registry URL for container images"
  value       = module.infra_project.artifact_registry_url
}

output "terraform_deploy_sa" {
  description = "Terraform deployment service account email"
  value       = module.infra_project.terraform_deploy_sa_email
}

output "app_deploy_sa" {
  description = "Application deployment service account email"
  value       = module.infra_project.app_deploy_sa_email
}

output "cloud_build_config" {
  description = "Cloud Build configuration summary"
  value       = module.infra_project.cloud_build_config
}

output "next_steps" {
  description = "Instructions for next steps"
  value = <<-EOT
    Infrastructure project created successfully!
    
    Next steps:
    
    1. Migrate to remote state:
       - Uncomment the backend "gcs" block in main.tf
       - Run: terraform init -migrate-state
    
    2. Update dev environment:
       - Edit terraform/environments/dev/main.tf
       - Update backend bucket to: ${module.infra_project.terraform_state_bucket}
    
    3. Configure Cloud Build:
       - Project: ${module.infra_project.project_id}
       - Service Account: ${module.infra_project.terraform_deploy_sa_email}
       - Connect GitHub repository
       - Create triggers using cloudbuild-terraform.yaml
    
    4. Container images will be stored at:
       ${module.infra_project.artifact_registry_url}
  EOT
}
