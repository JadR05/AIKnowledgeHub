1) One-page cheat sheet (for quick sharing)
# AIKnowledgeHub — AWS Cheat Sheet (1 page)

## What this is
Serverless backend for AIKnowledgeHub using AWS + Terraform.

## Core Services
- Lambda → runs backend logic
- SQS → queues (async + retries)
- EventBridge → schedules (cron)
- SES → emails
- Bedrock → AI summaries
- Polly → text → speech
- S3 → audio storage
- CloudWatch → logs
- IAM → permissions

## Lambdas (what each does)
- **scraper-processor**
  - Fetch arXiv papers → save MongoDB
  - Push new papers → SQS (paper_queue)
  - Trigger: EventBridge (daily)

- **ai-processor**
  - Bedrock (summary) → Polly (audio) → S3 (upload)
  - Update MongoDB (summary + audioUrl)
  - Trigger: SQS (paper_queue)

- **subscription-processor**
  - Find users + match papers
  - Push email jobs → SQS (email_queue)
  - Trigger: EventBridge (daily)

- **email-sender**
  - Send emails via SES
  - Trigger: SQS (email_queue)

## Terraform files (what they control)
- providers.tf → AWS provider
- variables.tf → inputs (MongoDB, VPC, etc.)
- networking.tf → VPC endpoints (SQS, SES)
- sqs.tf → queues + DLQs
- s3.tf → audio bucket
- iam.tf → Lambda permissions
- lambdas.tf → functions + env + triggers
- eventbridge.tf → schedules
- monitoring.tf → CloudWatch logs
- outputs.tf → useful outputs

## System flow
EventBridge → scraper → MongoDB + SQS  
SQS → AI processor → Bedrock + Polly + S3 → MongoDB  
EventBridge → subscription → SQS  
SQS → email → SES

## Key idea
Monolith (Express) → Serverless (Lambda + queues)

## Common issues
- `terraform init` fails → region restriction
- emails not sending → SES not verified
- MongoDB fails → network access not allowed

2) Visual architecture diagram (clean + simple)
Version you can paste into docs (ASCII)

                ┌─────────────────────┐
                │   EventBridge       │
                │ (cron schedules)    │
                └─────────┬───────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ scraper-processor   │           │ subscription-processor │
│ (Lambda)            │           │ (Lambda)               │
└─────────┬───────────┘           └─────────┬─────────────┘
          │                                 │
          ▼                                 ▼
     MongoDB                          SQS (email_queue)
          │                                 │
          ▼                                 ▼
   SQS (paper_queue)                 ┌───────────────────┐
          │                          │ email-sender      │
          ▼                          │ (Lambda + SES)    │
┌─────────────────────┐             └───────────────────┘
│ ai-processor        │
│ (Lambda)            │
└───────┬───────┬─────┘
        │       │
        ▼       ▼
   Bedrock   Polly
        │       │
        └───┬───┘
            ▼
            S3 (audio files)
            │
            ▼
         MongoDB (updated)