variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project prefix used in resource names"
  type        = string
  default     = "aikhub"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "ses_sender_email" {
  description = "Verified SES sender email"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock model used for paper summaries"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

variable "vpc_id" {
  description = "Existing VPC ID where Lambdas will run"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC config"
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  type        = string
}

variable "tags" {
  description = "Common tags applied to resources"
  type        = map(string)
  default = {
    Project = "AIKnowledgeHub"
  }
}
