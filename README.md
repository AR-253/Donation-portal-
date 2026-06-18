# GiveHope — Donation Management Portal

A full-stack donation portal designed for managing charity campaigns, securely processing donor contributions, and providing administrative insights.

---

## Tech Stack

- **Frontend:** React.js + Vite + TailwindCSS v4 + Recharts + React Hot Toast
- **Backend:** Node.js + Express.js + MySQL
- **Database:** Raw SQL Queries (no ORM)
- **Security:** Helmet.js, Express Rate Limit (auth routes), Input validation
- **Authentication:** JWT + bcryptjs
- **Email Receipts:** Nodemailer (Gmail SMTP service)

---

## Directory Layout

```
givehope/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Home, Login, Register, Campaigns, CampaignDetail, Dashboard, NotFound
│   │   │   └── admin/       # Dashboard, Campaigns, Donations, Users
│   │   ├── components/      # Navbar, CampaignCard, DonationForm, ProgressBar, ProtectedRoute, AdminLayout
│   │   ├── context/         # AuthContext.jsx
│   │   ├── api/             # axios.js (base config)
│   │   └── App.jsx
│   └── package.json
├── server/                  # Node/Express backend
│   ├── routes/              # auth.js, campaigns.js, donations.js, admin.js
│   ├── middleware/          # auth.js (JWT verify), admin.js (role check)
│   ├── db/                  # connection.js, schema.sql
│   ├── controllers/         # authController.js, campaignController.js, donationController.js
│   ├── utils/               # sendReceipt.js (Nodemailer service)
│   └── server.js
├── package.json             # Root runner config
└── README.md
```

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MySQL](https://www.mysql.com/) server running

### 1. Database Setup
1. Connect to your local MySQL instance.
2. Create a database named `givehope_db`.
3. Open and execute the raw queries found inside [schema.sql](file:///d:/donation%20portal/givehope/server/db/schema.sql) to create the `users`, `campaigns`, `donations`, and `receipts` tables with index mappings.

### 2. Environment Setup (Backend)
1. Create a `.env` file inside the [server/](file:///d:/donation%20portal/givehope/server/) folder:
   ```bash
   # In server/ directory
   cp .env.example .env
   ```
2. Update the `.env` parameters with your local credentials:
   - `DB_USER` and `DB_PASSWORD` (MySQL credentials)
   - `JWT_SECRET` (Secure string for token encryption)
   - `EMAIL_USER` and `EMAIL_PASS` (Gmail app password credentials for email receipts)

### 3. Run the Entire Project (Concurrently)
You can build, setup database, and start both the client and server concurrently from the root directory (`givehope/`):
1. Install dependencies:
   ```bash
   # Installs root, client, and server dependencies
   npm install && npm run install-all
   ```
2. Run automatic database and tables setup:
   ```bash
   npm run db:setup
   ```
3. Load featured mock campaigns and default accounts (Seeding):
   ```bash
   npm run db:seed
   ```
4. Start both development servers:
   ```bash
   npm start
   ```
   This will automatically spin up:
   - **Backend Server** running on `http://localhost:5000`
   - **Vite React Frontend** running on `http://localhost:5173`

---

## Production Security Measures
- **Helmet.js:** Enforces secure headers protecting from XSS, clickjacking, and mime-type sniffing.
- **Express Rate Limit:** Applied to `/api/auth/register` and `/api/auth/login` to prevent brute-force authentication attacks (restricted to 5 requests per 15 minutes).
- **CORS Config:** Hardcoded to authorize requests matching `CLIENT_URL` only.
- **Input Sanitization:** Provided through validator chains (`express-validator`) on registration and login.
