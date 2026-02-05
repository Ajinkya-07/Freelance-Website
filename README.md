# 🎬 EditConnect - Professional Freelance Marketplace

<div align="center">

**A modern, full-stack platform connecting clients with video editors and content creators**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📖 Overview

EditConnect is a professional freelance marketplace specifically designed for the video editing and content creation industry. It facilitates seamless collaboration between clients who need editing services and talented editors looking for opportunities.

### 🎯 Key Highlights

- **Role-Based Access Control**: Separate interfaces for clients and editors
- **Complete Job Lifecycle**: From posting to proposal submission to project completion
- **File Management**: Secure upload and download of project files
- **Real-time Updates**: Track job status and proposals in real-time
- **Professional API**: RESTful API with comprehensive documentation
- **Modern Frontend**: Responsive React application with elegant UI

---

## ✨ Features

### For Clients
- ✅ Post detailed job listings with budget and timeline
- ✅ Review editor proposals with cover letters and pricing
- ✅ Accept proposals and convert to active projects
- ✅ Manage ongoing projects and files
- ✅ Track project status and deliverables

### For Editors
- ✅ Browse available job opportunities
- ✅ Submit professional proposals with custom pricing
- ✅ Access project details and requirements
- ✅ Upload work-in-progress and final deliverables
- ✅ Manage active projects

### Technical Features
- 🔐 JWT-based authentication and authorization
- 📊 Professional logging with Winston
- ✅ Input validation and sanitization
- 🛡️ Security headers and rate limiting
- 📚 Auto-generated API documentation (Swagger)
- 🎨 Modern, responsive UI with gradient design
- 🔄 State management with React Context
- 📁 File upload with Multer
- 💾 SQLite database for easy setup

---

## 🏗️ Architecture

```
EditConnect/
│
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── config/         # Configuration (DB, Logger, Swagger, etc.)
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, Validation, Error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   └── logs/               # Application logs
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── api/           # Axios configuration
│   │   ├── components/    # Reusable components
│   │   ├── context/       # State management
│   │   └── pages/         # Page components
│   └── public/            # Static assets
│
└── doc.txt                # Project documentation requirements
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Mini Project"
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Docs: http://localhost:4000/api-docs

### First Time Setup

Create a client account:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"client@example.com","password":"Pass123","role":"client"}'
```

Create an editor account:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"editor@example.com","password":"Pass123","role":"editor"}'
```

---

## 📚 Documentation

### Backend API

- **README**: [backend/README.md](backend/README.md)
- **API Documentation**: http://localhost:4000/api-docs (when server is running)
- **Health Check**: http://localhost:4000/health

### Frontend

- **README**: [frontend/README.md](frontend/README.md)
- **Component Documentation**: See inline JSDoc comments

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job (client only)
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/:id/proposals` - Get job proposals

#### Proposals
- `POST /api/proposals` - Submit proposal (editor only)
- `GET /api/proposals/:id` - Get proposal details
- `PATCH /api/proposals/:id/accept` - Accept proposal (client only)
- `PATCH /api/proposals/:id/reject` - Reject proposal (client only)

#### Projects
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/files` - Upload file
- `GET /api/projects/:id/files` - List project files

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator, Joi
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston, Morgan
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **State Management**: Context API
- **Styling**: CSS-in-JS

---

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: Prevent brute-force attacks
- **Environment Variables**: Sensitive data protection

---

## 📊 Project Status

### ✅ Completed Features
- User authentication and authorization
- Job posting and management
- Proposal submission system
- Project creation and management
- File upload functionality
- API documentation
- Professional logging
- Input validation
- Error handling
- Protected routes

### 🚧 Future Enhancements
- Real-time notifications
- Payment integration
- Advanced search and filtering
- User ratings and reviews
- Direct messaging system
- Portfolio showcase for editors
- Analytics dashboard
- Email notifications
- Advanced file preview
- Project timeline tracking

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing

Import the Postman collection or use the Swagger UI at http://localhost:4000/api-docs

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

---

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d
DATABASE_URL=./db.sqlite
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_ENV=development
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team & Support

### Contact
- **Email**: support@editconnect.com
- **GitHub Issues**: [Report a bug or request a feature]

### Contributors
Built with ❤️ by the EditConnect Team

---

## 📸 Screenshots

### Login Page
Modern gradient design with form validation

### Dashboard
Role-specific dashboard showing jobs or projects

### Job Listing
Browse available opportunities with filters

### API Documentation
Interactive Swagger UI for API exploration

---

## 🙏 Acknowledgments

- Express.js community for excellent middleware
- React team for the amazing framework
- Vite for blazing-fast development experience
- All open-source contributors

---

<div align="center">

**[⬆ Back to Top](#-editconnect---professional-freelance-marketplace)**

Made with ❤️ and ☕

</div>
