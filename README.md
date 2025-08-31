# Never Forget readme

### Core Components
- **Frontend**: Next.js 15 with React 19, Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js with Prisma adapter and email provider (Mailgun)
- **Payments**: Stripe integration with subscription management
- **Messaging**: WhatsApp Cloud API for reminder delivery
- **AI**: Vercel AI SDK with OpenAI for reminder processing

## Prisma

### Viewing Prisma tables in dev

`npx prisma studio`

### Prisma migrations

After making changes to the prisma schema, they can be applied into the local db with the following commands:

#### Running a schema migration: dev

`npx prisma migrate dev —name <meaningful-name>`

`npx prisma generate`

#### Running a schema migration: prod

Build commands are configured to run a new schema migration with each new build.


# mermaid

## flow graph

```mermaid
graph TD
  User((User))
  WA[WhatsApp]
  Webhook["/api/whatsapp/webhook"]
  Cron[Vercel Cron]
  Plan["/api/agent/plan"]
  Reflect["/api/agent/reflect"]
  Primary[Primary Orchestrator]
  DB[(Postgres/Supabase)]
  Queues[Vercel Queues / QStash]
  LLM[Vercel AI SDK + LLM]
  GCal[Google Calendar - read]
  WA_API[WhatsApp Cloud API]

  User --> WA
  WA --> Webhook
  Cron --> Plan
  Cron --> Reflect

  subgraph NJS["Next.js (Vercel)"]
    Plan --> Primary
    Reflect --> Primary
    Webhook --> Primary
    Primary --> DB
    Primary --> Queues
    Primary --> LLM
    Primary --> GCal
  end

  Queues --> WA_API
  WA_API --> User  
```
## sequence flow


```mermaid
sequenceDiagram
  participant Cron as Vercel Cron
  participant Plan as /api/agent/plan
  participant Prim as Primary Orchestrator
  participant DB as Postgres
  participant GCal as Google Calendar
  participant LLM as Planner (LLM)
  participant Q as Queue/Scheduler
  Cron->>Plan: invoke (daily 08:00 Europe/London)
  Plan->>Prim: start run
  Prim->>DB: load tasks/preferences
  Prim->>GCal: fetch busy blocks (read-only)
  Prim->>LLM: prioritize+plan (batched)
  LLM-->>Prim: structured Plan[]
  Prim->>Prim: validate (overlaps, SLAs)
  Prim->>DB: persist Plan & Notifications
  Prim->>Q: enqueue WhatsApp sends (sendAt)
  Q-->>User: WhatsApp reminders at times
```

## whatsapp flow

```mermaid

sequenceDiagram
  participant WA as WhatsApp Cloud API
  participant Hook as /api/whatsapp/webhook
  participant Prim as Primary Orchestrator
  participant DB as Postgres
  WA->>Hook: POST message (user reply)
  Hook->>Prim: normalize event
  Prim->>DB: update task status / reschedule
  Prim-->>WA: (optional) confirmation message
```


## deployment topology

```mermaid
graph LR
  Dev[Your Mac - local]--deploy-->Vercel[Vercel Next.js]
  Vercel--env vars-->Secrets[Vercel Env]
  Vercel--->Supabase[(Supabase Postgres + pgvector)]
  Vercel--->Queues[Vercel Queues / Upstash QStash]
  Vercel--->LLMAPI[OpenAI via Vercel AI SDK]
  Vercel--->GAuth[Google OAuth - Auth.js]
  Vercel--webhook-->WhatsApp[Meta WhatsApp Cloud API]
  Sentry[Sentry]-. traces/errors .->Vercel
  Langfuse[Langfuse]-. LLM traces .->Vercel
```

## model

```mermaid
classDiagram
  class Task {
    id: string
    user_id: string
    title: string
    est_minutes: int?
    priority: enum(L,M,H)
    due: datetime?
    status: enum(todo,doing,done)
    updated_at: datetime
  }
  class Plan {
    id: string
    user_id: string
    date: date
    created_at: datetime
  }
  class PlanItem {
    id: string
    plan_id: string
    task_id: string
    start: datetime
    end: datetime
    channel: string
  }
  class Notification {
    id: string
    plan_item_id: string
    to: string
    body: string
    send_at: datetime
    wa_msg_id: string?
    status: enum(queued,sent,failed)
  }
  class RunLog {
    id: string
    run_type: enum(plan,reflect,webhook)
    started_at: datetime
    ended_at: datetime
    input_json: jsonb
    output_json: jsonb
    error: text?
  }

  Task "1" <-- "0..*" PlanItem : schedules
  Plan "1" <-- "0..*" PlanItem : contains
  PlanItem "1" <-- "0..1" Notification : triggers
```