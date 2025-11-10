variable "project_name" {
  description = "The display name for the infrastructure project"
  type        = string
}

variable "project_id" {
  description = "The unique project ID for the infrastructure project"
  type        = string
}

variable "billing_account" {
  description = "The billing account ID to associate with the project"
  type        = string
}

variable "org_id" {
  description = "The organization ID (use this OR folder_id, not both)"
  type        = string
  default     = null
}

variable "folder_id" {
  description = "The folder ID to create the project in (use this OR org_id, not both)"
  type        = string
  default     = null
}

variable "state_bucket_location" {
  description = "The location for the Terraform state bucket"
  type        = string
  default     = "US"
}

variable "artifact_registry_location" {
  description = "The location for the Artifact Registry"
  type        = string
  default     = "us-central1"
}

variable "artifact_registry_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "recipe-mgmt-containers"
}

variable "labels" {
  description = "Labels to apply to the project and resources"
  type        = map(string)
  default     = {}
}
