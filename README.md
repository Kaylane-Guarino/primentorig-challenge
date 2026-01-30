# Primentoring API

REST API for credits and mentorship booking system built with NestJS.

---

## 🚀 What it is

Mentorship system that allows:
- Users (mentees) to purchase credits in packages
- Schedule mentorship sessions with mentors
- Manage their bookings and transaction history

**Main stack:**
- NestJS (v11.0.1) + TypeScript (v5.7.3)
- TypeORM (v0.3.28) + PostgreSQL (v15+)
- Swagger/OpenAPI for interactive documentation
- class-validator for data validation

---

## 🏃 How to run

### 🐳 Option 1: Using Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### Run with Docker

**Single command to run everything (container runs indefinitely):**
```bash
docker-compose up --build
```

This will:
- ✅ Build the API image
- ✅ Start PostgreSQL
- ✅ Wait for database to be ready
- ✅ Run seed automatically (first time only)
- ✅ Start the API and keep the container running **indefinitely**

**The container will keep running until you manually stop it with:**
```bash
docker-compose down
```

**Configuration:**
- `restart: always` - Automatically restarts if it stops
- Node.js process keeps the container active
- Container runs in persistent mode

**Other useful commands:**
```bash
# Run in background (detached mode)
docker-compose up -d --build

# View logs (when running in background)
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes (clean everything)
docker-compose down -v

# Restart services
docker-compose restart
```

The application will be available at `http://localhost:3000` and Swagger at `http://localhost:3000/api`

**Note:** The seed script is intended only for local development and evaluation. In a real production environment, `synchronize` should be disabled and migrations should be the only schema management strategy.

---

### 💻 Option 2: Local Installation

#### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- pnpm (or npm/yarn)

#### Installation

1. **Clone and install dependencies:**
```bash
pnpm install
```

2. **Configure PostgreSQL database:**
```bash
docker run --name pg-challenge -e POSTGRES_PASSWORD=password -e POSTGRES_DB=primentoring -p 5432:5432 -d postgres:15
```

3. **Create `.env` file in the root:**
```env
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://postgres:password@localhost:5432/primentoring

# Option 2: Use individual variables
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=primentoring

PORT=3000
NODE_ENV=development
```

4. **Create tables and populate initial data:**
```bash
pnpm seed
```

5. **Run the application:**
```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

The application will be available at `http://localhost:3000`

---

## 📖 Swagger

Interactive API documentation is available at:

**http://localhost:3000/api**

Swagger allows you to test all endpoints directly in the browser, view request/response schemas, and understand the complete API structure.

---

## 📚 Main Endpoints

### Users
- `POST /users` - Create new user
- `GET /users` - List all users
- `GET /users/mentors` - List mentors
- `GET /users/mentees` - List mentees
- `GET /users/:id` - Get user by ID

**Note:** The `/users` endpoints are public to facilitate testing and development. In production, these endpoints would be protected by authentication.

### Credits
- `GET /credit-packages` - List active credit packages
- `POST /credits/purchase` - Purchase credit package
- `GET /credits/balance` - Get credit balance
- `GET /credits/transactions` - Transaction history (paginated)

### Bookings
- `POST /bookings` - Create new booking
- `GET /bookings` - List bookings (paginated, filter by status)
- `GET /bookings/:id` - Get booking details
- `DELETE /bookings/:id` - Cancel booking

---

## ⚙️ Important Decisions

### 1. Schema Management
- **Development:** Seed uses `synchronize: true` to facilitate local setup
- **Production:** Migrations should be used exclusively (disable `synchronize`)

### 2. Atomic Transactions
All critical operations (credit purchase, booking creation/cancellation) use database transactions to ensure consistency and prevent race conditions.

### 3. Robust Validation
DTOs with complete validation using `class-validator`, with custom error messages and automatic type transformation.

### 4. Modular Structure
Clear separation of responsibilities by modules (Users, Credits, Bookings), facilitating maintenance and scalability.

### 5. Error Handling
Global exception filter (`HttpExceptionFilter`) that standardizes all error responses, facilitating debugging and integration.

### 6. Simplified User Identification
Use of `X-User-Id` header as authentication mock. In production, this would be replaced by JWT tokens.

---

## 📊 Database Structure

### Entities

1. **User** - Users (mentees and mentors)
   - Fields: `id` (UUID), `email` (unique), `name`, `role` (MENTEE/MENTOR), `createdAt`, `updatedAt`

2. **CreditPackage** - Pre-defined credit packages
   - Fields: `id` (UUID), `name`, `credits`, `price`, `isActive`, `createdAt`, `updatedAt`

3. **UserCredit** - User credit balance
   - Fields: `id` (UUID), `userId` (FK), `balance`, `createdAt`, `updatedAt`
   - Relation: One record per user

4. **CreditTransaction** - Credit transaction history
   - Fields: `id` (UUID), `userId` (FK), `type` (PURCHASE/USAGE/REFUND), `amount`, `description`, `bookingId` (nullable), `createdAt`
   - Types: PURCHASE (purchase), USAGE (usage in booking), REFUND (cancellation refund)

