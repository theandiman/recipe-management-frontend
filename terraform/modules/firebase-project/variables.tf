variable "project_name" {
  description = "The display name for the GCP project"
  type        = string
}

variable "project_id" {
  description = "The unique project ID for GCP (must be globally unique)"
  type        = string
}

variable "billing_account" {
  description = "The billing account ID to associate with the project"
  type        = string
}

variable "org_id" {
  description = "The organization ID (optional, use folder_id instead if using folders)"
  type        = string
  default     = null
}

variable "folder_id" {
  description = "The folder ID to create the project in (optional)"
  type        = string
  default     = null
}

variable "web_app_name" {
  description = "The display name for the Firebase web app"
  type        = string
  default     = "Recipe Management Web App"
}

variable "labels" {
  description = "Labels to apply to the project"
  type        = map(string)
  default     = {}
}
