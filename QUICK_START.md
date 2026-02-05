# 🚀 Quick Start Guide - EditFlow

Get EditFlow up and running in 5 minutes!

## Prerequisites Check ✅

```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

## 🎯 Quick Setup

### 1. Clone & Navigate
```bash
cd "Mini Project"
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend
npm install
```

Create `.env` file:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Or manually create with these contents:
```

Edit `backend/.env`:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=my_super_secret_jwt_key_at_least_32_characters_long_for_security
JWT_EXPIRES_IN=7d
DATABASE_URL=./db.sqlite
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Start backend:
```bash
npm run dev
```

✅ Backend running at: http://localhost:4000
📚 API Docs at: http://localhost:4000/api-docs

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
```

Create `.env` file:
```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000/api
VITE_ENV=development
```

Start frontend:
```bash
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## 📝 First Time Usage

### Create Test Accounts

#### 1. Create Client Account
Visit: http://localhost:5173/signup

- Name: John Client
- Email: client@test.com
- Password: Client123
- Role: Client

#### 2. Create Editor Account
Visit: http://localhost:5173/signup

- Name: Jane Editor
- Email: editor@test.com
- Password: Editor123
- Role: Editor

### Test the Flow

#### As Client (client@test.com):
1. Login
2. Go to "Create Job"
3. Post a job:
   - Title: "Edit my wedding video"
   - Description: "Need professional editing for 2-hour wedding footage..."
   - Budget: $500-$1000
   - Duration: 120 minutes

#### As Editor (editor@test.com):
1. Login
2. Browse jobs
3. View job details
4. Submit a proposal:
   - Cover Letter: "I have 5 years of experience..."
   - Proposed Price: $750

#### Back to Client:
1. View proposals for your job
2. Accept the editor's proposal
3. Project is created!

---

## 🔍 Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:4000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### Check API Documentation
Visit: http://localhost:4000/api-docs

You should see interactive Swagger UI with all endpoints.

### Check Logs
```bash
cd backend
ls logs/

# Should see:
# - combined.log
# - error.log
```

---

## 🐛 Troubleshooting

### Backend won't start?

**Port already in use:**
```bash
# Change PORT in backend/.env to 4001
PORT=4001
```

**Database error:**
```bash
# Delete and recreate database
cd backend
del db.sqlite  # Windows
rm db.sqlite   # Mac/Linux
npm run dev    # Restart - will auto-create
```

**Missing packages:**
```bash
cd backend
del node_modules -Recurse  # Windows
rm -rf node_modules        # Mac/Linux
npm install
```

### Frontend won't start?

**Port conflict:**
```bash
# Vite will automatically suggest another port
# Or force a specific port:
npm run dev -- --port 5174
```

**API connection error:**
- Check backend is running on port 4000
- Verify `VITE_API_URL` in frontend/.env
- Check browser console for CORS errors

**Build issues:**
```bash
cd frontend
del node_modules -Recurse  # Windows
rm -rf node_modules        # Mac/Linux
npm install
```

---

## 🎨 Common Tasks

### View All API Endpoints
http://localhost:4000/api-docs

### Check Application Logs
```bash
cd backend/logs
Get-Content combined.log -Tail 50  # Windows
tail -f combined.log               # Mac/Linux
```

### Reset Database
```bash
cd backend
del db.sqlite
npm run dev  # Will recreate on restart
```

### Test API with curl

**Register:**
```bash
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"Test123\"}'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123\"}'
```

---

## 🚢 Production Deployment

### Using Docker

```bash
# Copy docker environment file
Copy-Item .env.docker.example .env

# Edit .env with production values

# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Manual Deployment

#### Backend:
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

#### Frontend:
```bash
cd frontend
npm run build
# Deploy dist/ folder to static hosting
```

---

## 📚 Next Steps

1. **Read the docs**: Check README.md files
2. **Explore API**: Use Swagger UI at /api-docs
3. **Customize**: Update branding, colors, features
4. **Add features**: See ENHANCEMENTS.md for ideas
5. **Deploy**: Use Docker or manual deployment

---

## 🆘 Need Help?

- 📖 **Documentation**: See README.md in root, backend, frontend
- 🐛 **Issues**: Check ENHANCEMENTS.md troubleshooting
- 💬 **Support**: Create GitHub issue
- 📧 **Email**: support@EditFlow.com

---

## ✅ You're All Set!

Your EditFlow platform is now running professionally with:
- ✅ Secure authentication
- ✅ API documentation
- ✅ Professional logging
- ✅ Input validation
- ✅ Error handling
- ✅ Modern UI

**Happy coding! 🎉**

---

*Last updated: February 5, 2026*
