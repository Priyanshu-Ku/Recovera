# Recovera

Recovera is an AI-assisted SRE platform that turns production signals into actionable remediation workflows.

Core pipeline:

`Logs -> Detection -> RCA -> Fix Generation -> PR Creation -> Safety-Gated Automation`

## Problem Statement

Modern engineering teams receive huge volumes of production logs and alerts, but root-cause investigation and remediation are still mostly manual. This slows incident response, increases downtime, and creates operational fatigue. Recovera addresses this by automating the path from detection to safe, reviewable fixes.

## Team Details

- Team Name: `Champaran Coders`
- Team Members:
  - Priyanshu Kumar (Team Lead) [https://github.com/Priyanshu8023]
  - Anshit Gupta [https://github.com/Anshit-Gupta]
  - Vedant A [https://github.com/V3DxNT]
  - Priyanshu Kumar [https://github.com/Priyanshu-Ku]

## Demo

- Demo Link: https://drive.google.com/file/d/1SfO5jKV9pYUv7NR5GFOCqIYiwpbH1St5/view?usp=drivesdk

## Key Features

### Foundation and Integrations
- GitHub authentication with NextAuth (OAuth + session handling).
- AWS credential onboarding with encryption and STS verification.
- AWS provisioning helpers for S3, IAM, Firehose, and CloudWatch.
- Cloud resource discovery and repository-to-resource mapping persistence.
- Provisioning rollback support for partial failures.

### Incident and AI Workflow
- Ingestion endpoint and log normalization pipeline.
- Rule-first incident detection with LLM fallback classification.
- Incident lifecycle models (incident, events, audits, RCA versions, actions).
- AI root-cause analysis and fix generation modules.
- Patch validation and PR creation workflow for GitHub.

### Safety and Governance
- Policy engine with explicit decision outputs:
  - `ALLOW_AUTO_PR`
  - `REQUIRE_HUMAN_APPROVAL`
  - `BLOCK_AND_ALERT`
- Safety audit logging for policy decisions and action traces.
- Guardrails for risky domains and low-confidence automation.

## Architecture Overview

Recovera follows a layered architecture:

1. Ingestion Layer
- Accepts incoming logs/events and normalizes them into a consistent internal shape.

2. Detection Layer
- Applies deterministic signatures/rules first, then uses AI only for ambiguous cases.

3. RCA + Fix Layer
- Builds root-cause hypotheses and generates constrained patch candidates.

4. Execution Layer
- Validates patches, creates branches/commits, and opens pull requests.

5. Safety Layer
- Evaluates risk and policy before allowing automated actions.

6. Observability + Audit Layer
- Persists incidents, decision artifacts, and action history for traceability.

## Tech Stack

- Frontend/API: Next.js (App Router), React, TypeScript
- Auth: NextAuth + Prisma Adapter
- Database: PostgreSQL + Prisma ORM
- AI: Vercel AI SDK providers (`@ai-sdk/google`, `@ai-sdk/xai`)
- Cloud: AWS SDK v3 (STS, S3, IAM, Firehose, CloudWatch, EC2/ECS/EKS/ECR/SSM)
- GitHub Integration: Octokit REST API
- Testing: Node test runner with `tsx`, Jest config present

## Project Structure

```text
Recovera/
├─ docs/                         # Product, architecture, and implementation docs
│  ├─ plan.md
│  ├─ architecture-roadmap.md
│  ├─ agent-build-spec.md
│  ├─ step/                      # Phase-by-phase execution docs
│  ├─ step-1/
│  ├─ step-4/
│  └─ client/                    # Auth, dashboard, DB, encryption docs
│
└─ client/                       # Next.js app + backend API routes + AI modules
   ├─ app/
   │  ├─ api/
   │  │  ├─ auth/[...nextauth]/route.ts
   │  │  ├─ github/repos/route.ts
   │  │  ├─ integration/         # setup, provision, discover, mappings
   │  │  ├─ ingest/logs/route.ts
   │  │  ├─ incidents/           # list, analyze, fix, safety, PR actions
   │  │  ├─ repositories/route.ts
   │  │  └─ user/credentials/route.ts
   │  ├─ dashboard/
   │  └─ repo/[repoName]/page.tsx
   │
   ├─ components/                # UI building blocks (dashboard, import, modals)
   ├─ lib/
   │  ├─ ai/                     # RCA, fix generator, patch validator, tests
   │  ├─ aws/                    # Provisioning/discovery/mapping helpers
   │  ├─ detection/              # Incident detection engine
   │  ├─ ingest/                 # Firehose processing + normalization + publish
   │  ├─ github/                 # PR creation helpers
   │  ├─ safety/                 # Policy engine
   │  ├─ sandbox/                # Validation runner
   │  ├─ encrypt.ts
   │  └─ prisma.ts
   │
   ├─ Agentic-AI/                # Agent brain, prompts, tooling, verification
   ├─ prisma/
   │  ├─ schema.prisma           # Full data model (users, integrations, incidents, actions)
   │  └─ migrations/
   ├─ tests/                     # detection, safety, AI, e2e suites
   └─ package.json
```

## Database Architecture (High Level)

Key domain entities in `prisma/schema.prisma`:

- Identity: `User`, `Account`, `Session`
- Cloud integration: `CloudCredential`, `Integration`, `InstanceMapping`
- Source control mapping: `Repository`
- Incident pipeline: `Incident`, `IncidentEvent`, `DetectionAudit`, `IncidentRca`
- Remediation workflow: `PatchArtifact`, `IncidentAction`
- Safety governance: `SafetyAuditLog`

## Local Setup

From `Recovera/client`:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Environment variables:
- Use `client/.env.example` as the baseline.
- Ensure secrets like `ENCRYPTION_KEY`, OAuth credentials, and database connection values are configured.

## Available Scripts

Inside `Recovera/client`:

- `npm run dev` - Start local development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Lint project
- `npm run test:ingest` - Ingestion tests
- `npm run test:replay` - AI replay suite
- `npm run test:pr-creator` - PR creator tests
- `npm run test:safety` - Safety policy tests
- `npm run test:e2e` - End-to-end pipeline tests

## Documentation Map

- Product plan: `docs/plan.md`
- Architecture and roadmap: `docs/architecture-roadmap.md`
- Agent execution spec: `docs/agent-build-spec.md`
- Client deep dives:
  - `docs/client/nextauth-documentation.md`
  - `docs/client/encryption-logic.md`
  - `docs/client/database-schema.md`
  - `docs/client/dashboard-logic.md`

