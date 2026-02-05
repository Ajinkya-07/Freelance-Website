# EditFlow Frontend

A modern, professional React-based frontend for the EditFlow freelance marketplace platform.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Key Features](#key-features)
- [Deployment](#deployment)

## ✨ Features

- **Modern UI/UX**
  - Responsive design with gradient backgrounds
  - Professional styling with CSS-in-JS
  - Loading states and error handling
  - Protected routes with role-based access control

- **Authentication**
  - JWT-based authentication with Context API
  - Automatic token management
  - Session persistence with localStorage
  - Auto-logout on token expiration

- **Job Management**
  - Browse available jobs
  - Create new job postings (clients)
  - View job details and submit proposals
  - Track job status

- **Project Workflow**
  - View project details
  - File upload and management
  - Project status tracking
  - Collaboration tools

- **User Experience**
  - Context-based state management
  - Protected routes
  - Error boundaries
  - Responsive navigation

## 🛠 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Styling**: CSS-in-JS (inline styles)
- **Linting**: ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Running backend API

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables (see [Environment Variables](#environment-variables))

5. Start the development server:
```bash
npm run dev
```

The application will start on `http://localhost:5173`

## 🔐 Environment Variables

Create a `.env` file in the frontend root:

```env
# API Configuration
VITE_API_URL=http://localhost:4000/api

# Environment
VITE_ENV=development
```

**Note**: Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API configuration
│   │   └── axios.js    # Axios instance with interceptors
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── context/        # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/          # Page components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Jobs.jsx
│   │   ├── JobDetails.jsx
│   │   ├── CreateJob.jsx
│   │   ├── JobProposals.jsx
│   │   └── ProjectDetails.jsx
│   ├── App.jsx         # Main app component
│   ├── App.css         # Global styles
│   ├── main.jsx        # Entry point
│   └── index.css       # Base CSS
├── .env.example        # Environment template
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint to check code quality
```

## 🎯 Key Features

### Authentication Context

The `AuthContext` provides centralized authentication state management:

```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Use auth methods and state
}
```

### Protected Routes

Routes can be protected and require specific roles:

```jsx
<Route
  path="/jobs/create"
  element={
    <ProtectedRoute requireRole="client">
      <CreateJob />
    </ProtectedRoute>
  }
/>
```

### API Integration

Axios instance with automatic token injection and error handling:

```jsx
import api from './api/axios';

// Automatically includes auth token
const response = await api.get('/jobs');
```

### Role-Based Access Control

Three user roles supported:
- **Client**: Post jobs, review proposals, manage projects
- **Editor**: Browse jobs, submit proposals, work on projects
- **Admin**: Full system access (future enhancement)

## 🎨 UI/UX Features

- **Gradient Backgrounds**: Modern, professional aesthetic
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: User feedback during async operations
- **Error Handling**: Clear error messages and validation
- **Smooth Transitions**: Enhanced user experience
- **Accessibility**: Semantic HTML and keyboard navigation

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Environment-Specific Builds

Update `.env` for production:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_ENV=production
```

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React and Vite
