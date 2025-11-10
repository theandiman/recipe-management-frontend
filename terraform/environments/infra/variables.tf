variable "project_id" {
  description = "The GCP project ID for infrastructure"
  type        = string
  default     = "recipe-mgmt-infra"  # Update with your desired project ID
}

variable "billing_account" {
  description = "The billing account ID"
  type        = string
  # Set via environment variable: TF_VAR_billing_account
}

variable "org_id" {
  description = "The organization ID (use this OR folder_id, not both)"
  type        = string
  default     = null
  # Set via environment variable: TF_VAR_org_id
}

variable "folder_id" {
  description = "The folder ID (use this OR org_id, not both)"
  type        = string
  default     = null
  # Set via environment variable: TF_VAR_folder_id
}

variable "region" {
  description = "The default GCP region"
  type        = string
  default     = "us-central1"
}

variable "state_bucket_location" {
  description = "Location for Terraform state bucket"
  type        = string
  default     = "US"
}

variable "artifact_registry_location" {
  description = "Location for Artifact Registry"
  type        = string
  default     = "us-central1"
}
