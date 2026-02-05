# EditConnect Backend API

A professional RESTful API for a freelance marketplace connecting clients with video editors and content creators.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Scripts](#scripts)
- [Error Handling](#error-handling)
- [Logging](#logging)

## ✨ Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Client, Editor, Admin)
  - Secure password hashing with bcrypt

- **Job Management**
  - Create, read, update job listings
  - Budget and duration specifications
  - Job status tracking

- **Proposal System**
  - Editors can submit proposals
  - Clients can review and accept proposals
  - Proposal status management

- **Project Management**
  - Convert accepted proposals to projects
  - File upload and management
  - Project status tracking

- **Professional Features**
  - Request logging with Winston
  - Input validation with express-validator
  - API documentation with Swagger/OpenAPI
  - Rate limiting
  - Security headers with Helmet
  - CORS configuration
  - Compression middleware
  - Centralized error handling

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator, Joi
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston, Morgan
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration (see [Environment Variables](#environment-variables))

5. Initialize the database:
```bash
npm run init-db
```

6. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:4000`

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# JWT Configuration - Use a strong secret (minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_required
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=./db.sqlite

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

**Important**: Never commit your `.env` file to version control!

## 📚 API Documentation

Interactive API documentation is available via Swagger UI:

- **Development**: http://localhost:4000/api-docs
- **Health Check**: http://localhost:4000/health

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

#### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job (client only)
- `GET /api/jobs/:id/proposals` - Get proposals for job

#### Proposals
- `POST /api/proposals` - Submit proposal (editor only)
- `GET /api/proposals/:id` - Get proposal by ID
- `PATCH /api/proposals/:id/accept` - Accept proposal (client only)
- `PATCH /api/proposals/:id/reject` - Reject proposal (client only)

#### Projects
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/files` - Upload project file
- `GET /api/projects/:id/files` - Get project files

#### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:filename` - Download file

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── db.js
│   │   ├── env.js       # Environment validation
│   │   ├── logger.js    # Winston logger config
│   │   ├── multer.js
│   │   └── swagger.js   # API documentation config
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── proposalController.js
│   │   └── projectController.js
│   ├── middleware/      # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Proposal.js
│   │   └── Project.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── proposals.js
│   │   ├── projects.js
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   └── errors.js    # Custom error classes
│   └── server.js        # Application entry point
├── logs/                # Log files
├── uploads/             # Uploaded files
├── .env.example
├── package.json
└── README.md
```

## 🔒 Security Features

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute-force attacks
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Prevents injection attacks
- **SQL Injection Protection**: Parameterized queries

## 📜 Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)

# Production
npm start           # Start production server

# Testing
npm test            # Run tests (to be implemented)

# Database
npm run init-db     # Initialize database schema
```

## ⚠️ Error Handling

The API uses centralized error handling with custom error classes:

- `ValidationError` (400): Invalid input data
- `AuthenticationError` (401): Authentication failed
- `AuthorizationError` (403): Insufficient permissions
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Resource already exists
- `AppError` (500): Internal server error

All errors return a consistent JSON format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 📊 Logging

Winston logger is configured with multiple transports:

- **Console**: Development environment (colorized)
- **Files**:
  - `logs/combined.log` - All logs
  - `logs/error.log` - Error logs only
  - `logs/exceptions.log` - Uncaught exceptions
  - `logs/rejections.log` - Unhandled promise rejections

Log levels: `error`, `warn`, `info`, `http`, `debug`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Bug Reports

For bug reports, please create an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details

## 📞 Support

For support and questions, please contact:
- Email: support@editconnect.com
- GitHub Issues: [Project Issues](<repository-url>/issues)

---

Built with ❤️ by the EditConnect Team
