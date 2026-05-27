# 📚 Lekha – Digital Black Book Management System

A full-stack web application for managing academic project black books with role-based access, file uploads, guide review, and meeting logs.

---

## 🏗️ Tech Stack

| Layer       | Technology                     |
|-------------|-------------------------------|
| Frontend    | React 18, React Router v6     |
| Backend     | Node.js + Express             |
| Database    | MySQL 8+                      |
| Auth        | JWT (JSON Web Tokens)         |
| File Upload | Multer (local disk storage)   |
| Styling     | Custom CSS (dark theme)       |

---

## 📁 Project Structure

```
lekha/
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL pool connection
│   ├── controllers/
│   │   ├── authController.js   # Login, register, me
│   │   ├── projectController.js# Project CRUD
│   │   ├── fileController.js   # Upload, review, download
│   │   ├── meetingController.js# Meeting logs
│   │   └── adminController.js  # Users, stats, audit logs
│   ├── middleware/
│   │   └── auth.js             # JWT authenticate + authorize
│   ├── routes/
│   │   └── index.js            # All API routes
│   ├── uploads/                # File storage (auto-created)
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express app entry
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   ├── ProjectDetail.js
│   │   │   ├── Files.js
│   │   │   ├── Meetings.js
│   │   │   ├── Users.js
│   │   │   └── NotificationsAndLogs.js
│   │   ├── utils/
│   │   │   └── api.js          # Axios instance
│   │   ├── App.js              # Routes + layout
│   │   ├── index.css           # Global styles + design system
│   │   └── index.js
│   └── package.json
│
└── database/
    └── schema.sql              # Full MySQL schema + seed
```

---

## ⚡ Setup Instructions

### Step 1: MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run schema
source /path/to/lekha/database/schema.sql

# Verify
USE lekha_db;
SHOW TABLES;
```

### Step 2: Backend Setup

```bash
cd backend

# Copy env file
cp .env.example .env

# Edit .env with your DB credentials
nano .env

# Install dependencies
npm install

# Start server
npm run dev
# → Running on http://localhost:5000
```

**Edit `.env`:**
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=lekha_db
JWT_SECRET=lekha_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
# → Opens http://localhost:3000
```

---

## 👤 User Roles & Access

| Role    | Capabilities |
|---------|-------------|
| **Student** | Upload files, log meetings, view guide comments, view project details |
| **Guide** | Review & approve files, comment on meetings, verify meeting logs |
| **HOD** | View all projects, monitor progress, view stats |
| **Admin** | Full access: create users, manage projects, view audit logs |

---

## 🔑 Default Admin Login

```
Email:    admin@lekha.edu
Password: admin123
```

> ⚠️ Change this password after first login!

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/login          Login
POST   /api/auth/register       Register
GET    /api/auth/me             Get current user
```

### Projects
```
GET    /api/projects            List projects (role-filtered)
POST   /api/projects            Create project (admin/hod)
GET    /api/projects/:id        Project details + students
PUT    /api/projects/:id        Update project (admin/hod)
POST   /api/projects/:id/students  Add student to group
```

### Files
```
POST   /api/files/upload/:group_id  Upload file (student)
GET    /api/files/:group_id         List files for group
PUT    /api/files/:file_id/review   Review file (guide)
GET    /api/files/download/:file_id Download file
```

### Meetings
```
GET    /api/meetings/:group_id      List meetings
POST   /api/meetings                Create meeting (student)
PUT    /api/meetings/:meet_id/review Review meeting (guide)
```

### Admin
```
GET    /api/users               All users (admin)
POST   /api/users               Create user (admin)
DELETE /api/users/:id           Delete user (admin)
GET    /api/users/guides        List all guides
GET    /api/users/students      List all students
GET    /api/admin/stats         Dashboard stats
GET    /api/admin/logs          Audit logs
GET    /api/notifications       User notifications
PUT    /api/notifications/read  Mark all read
```

---

## 🚦 Project Lifecycle Flow

```
Student Uploads File
       ↓
Status: PENDING
       ↓
Guide Reviews → Comments Added
       ↓
  ┌────┴────────────────┐
  ↓                     ↓                    ↓
APPROVED          REVISION_NEEDED        REJECTED
  ↓                     ↓
Project Complete   Student Re-uploads
```

---

## 🔒 Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiry
- Role-based route guards (frontend + backend)
- File type whitelist validation
- File size limit (50MB default)
- Audit trail for all actions

---

## 🚀 Production Deployment

### Backend (Railway / Render)
1. Set environment variables in dashboard
2. `npm start` as start command
3. Use AWS S3 instead of local uploads for persistence

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. `npm run build` → deploy `build/` folder

### Database (PlanetScale / Railway MySQL)
1. Import `database/schema.sql`
2. Update `DB_*` env vars in backend

---

## 📌 Future Improvements (as per SRS)

- [ ] Plagiarism detection integration
- [ ] Analytics dashboard with charts
- [ ] Mobile app (React Native)
- [ ] AI project recommendations
- [ ] AWS S3 for file storage
- [ ] Email notifications (Nodemailer)
- [ ] Export to PDF report
