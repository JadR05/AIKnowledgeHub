resource "aws_vpc_endpoint" "sqs" {
  vpc_id             = var.vpc_id
  service_name       = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = var.private_subnet_ids
  security_group_ids = [var.lambda_security_group_id]

  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.project_name}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "ses" {
  vpc_id             = var.vpc_id
  service_name       = "com.amazonaws.${var.aws_region}.email-smtp"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = var.private_subnet_ids
  security_group_ids = [var.lambda_security_group_id]

  private_dns_enabled = true
  tags = merge(var.tags, {
    Name = "${var.project_name}-ses-endpoint"
  })
}