variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project prefix used in resource names"
  type        = string
  default     = "aikhub"
}

variable "ses_sender_email" {
  description = "Verified SES sender email"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock model used for paper summaries"
  type        = string
  default     = "eu.anthropic.claude-3-haiku-20240307-v1:0"
}

variable "tags" {
  description = "Common tags applied to resources"
  type        = map(string)
  default = {
    Project = "AIKnowledgeHub"
  }
}
