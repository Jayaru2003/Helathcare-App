# HealthBridge

HealthBridge is a healthcare microservices monorepo built with Node.js, TypeScript, and Express. The stack uses PostgreSQL, MongoDB, Redis, and Kafka for data and messaging, with Docker Compose for local infrastructure.

## Repo layout

- services/ - Microservices (API gateway, auth, patient, appointment, prescription, billing, notification, analytics)
- libs/ - Shared libraries (DTOs, logging, middleware, Kafka helpers, error types)
- infra/terraform - Terraform modules for VPC and ECS

## Services

| Service      | Port | Description                              | Data and dependencies                |
| ------------ | ---- | ---------------------------------------- | ------------------------------------ |
| api-gateway  | 3000 | Single entry point for all microservices | Routes to auth, patient, appointment |
| auth         | 3001 | JWT auth and token management            | PostgreSQL, Redis                    |
| patient      | 3002 | Patient CRUD and medical records         | PostgreSQL (Prisma)                  |
| appointment  | 3003 | Scheduling and conflict detection        | PostgreSQL (Prisma), Kafka           |
| prescription | 3004 | Digital prescriptions                    | MongoDB                              |
| billing      | 3005 | Invoicing and payments                   | Kafka, Stripe                        |
| notification | 3006 | Notifications and delivery               | Kafka                                |
| analytics    | 3007 | Event analytics                          | Kafka                                |

## Shared libraries

- @healthbridge/dto - Shared interfaces and DTOs
- @healthbridge/errors - Common error types
- @healthbridge/kafka - Kafka helpers and clients
- @healthbridge/logger - Logging utilities
- @healthbridge/middleware - Express middleware

## Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

## Environment files

Each service has a .env.example file under services/<service>/. For local development, copy each .env.example to .env and update values as needed.

Note: docker-compose currently references .env.example for most services and .env for prescription. If you want to keep secrets out of .env.example, update docker-compose.yml to point to .env files.

## Local development (run services on host)

1. Install dependencies:

```bash
npm install
```

2. Start infrastructure containers only:

```bash
docker-compose up -d postgres mongodb redis zookeeper kafka
```

3. Generate Prisma clients and run migrations (patient and appointment):

```bash
npm run db:generate
npm run db:migrate -w @healthbridge/patient
npm run db:migrate -w @healthbridge/appointment
```

4. Start all services in dev mode:

```bash
npm run dev
```

Or run a single service:

```bash
npm run dev -w @healthbridge/api-gateway
```

## Docker Compose (full stack)

Build and run everything in containers:

```bash
npm run docker:up
```

Follow logs or stop:

```bash
npm run docker:logs
npm run docker:down
```

## Root scripts

- npm run dev - Run dev mode for all workspaces
- npm run build:libs - Build shared libraries
- npm run db:generate - Prisma generate for patient and appointment
- npm run build:services - Build all services
- npm run build - Build libs, generate Prisma, then build services
- npm test - Run tests for workspaces (if present)
- npm run lint - Lint all TypeScript files
- npm run format - Format all TypeScript files
- npm run docker:up - docker-compose up -d
- npm run docker:down - docker-compose down
- npm run docker:logs - docker-compose logs -f

## Infrastructure (Docker Compose)

Default ports from docker-compose.yml:

- PostgreSQL: 5432
- MongoDB: 27017
- Redis: 6379
- Zookeeper: 2181
- Kafka: 9092
- API Gateway: 3000
- Auth: 3001
- Patient: 3002
- Appointment: 3003
- Prescription: 3004
- Billing: 3005
- Notification: 3006
- Analytics: 3007

Common infra environment variables (with defaults in docker-compose.yml):

- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- MONGO_USER, MONGO_PASSWORD, MONGO_DB
- REDIS_PASSWORD

## Prisma

Prisma is used by the patient and appointment services. Useful commands:

```bash
npm run db:generate
npm run db:migrate -w @healthbridge/patient
npm run db:migrate -w @healthbridge/appointment
```

## Testing

```bash
npm test
```

## Linting and formatting

```bash
npm run lint
npm run format
```

## Terraform (AWS)

The infra/terraform folder includes modules for VPC and ECS. Run Terraform from infra/terraform:

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## Troubleshooting

- If a service fails on startup, verify its .env values and that dependent containers are healthy.
- Kafka can take a while to become healthy; check `docker-compose logs -f kafka`.
- If ports are already in use, adjust docker-compose.yml or stop the conflicting service.
