# 🚀 How to Run IBM LearnHub Application

Complete guide to run both frontend and backend of your IBM LearnHub application.

## 📋 What You Have

1. **Frontend** - Single-page HTML application (`ibm-learnhub-final.html`)
2. **Backend** - Node.js/Express API with PostgreSQL database

## 🎯 Two Ways to Run

### Option A: Frontend Only (Quick Demo - No Backend)
### Option B: Full Stack (Frontend + Backend + Database)

---

## 🟢 Option A: Frontend Only (Current Setup)

**What works:**
- Browse courses
- View course details
- Enroll in courses (stored in browser)
- View "My Learning"
- Submit feedback (stored locally)
- All UI features

**What doesn't work:**
- No real data persistence
- No user authentication
- No real course content
- Data lost when browser cache is cleared

### Steps:

1. **Open the HTML file directly in browser:**
   ```bash
   # macOS
   open "Documents/BOB LEARNING/ibm-learnhub-final.html"
   
   # Windows
   start "Documents/BOB LEARNING/ibm-learnhub-final.html"
   
   # Linux
   xdg-open "Documents/BOB LEARNING/ibm-learnhub-final.html"
   ```

2. **Or use the GitHub Pages version:**
   - Visit: https://sanjaykibm.github.io/ibm-learnhub/

✅ **That's it! The frontend is already working.**

---

## 🔵 Option B: Full Stack (Recommended for Production)

This connects your frontend to the real backend API with PostgreSQL database.

### Prerequisites

Before starting, install:
- **Node.js 18+** - Download from https://nodejs.org/
- **PostgreSQL 13+** - Download from https://www.postgresql.org/download/

Check installations:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show PostgreSQL 13.x or higher
```

### Step 1: Set Up PostgreSQL Database (5 minutes)

```bash
# 1. Start PostgreSQL service
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL service from Services app

# 2. Create database
psql -U postgres -c "CREATE DATABASE ibm_learnhub;"

# 3. Load database schema
cd "Documents/BOB LEARNING/backend"
psql -U postgres -d ibm_learnhub -f database/schema.sql
```

**Expected output:**
```
CREATE TABLE
CREATE TABLE
...
INSERT 0 6
INSERT 0 14
...
```

### Step 2: Set Up Backend API (3 minutes)

```bash
# 1. Navigate to backend directory
cd "Documents/BOB LEARNING/backend"

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env file
# Open .env in your text editor and update:
```

**Edit `.env` file:**
```env
# REQUIRED: Update these values
DB_PASSWORD=your_postgres_password_here
JWT_SECRET=your_random_secret_key_here

# Optional: Keep defaults or customize
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ibm_learnhub
DB_USER=postgres
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Start Backend Server (1 minute)

```bash
# Still in backend directory
npm run dev
```

**Expected output:**
```
==================================================
🚀 IBM LearnHub Backend Server
==================================================
📍 Environment: development
🌐 Server running on port 3000
📡 API Base URL: http://localhost:3000/api/v1
🏥 Health Check: http://localhost:3000/health
==================================================
✅ Connected to PostgreSQL database
```

**Keep this terminal open!** The backend server needs to keep running.

### Step 4: Test Backend (30 seconds)

Open a **new terminal** and test:

```bash
# Test health check
curl http://localhost:3000/health

# Test API root
curl http://localhost:3000/api/v1

# Test courses endpoint
curl http://localhost:3000/api/v1/courses
```

### Step 5: Connect Frontend to Backend (2 minutes)

Now you need to update your frontend to use the backend API instead of localStorage.

**Option 5A: Use Local Server**

```bash
# In a new terminal, navigate to frontend directory
cd "Documents/BOB LEARNING"

# Start a simple HTTP server
# Python 3:
python3 -m http.server 8080

# OR Python 2:
python -m SimpleHTTPServer 8080

# OR Node.js (if you have http-server):
npx http-server -p 8080
```

Then open: http://localhost:8080/ibm-learnhub-final.html

**Option 5B: Open HTML file directly**

Just open `ibm-learnhub-final.html` in your browser. The frontend will need to be updated to call the backend API.

---

## 🧪 Verify Everything Works

### Test 1: Backend Health
```bash
curl http://localhost:3000/health
```
✅ Should return: `{"status":"healthy",...}`

### Test 2: Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ibm.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```
✅ Should return user data and JWT token

### Test 3: Get Courses
```bash
curl http://localhost:3000/api/v1/courses
```
✅ Should return list of courses

### Test 4: Frontend
Open http://localhost:8080/ibm-learnhub-final.html
✅ Should see the IBM LearnHub interface

---

## 📊 What's Running

When fully set up, you'll have:

1. **PostgreSQL Database** - Port 5432
   - Stores all data (users, courses, enrollments, etc.)

2. **Backend API Server** - Port 3000
   - Handles authentication, business logic, database operations
   - API: http://localhost:3000/api/v1

3. **Frontend Application** - Port 8080 (or file://)
   - User interface
   - Makes API calls to backend

---

## 🛑 How to Stop

```bash
# Stop backend server
# Press Ctrl+C in the terminal running npm run dev

# Stop frontend server (if using http-server)
# Press Ctrl+C in the terminal running the server

# Stop PostgreSQL (optional)
# macOS:
brew services stop postgresql

# Linux:
sudo systemctl stop postgresql
```

---

## 🔄 How to Restart

```bash
# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Start backend
cd "Documents/BOB LEARNING/backend"
npm run dev

# Start frontend (in new terminal)
cd "Documents/BOB LEARNING"
python3 -m http.server 8080
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env` file
- Check database exists: `psql -U postgres -l`

### "Port 3000 already in use"
- Change PORT in `.env` to 3001
- Or kill process: `lsof -ti:3000 | xargs kill -9`

### "npm: command not found"
- Install Node.js from https://nodejs.org/

### "psql: command not found"
- Install PostgreSQL from https://www.postgresql.org/download/

### Frontend can't connect to backend
- Check backend is running on port 3000
- Check CORS settings in backend
- Open browser console (F12) to see errors

---

## 📚 Next Steps

1. **Add Sample Data** - Create courses, users, enrollments
2. **Test Features** - Try enrolling, completing courses, submitting feedback
3. **Customize** - Modify courses, add your own content
4. **Deploy** - Deploy backend to cloud (Heroku, AWS, etc.)

---

## 🎉 Summary

**For Quick Demo (No Setup):**
- Just open `ibm-learnhub-final.html` in browser
- Or visit: https://sanjaykibm.github.io/ibm-learnhub/

**For Full Production Setup:**
1. Install PostgreSQL and Node.js
2. Create database and load schema
3. Configure backend (.env file)
4. Start backend server (npm run dev)
5. Open frontend in browser

**Need Help?**
- Backend docs: `backend/README.md`
- Quick start: `backend/QUICKSTART.md`
- Database schema: `backend/database/schema.sql`