output "project_id" {
  description = "The GCP project ID"
  value       = google_project.firebase_project.project_id
}

output "project_number" {
  description = "The GCP project number"
  value       = google_project.firebase_project.number
}

output "web_app_id" {
  description = "The Firebase web app ID"
  value       = google_firebase_web_app.default.app_id
}

output "firebase_config" {
  description = "Firebase configuration object for web app"
  value = {
    api_key             = data.google_firebase_web_app_config.default.api_key
    auth_domain         = data.google_firebase_web_app_config.default.auth_domain
    project_id          = google_project.firebase_project.project_id
    storage_bucket      = lookup(data.google_firebase_web_app_config.default, "storage_bucket", "")
    messaging_sender_id = lookup(data.google_firebase_web_app_config.default, "messaging_sender_id", "")
    app_id              = google_firebase_web_app.default.app_id
  }
  sensitive = true
}

# Individual outputs for easy .env file generation
output "firebase_api_key" {
  description = "Firebase API key for .env file"
  value       = data.google_firebase_web_app_config.default.api_key
  sensitive   = true
}

output "firebase_auth_domain" {
  description = "Firebase auth domain for .env file"
  value       = data.google_firebase_web_app_config.default.auth_domain
}

output "firebase_storage_bucket" {
  description = "Firebase storage bucket for .env file"
  value       = lookup(data.google_firebase_web_app_config.default, "storage_bucket", "")
}

output "firebase_messaging_sender_id" {
  description = "Firebase messaging sender ID for .env file"
  value       = lookup(data.google_firebase_web_app_config.default, "messaging_sender_id", "")
}
