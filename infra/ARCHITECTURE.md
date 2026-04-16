# AIKnowledgeHub — AWS Lambda Architecture

This document explains how the four Lambda services fit together, how they are triggered, and how data flows through the system.

---

## High-Level Diagram

```
            ┌──────────────────────┐
            │     EventBridge      │
            │   (cron schedules)   │
            └──────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌────────────────────┐   ┌────────────────────────┐
│ scraper-processor  │   │ subscription-processor │
│      (Lambda)      │   │        (Lambda)        │
└─────────┬──────────┘   └───────────┬────────────┘
          │                          │
    MongoDB + SQS              SQS (email_queue)
          │                          │
          ▼                          ▼
  SQS (paper_queue)         ┌────────────────────┐
          │                  │   email-sender    │
          ▼                  │  (Lambda + SES)   │
┌────────────────────┐       └────────────────────┘
│   ai-processor     │
│     (Lambda)       │
└──┬──────┬──────┬───┘
   ▼      ▼      ▼
 Bedrock  Polly  S3 ── audio MP3s
                 │
                 ▼
              MongoDB (summary + audioUrl)
```

---

## Service 1 — `scraper-processor`

**Trigger:** EventBridge cron (daily, 02:00 UTC)

**Responsibility:** discover new AI research papers and fan them out for processing.

**Flow:**
1. Connect to MongoDB (reusing cached connection across invocations).
2. Call `runScraper()` to fetch papers from arXiv per topic/category.
3. Insert new papers into the `papers` collection.
4. For each topic that had new inserts, publish a message to the **`paper_queue`** SQS queue containing `{ topic, category, insertedCount }`.
5. Return counts for logging.

**Writes:** MongoDB, `paper_queue`
**Reads:** arXiv, MongoDB

---

## Service 2 — `ai-processor`

**Trigger:** SQS event source mapping on **`paper_queue`** (batch size 5)

**Responsibility:** enrich newly scraped papers with an AI summary and an audio version.

**Flow:**
1. Parse SQS message → `{ topic, insertedCount }`.
2. Query MongoDB for papers in that topic that don't yet have an `audioUrl`.
3. For each paper (skipping any already processed — idempotent on retry):
   - Call **Amazon Bedrock** (Claude) to generate a 3–4 sentence summary.
   - Call **Amazon Polly** (neural voice) to convert the summary to MP3.
   - Upload MP3 to the **S3** audio bucket at `audio/{paperId}.mp3`.
   - Update the paper in MongoDB with `summary` + `audioUrl`.

**Writes:** S3, MongoDB
**Reads:** MongoDB, Bedrock, Polly

**Failure behavior:** if the Lambda errors, SQS retries up to 3 times, then routes to `paper_dlq`.

---

## Service 3 — `subscription-processor`

**Trigger:** EventBridge cron (daily, 08:00 UTC)

**Responsibility:** figure out which users should get an email today and what papers to include.

**Flow:**
1. Connect to MongoDB.
2. Load every `Subscription` record (one per user).
3. For each user:
   - Find papers matching `subscribedTopics` created after `lastEmailSent`.
   - If none, fall back to top 5 most-viewed papers in their topics.
   - Trim the payload to the top 20 papers with a 500-char summary cap (to stay under the SQS 256 KB message limit).
   - Publish `{ email, subscribedTopics, papers }` to the **`email_queue`** SQS queue.
   - Update `lastEmailSent = now` on the user.

**Writes:** MongoDB, `email_queue`
**Reads:** MongoDB

---

## Service 4 — `email-sender`

**Trigger:** SQS event source mapping on **`email_queue`** (batch size 5)

**Responsibility:** render and deliver the digest email.

**Flow:**
1. Parse SQS message → `{ email, subscribedTopics, papers }`.
2. Build a plaintext body and an HTML body (title, topics, summary excerpt, PDF link per paper).
3. Send via **Amazon SES** using the verified sender address.
4. Report any per-record failures back to SQS via `batchItemFailures` so only failed items retry.

**Writes:** nothing persistent (email delivery only)
**Reads:** SQS

**Failure behavior:** partial-batch failures retry individually; after 3 attempts they go to `email_dlq`.

---

## Shared Concerns

### MongoDB connection
`lambda/shared/db.js` caches the Mongoose connection across Lambda invocations. `maxPoolSize: 1` keeps the connection footprint low per container, and `context.callbackWaitsForEmptyEventLoop = false` lets the container freeze cleanly.

### Queueing semantics
Both SQS queues use a **redrive policy** (`maxReceiveCount: 3`) into dedicated dead-letter queues (`paper_dlq`, `email_dlq`). This gives automatic retry with isolation of poison messages.

### Networking
`scraper-processor`, `subscription-processor`, and `ai-processor` run inside a VPC so they can reach MongoDB Atlas over a private network. VPC interface endpoints for **SQS** and **SES** let them call those services without a NAT gateway. `email-sender` runs outside the VPC — simpler and cheaper since it only talks to SES.

### Permissions
A single IAM role (`aikhub-lambda-exec`) is shared by all four Lambdas, granting the minimum set of actions each one needs: CloudWatch Logs, SQS send/receive/delete, SES send, Bedrock invoke, Polly synthesize, S3 put/get on the audio bucket, and the EC2 ENI actions required for VPC Lambdas.

### Observability
Each Lambda has a pre-created CloudWatch log group (`/aws/lambda/aikhub-*`) with 14-day retention. Log groups are declared in Terraform so retention and tagging are enforced, and the Lambdas `depends_on` them so they exist before the first invocation.

---

## How it's all managed

Everything — Lambdas, queues, S3, IAM, VPC endpoints, schedules, log groups — is defined as **Terraform** in `infra/*.tf` and deployed with a single `terraform apply`. Lambda source is packaged by `infra/build.sh`, which stages each function, copies `shared/` into the ones that need it, runs `npm install --omit=dev`, and zips the result into `infra/builds/`. Terraform picks those zips up via `filename` + `source_code_hash`, so re-running the build and applying is enough to ship code changes. Secrets (MongoDB URI, VPC IDs, SES sender) live in `terraform.tfvars` (gitignored); everything else is code.
