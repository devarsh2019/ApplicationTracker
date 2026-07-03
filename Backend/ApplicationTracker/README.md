# Application Tracker API

Spring Boot 3.3 + Java 17 + PostgreSQL auth backend.

## Prerequisites

- Java 17+
- Maven 3.9+ (or use `./mvnw` once wrapper is installed)
- Docker (optional, for PostgreSQL)

## Environment variables

Copy `.env.example` to `.env` and set your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `application_tracker` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `SERVER_PORT` | API port | `8080` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:4200` |
| `JWT_SECRET` | Signing secret (min 32 chars) | change in production |
| `JWT_ACCESS_EXPIRATION_MS` | Access token TTL | `3600000` (1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh token TTL | `604800000` (7 days) |
| `JWT_REMEMBER_ME_REFRESH_EXPIRATION_MS` | Remember-me refresh TTL | `2592000000` (30 days) |
| `PASSWORD_RESET_EXPIRATION_MS` | Reset token TTL | `3600000` (1 hour) |

Export variables before running (Spring Boot reads them automatically):

```bash
export $(grep -v '^#' .env | xargs)
```

## Start PostgreSQL

```bash
docker compose up -d
```

## Run the API

```bash
mvn spring-boot:run
```

API base URL: `http://localhost:8080`

## Auth endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Bearer token |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/auth/logout` | Bearer token |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |

## Demo user

On first startup, a demo account is seeded:

- Email: `demo@applicationtracker.com`
- Password: `Password123`

Password reset tokens are logged to the console in development (email service not wired yet).
