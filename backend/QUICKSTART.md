# 🚀 Quick Start Guide - IBM LearnHub Backend

Get your IBM LearnHub backend up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL 13+ installed (`psql --version`)
- ✅ npm 9+ installed (`npm --version`)

## Step-by-Step Setup

### 1️⃣ Install Dependencies (1 minute)

```bash
cd "Documents/BOB LEARNING/backend"
npm install
```

### 2️⃣ Set Up PostgreSQL Database (2 minutes)

```bash
# Start PostgreSQL (if not running)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service

# Create database
psql -U postgres -c "CREATE DATABASE ibm_learnhub;"

# Run schema
psql -U postgres -d ibm_learnhub -f database/schema.sql
```

### 3️⃣ Configure Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env file and update:
# - DB_PASSWORD=your_postgres_password
# - JWT_SECRET=generate_a_random_string_here
```

**Quick JWT Secret Generator:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Start the Server (30 seconds)

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
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

## 🧪 Test Your Setup

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-13T02:36:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

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

### Test 3: Get Courses
```bash
curl http://localhost:3000/api/v1/courses
```

## 🎯 Next Steps

1. **Test the API** - Use Postman or curl to test endpoints
2. **Connect Frontend** - Update frontend to use `http://localhost:3000/api/v1`
3. **Add Sample Data** - Create courses and enroll users
4. **Explore Analytics** - Check the analytics dashboard

## 📚 Common Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Check database connection
psql -U postgres -d ibm_learnhub -c "SELECT COUNT(*) FROM users;"
```

## 🐛 Troubleshooting

### Issue: "Database connection failed"
**Solution:** Check PostgreSQL is running and credentials in `.env` are correct

### Issue: "Port 3000 already in use"
**Solution:** Change PORT in `.env` to 3001 or kill the process using port 3000

### Issue: "Cannot find module"
**Solution:** Run `npm install` again

### Issue: "JWT_SECRET not defined"
**Solution:** Make sure `.env` file exists and has JWT_SECRET set

## 🔗 Useful Links

- API Documentation: See [README.md](README.md)
- Database Schema: See [database/schema.sql](database/schema.sql)
- Frontend Integration: Update API_BASE_URL in frontend

## ✅ Success Checklist

- [ ] PostgreSQL database created
- [ ] Schema loaded successfully
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can register a new user
- [ ] Can fetch courses

## 🎉 You're Ready!

Your IBM LearnHub backend is now running! Start building amazing learning experiences.

For detailed API documentation, see [README.md](README.md)