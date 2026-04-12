resource "aws_cloudwatch_log_group" "scraper_processor" {
  name              = "/aws/lambda/${aws_lambda_function.scraper_processor.function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "subscription_processor" {
  name              = "/aws/lambda/${aws_lambda_function.subscription_processor.function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "email_sender" {
  name              = "/aws/lambda/${aws_lambda_function.email_sender.function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "ai_processor" {
  name              = "/aws/lambda/${aws_lambda_function.ai_processor.function_name}"
  retention_in_days = 14
  tags              = var.tags
}