# Package Installation Instructions

## Backend Dependencies

If you encounter permission errors during npm install, follow these steps:

### Option 1: Clean Install (Recommended)

```powershell
# Navigate to backend
cd backend

# Remove node_modules if exists
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Install with legacy peer deps (if needed)
npm install --legacy-peer-deps
```

### Option 2: Run as Administrator

1. Open PowerShell as Administrator
2. Navigate to project:
   ```powershell
   cd "c:\Users\HP\Desktop\Mini Project\backend"
   npm install
   ```

### Option 3: Manual Package Installation

If issues persist, install packages in smaller groups:

```powershell
# Core packages
npm install express dotenv cors bcrypt jsonwebtoken sqlite3 multer

# Security packages
npm install helmet express-rate-limit compression

# Logging packages
npm install winston morgan

# Validation packages
npm install express-validator joi

# Documentation packages
npm install swagger-jsdoc swagger-ui-express

# Dev dependencies
npm install --save-dev nodemon
```

### Verify Installation

```powershell
npm list --depth=0
```

Should show all these packages:
- bcrypt
- better-sqlite3
- compression
- cors
- dotenv
- express
- express-rate-limit
- express-validator
- helmet
- joi
- jsonwebtoken
- morgan
- multer
- sqlite3
- swagger-jsdoc
- swagger-ui-express
- winston
- nodemon (dev)

## Frontend Dependencies

```powershell
cd frontend
npm install
```

Should install:
- react
- react-dom
- react-router-dom
- axios
- vite
- eslint (dev dependencies)

## Common Issues & Solutions

### EPERM Errors (Windows)

**Cause**: Files locked by antivirus or another process

**Solution**:
1. Temporarily disable antivirus
2. Close all VS Code windows
3. Close any terminal using the project
4. Run npm install again

### Port Conflicts

If port 4000 or 5173 is already in use:

**Backend**:
```env
# Change in backend/.env
PORT=4001
```

**Frontend**:
```powershell
npm run dev -- --port 5174
```

### Missing Peer Dependencies

If you see peer dependency warnings:

```powershell
npm install --legacy-peer-deps
```

### Network/Proxy Issues

If behind corporate proxy:

```powershell
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
```

## Verify Everything Works

### Backend Test

```powershell
cd backend
npm run dev
```

Should see:
```
🚀 Server running in development mode on port 4000
📚 API Documentation available at http://localhost:4000/api-docs
🏥 Health check available at http://localhost:4000/health
```

### Frontend Test

```powershell
cd frontend
npm run dev
```

Should see:
```
VITE vX.X.X  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Quick Health Check

Open browser and visit:
- http://localhost:4000/health - Should show JSON with status: "ok"
- http://localhost:4000/api-docs - Should show Swagger UI
- http://localhost:5173 - Should show login page

## If All Else Fails

1. **Delete Everything**:
   ```powershell
   cd backend
   Remove-Item node_modules, package-lock.json -Recurse -Force
   cd ../frontend
   Remove-Item node_modules, package-lock.json -Recurse -Force
   ```

2. **Reinstall Node.js**:
   - Download latest LTS from nodejs.org
   - Install fresh
   - Verify: `node --version` and `npm --version`

3. **Try npm alternatives**:
   ```powershell
   # Using yarn
   npm install -g yarn
   yarn install
   
   # Or using pnpm
   npm install -g pnpm
   pnpm install
   ```

## Contact Support

If issues persist:
- Check GitHub Issues
- Review error logs in npm-debug.log
- Contact: support@editconnect.com

---

**Note**: The packages are already listed in package.json with compatible versions.
Running `npm install` should work in most cases.
