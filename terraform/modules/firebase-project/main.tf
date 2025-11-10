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

# Create the Firebase project
resource "google_project" "firebase_project" {
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.org_id
  
  labels = var.labels
}

# Enable required APIs
resource "google_project_service" "firebase" {
  project = google_project.firebase_project.project_id
  
  for_each = toset([
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",  # Firebase Auth
    "firebasehosting.googleapis.com",  # Firebase Hosting
    "firestore.googleapis.com",        # Firestore (optional, for future)
    "cloudbuild.googleapis.com",       # Cloud Build
  ])
  
  service = each.key
  
  disable_on_destroy = false
}

# Initialize Firebase in the project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = google_project.firebase_project.project_id
  
  depends_on = [
    google_project_service.firebase,
  ]
}

# Create Firebase web app
resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = google_project.firebase_project.project_id
  display_name = var.web_app_name
  
  depends_on = [
    google_firebase_project.default,
  ]
}

# Get the web app config
data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = google_project.firebase_project.project_id
  web_app_id = google_firebase_web_app.default.app_id
}

# Enable Firebase Authentication
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = google_project.firebase_project.project_id
  
  sign_in {
    allow_duplicate_emails = false
    
    email {
      enabled           = true
      password_required = true
    }
  }
  
  depends_on = [
    google_project_service.firebase,
  ]
}

# Configure authorized domains for Firebase Auth
resource "google_identity_platform_project_default_config" "auth_config" {
  provider = google-beta
  project  = google_project.firebase_project.project_id
  
  sign_in {
    allow_duplicate_emails = false
    
    email {
      enabled           = true
      password_required = true
    }
  }
  
  depends_on = [
    google_identity_platform_config.auth,
  ]
}
