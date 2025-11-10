variable "project_id" {
  description = "The GCP project ID for dev environment"
  type        = string
  default     = "recipe-mgmt-dev"  # Update with your desired project ID
}

variable "billing_account" {
  description = "The billing account ID"
  type        = string
  # Set via environment variable: TF_VAR_billing_account
  # Or get from infra project outputs
}

variable "org_id" {
  description = "The organization ID"
  type        = string
  default     = null
  # Set via environment variable: TF_VAR_org_id (if using org structure)
}

variable "folder_id" {
  description = "The folder ID (alternative to org_id)"
  type        = string
  default     = null
  # Set via environment variable: TF_VAR_folder_id
}

variable "region" {
  description = "The default GCP region"
  type        = string
  default     = "us-central1"
}
