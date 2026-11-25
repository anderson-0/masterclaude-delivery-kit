# Security review pack: <client>

Answer each question in writing, with a link to the vendor documentation for every claim.

## 1. What leaves the developer's machine?
<Prompts, file contents Claude reads, tool results. Which endpoint receives them (Anthropic API, Bedrock, Vertex, gateway).>

## 2. Retention and training
<Retention period for this plan; whether code is used for training under these terms; zero-data-retention eligibility.>

## 3. Telemetry and feedback
<What is sent by default for this provider, and which environment variables turn it off.>

## 4. What developers cannot change
<Managed settings file location and content: denied paths, disabled modes, managed-only hooks/permissions, allowed marketplaces.>

```json
// managed-settings.json (draft)
```

## 5. Secrets
<Deny rules for secret files, the guardrail hook, what happens if a developer pastes a secret.>

## 6. Code review and merge
<Branch protection stays as is. Who reviews AI-assisted PRs. How AI-assisted PRs are labeled.>

## 7. Incident path
<Who to call, how to pause the pilot (kill switch), how to revoke access.>

**Reviewed by:** <security lead> · **Decision:** approved / approved with conditions / rejected · **Date:**