5. **Booking** - Mentorship bookings
   - Fields: `id` (UUID), `menteeId` (FK), `mentorId` (FK), `scheduledAt`, `duration` (30 or 60), `status` (PENDING/CANCELLED/COMPLETED), `creditsCost`, `createdAt`, `updatedAt`
   - Status: PENDING (scheduled), CANCELLED (canceled), COMPLETED (completed)

---

## 💼 Detailed Business Rules

### Credit Purchase
- Validates if package exists and is active
- Adds credits to user balance atomically
- Creates PURCHASE type transaction record
- Operation performed in database transaction

### Booking Creation
- Validates if mentee has sufficient credits
- Validates if mentor exists and is available (no time conflicts)
- Validates if booking is not in the past
- Validates if booking is made at least 24h in advance
- Validates that mentee cannot book with themselves
- **Cost:** 30min = 1 credit, 60min = 2 credits
- Deducts credits atomically using database transactions
- Creates USAGE type transaction

### Booking Cancellation
- Only mentee can cancel (permission validation)
- **100% refund** if canceled ≥ 24h before scheduled time
- **50% refund** if canceled between 12-24h before scheduled time
- **No refund** if canceled < 12h before scheduled time
- Booking status is updated to CANCELLED
- A REFUND type credit transaction is created when there is a refund
- Operation performed in database transaction

### Additional Validations
- Unique email per user
- Booking times cannot conflict for the same mentor
- All dates are handled in UTC
- Race condition prevention through atomic transactions

---

## 🏗️ Architecture

### Project Structure
```
src/
├── app.module.ts              # Main module
├── main.ts                    # Application bootstrap
├── common/
│   ├── enums/                 # Shared enums (UserRole, BookingStatus, TransactionType)
│   ├── exceptions/            # Custom exceptions (BusinessException)
│   └── filters/              # Exception filters (HttpExceptionFilter)
├── modules/
│   ├── users/                 # Users module
│   ├── credits/               # Credits module
│   └── bookings/              # Bookings module
└── database/
    ├── migrations/            # TypeORM migrations
    └── seeds/                 # Seeds for initial data
```

### Architectural Decisions

1. **Manual Migrations**: Use of TypeORM migrations instead of `synchronize: true` for greater control and security in production
2. **Atomic Transactions**: All critical operations use database transactions
3. **Validation with class-validator**: DTOs with complete validation and custom error messages
4. **Swagger/OpenAPI**: Automatic API documentation available at `/api`
5. **Modular Structure**: Clear separation of responsibilities by modules
6. **Global Exception Filter**: Custom `HttpExceptionFilter` to standardize error responses
7. **CORS Enabled**: Application configured to accept requests from different origins
8. **Global ValidationPipe**: Automatic DTO validation with type transformation

### Assumptions and Considerations

- **Authentication**: JWT not implemented - uses `X-User-Id` header for identification (mock)
- **Payment**: Simulated - no integration with real payment gateway
- **Timezone**: All dates are handled in UTC
- **Concurrency**: Race condition prevention through atomic database transactions
- **Integrity**: Use of database transactions to ensure consistency in critical operations

---

## 🔄 Migrations

The project has migrations in `src/database/migrations/` for schema management in production.

### Migration Commands

```bash
# Run pending migrations
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts

# Revert last migration
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:revert -d src/database/data-source.ts

# Check migration status
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:show -d src/database/data-source.ts

# Generate new migration (after changing entities)
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/database/migrations/MigrationName -d src/database/data-source.ts
```

**Important:** 
- Migrations are idempotent - can be run multiple times without error
- TypeORM configuration file is at `src/database/data-source.ts`
- For production, disable `synchronize: true` in seed and use only migrations

---

## 🛠️ Available Scripts

```bash
# Development
pnpm start:dev          # Start in watch mode
pnpm start:debug        # Start in debug mode with watch

# Production
pnpm build              # Compile the project
pnpm start:prod         # Run the compiled version

# Database
pnpm seed               # Run seeds to populate initial data

# Code quality
pnpm lint               # Run ESLint and fix issues
pnpm format             # Format code with Prettier
```

---

## 🔧 Future Improvements

With more time, the following improvements would be implemented:

1. **Complete JWT Authentication** - Replace `X-User-Id` header with JWT tokens using NestJS guards
2. **Redis Cache** - Cache for credit packages (which rarely change) using `@nestjs/cache-manager`
3. **Notifications** - Notification system for bookings (email, push, SMS)
4. **Improved Pagination** - Cursor-based pagination for large data volumes
5. **Advanced Filters** - More filter and search options in endpoints (search by name, date, etc.)
6. **WebSockets** - Real-time notifications for bookings
7. **Improved API Documentation** - More detailed examples in Swagger
8. **Working Hours Validation** - Allow mentors to define availability
9. **Rating System** - Allow mentees to rate mentors after sessions

---

## 📄 License

UNLICENSED
