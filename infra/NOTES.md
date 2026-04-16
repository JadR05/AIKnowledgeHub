# Infra Notes & Recommendations

Tracked improvements that would harden or speed up the AIKnowledgeHub infra. None are blocking — the pipeline works end-to-end today.

---

## 1. Build speed (`build.sh`)

Current runtime is slow because:

1. **`npm install` runs fresh for every Lambda (4×).** No cache reuse between staging dirs. AWS SDK v3 is heavy (~20-30 MB, thousands of files per install).
2. **PowerShell `Compress-Archive` is used for zipping** (Git Bash doesn't ship `zip` by default). It spins up `powershell.exe` per Lambda and zips via .NET — slow on many small files.
3. **Windows NTFS + MSYS overhead** copying `node_modules` recursively.

### Quick fix — install native `zip`

```bash
pacman -S zip
```

If `pacman` isn't recognized (older Git for Windows without MSYS2), confirm `C:\Program Files\Git\usr\bin\zip.exe` exists and is on PATH. With native `zip`, `build.sh` takes the `zip -rq` branch instead of PowerShell — typically cuts total build time in half.

### Bigger fix — incremental builds

Skip `npm install` when `package.json` hasn't changed since the last build (cache a hash of `package.json` inside `builds/.hashes/<lambda>`). Turns subsequent builds from ~60s into ~10s.

---

## 2. Bedrock throttling resilience

`ai-processor` currently fails a whole SQS batch if Bedrock throttles. Add exponential backoff + jitter around the `ConverseCommand` call, and use partial batch responses (`batchItemFailures`) so only the unprocessed message IDs are retried. Pattern already in place in `email-sender` — mirror it.

---

## 3. DLQ visibility

Dead-letter queues exist for both SQS queues but nothing alerts when messages land there. Minimal ask: a CloudWatch alarm on `ApproximateNumberOfMessagesVisible > 0` on each DLQ, routed to an SNS topic subscribed to your email.

---

## 4. Subscription fallback ranking

`subscription-processor` fallback sorts papers by `views`, but `views` is never incremented anywhere. Effectively arbitrary today. Either:
- Prefer papers with `aiSummary`/`audioUrl` in the fallback ranking, or
- Increment `views` when the audio is streamed (requires a Lambda behind CloudFront).

---

## 5. Presigned audio URL lifetime

Audio links expire after 7 days (SigV4 max). If a user opens the email later, links break. Options:
- Add a `/audio/:externalId` redirector Lambda that signs on demand.
- Front the bucket with CloudFront + signed cookies/URLs (longer TTLs possible).

---

## 6. SES production access

Still in sandbox (eu-west-1). Can only email verified identities. Request production access in the SES console before onboarding real subscribers; takes ~24h for AWS to approve.

---

## 7. Cost hygiene

- NAT Gateway is the biggest steady cost (~$32/mo in eu-west-1). If ai-processor traffic volume stays low, consider a VPC endpoint for Bedrock (interface endpoint, ~$7/mo) and drop NAT entirely — all other AWS services already route via gateway/interface endpoints.
- S3 lifecycle already expires old versions after 30 days. Consider moving current audio objects to S3 Standard-IA after 60 days if listen-rate is low.

---

## 8. Observability gaps

- No CloudWatch alarms on Lambda `Errors` or `Duration` p99.
- No structured logging — everything is `console.log`/`console.error`. A tiny wrapper emitting JSON would make log queries via CloudWatch Insights far easier.

---

## 9. Tests

No unit/integration tests anywhere in `infra/lambda`. At minimum, a smoke test for the `scraper.service.js` Atom parser would catch arXiv format changes before they hit production.
