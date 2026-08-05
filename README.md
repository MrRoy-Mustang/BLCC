# BLCC Ticketing System V2

Clean rebuild of the BLCC ticketing system with Express.js backend and React frontend.

## Tech Stack

- **Backend:** Express.js (Node.js)
- **Frontend:** React + Vite
- **Database:** SQLite (local) / PostgreSQL (Supabase for production)
- **Payment:** Notch Pay
- **Deployment:** Vercel

## Quick Start

### 1. Start Backend

```bash
cd /home/devroy/Documents/blcc-final-v3/BLCC-V2/backend
node server.js
```

Backend will run on port 3001.

### 2. Start Frontend

```bash
cd /home/devroy/Documents/blcc-final-v3/BLCC-V2/frontend
npm run dev
```

Frontend will run on port 5173.

### 3. Access the App

Open http://localhost:5173 in your browser.

## Setup Details

### Database

The project uses SQLite for local development. The database file is `dev.db` in the backend directory.

The schema has already been initialized with `schema.sql`.

### Environment Variables

The `.env` file is already configured with credentials from the original project:
- Notch Pay keys
- QR signing secret
- JWT secret
- Admin password (default: "admin")

### API Routes

**Public Routes:**
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/tickets/retrieve` - Retrieve tickets by phone
- `GET /api/payments/status/:ref` - Check transaction status

**Webhook:**
- `POST /api/payments/webhook` - Notch Pay webhook handler

**Admin Routes (Protected):**
- `POST /api/auth/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/transactions` - Transaction list
- `GET /api/admin/export` - CSV export
- `GET /api/admin/bouncers` - List bouncers
- `POST /api/admin/bouncers` - Create bouncer
- `DELETE /api/admin/bouncers` - Delete bouncer

**Bouncer Routes (Protected):**
- `POST /api/auth/bouncer/login` - Bouncer login
- `POST /api/tickets/verify` - Verify ticket QR

### Frontend Routes

- `/` - Homepage (ticket purchase)
- `/retrieve` - Retrieve tickets by phone
- `/ticket/:ticketCode` - View ticket
- `/payment-status` - Payment status page
- `/admin` - Admin dashboard
- `/bouncer` - Bouncer console

## Features

- ✅ Standard & VIP pass purchase
- ✅ Notch Pay payment integration
- ✅ QR code generation with secure signing
- ✅ Ticket download as PNG
- ✅ Ticket retrieval by phone number
- ✅ Admin dashboard with stats
- ✅ Bouncer console with QR scanning
- ✅ CSV export of transactions
- ✅ Bouncer management

## Notch Pay Webhook Configuration

For production deployment:
1. Go to Notch Pay dashboard
2. Set webhook URL to: `YOUR_DOMAIN/api/payments/webhook`
3. Enable webhooks for: `payment.complete`, `payment.failed`, `payment.canceled`
