output "project_id" {
  description = "The dev Firebase project ID"
  value       = module.firebase_project.project_id
}

output "firebase_config" {
  description = "Complete Firebase configuration"
  value       = module.firebase_project.firebase_config
  sensitive   = true
}

# Outputs formatted for .env file
output "env_file_content" {
  description = "Content for .env file - copy this to your .env"
  value = <<-EOT
    # Firebase Configuration (Dev Environment)
    VITE_FIREBASE_API_KEY=${module.firebase_project.firebase_api_key}
    VITE_FIREBASE_AUTH_DOMAIN=${module.firebase_project.firebase_auth_domain}
    VITE_FIREBASE_PROJECT_ID=${module.firebase_project.project_id}
    VITE_FIREBASE_STORAGE_BUCKET=${module.firebase_project.firebase_storage_bucket}
    VITE_FIREBASE_MESSAGING_SENDER_ID=${module.firebase_project.firebase_messaging_sender_id}
    VITE_FIREBASE_APP_ID=${module.firebase_project.web_app_id}
  EOT
  sensitive   = true
}
