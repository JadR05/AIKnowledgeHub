output "scraper_lambda_name" {
  value = aws_lambda_function.scraper_processor.function_name
}

output "subscription_lambda_name" {
  value = aws_lambda_function.subscription_processor.function_name
}

output "email_sender_lambda_name" {
  value = aws_lambda_function.email_sender.function_name
}

output "ai_processor_lambda_name" {
  value = aws_lambda_function.ai_processor.function_name
}

output "paper_queue_url" {
  value = aws_sqs_queue.paper_queue.id
}

output "email_queue_url" {
  value = aws_sqs_queue.email_queue.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.audio_bucket.id
}