# IBM LearnHub Backend API

A comprehensive Node.js/Express backend API for the IBM LearnHub Learning Management System with PostgreSQL database.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Course Management** - Full CRUD operations for courses
- **Enrollment System** - Course enrollment and progress tracking
- **IBM Skills Framework** - Skills and competency tracking
- **Digital Badges** - Automated badge awarding system
- **Feedback System** - Course ratings and reviews
- **Analytics Dashboard** - Comprehensive learning analytics
- **CPD Credits** - Continuing Professional Development tracking
- **Career Levels** - IBM career progression tracking

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm >= 9.0.0

## 🛠️ Installation

### 1. Clone and Navigate

```bash
cd "Documents/BOB LEARNING/backend"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ibm_learnhub;

# Exit psql
\q
```

### 4. Run Database Schema

```bash
psql -U postgres -d ibm_learnhub -f database/schema.sql
```

### 5. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update with your values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ibm_learnhub
DB_USER=postgres
DB_PASSWORD=your_actual_password

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# CORS Origins (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,file://
```

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/logout` - Logout user

### Courses

- `GET /api/v1/courses` - Get all courses (with filters)
- `GET /api/v1/courses/:id` - Get course by ID
- `POST /api/v1/courses` - Create course (Trainer/Admin)
- `PUT /api/v1/courses/:id` - Update course (Trainer/Admin)
- `DELETE /api/v1/courses/:id` - Delete course (Admin)
- `GET /api/v1/courses/categories/list` - Get all categories

### Enrollments

- `POST /api/v1/enrollments` - Enroll in course
- `GET /api/v1/enrollments` - Get user's enrollments
- `GET /api/v1/enrollments/:id` - Get enrollment details
- `PUT /api/v1/enrollments/:id/complete` - Mark course as completed
- `DELETE /api/v1/enrollments/:id` - Drop course

### Users

- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile

### Skills

- `GET /api/v1/skills` - Get all skills
- `GET /api/v1/skills/user/:userId` - Get user's skills

### Badges

- `GET /api/v1/badges/user/:userId` - Get user's badges

### Feedback

- `POST /api/v1/feedback` - Submit course feedback
- `GET /api/v1/feedback/course/:courseId` - Get course feedback

### Analytics

- `GET /api/v1/analytics/dashboard` - Get dashboard analytics (Admin)
- `GET /api/v1/analytics/user/:userId` - Get user analytics
- `GET /api/v1/analytics/course/:courseId` - Get course analytics (Trainer/Admin)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### User Roles

- **learner** - Can enroll in courses, view content, submit feedback
- **trainer** - Can create and manage courses, view analytics
- **admin** - Full access to all features

## 📊 Database Schema

The database includes the following main tables:

- `users` - User accounts and authentication
- `user_profiles` - Extended user information
- `courses` - Course catalog
- `enrollments` - User course enrollments
- `course_modules` - Course content modules
- `skills` - IBM skills framework
- `user_skills` - User skill tracking
- `badge_types` - Available badge types
- `user_badges` - Awarded badges
- `career_levels` - IBM career levels
- `course_feedback` - Course ratings and reviews
- `notifications` - User notifications
- `user_activity_log` - Activity tracking

## 🧪 Testing

```bash
npm test
```

## 📝 API Response Format

### Success Response

```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Error description"
}
```

## 🔧 Development

### Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # PostgreSQL schema
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── courses.js           # Course routes
│   ├── enrollments.js       # Enrollment routes
│   ├── users.js             # User routes
│   ├── skills.js            # Skills routes
│   ├── badges.js            # Badges routes
│   ├── feedback.js          # Feedback routes
│   └── analytics.js         # Analytics routes
├── .env.example             # Environment variables template
├── package.json             # Dependencies
├── server.js                # Main server file
└── README.md                # This file
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (parameterized queries)
- Input validation with express-validator

## 📈 Performance

- Connection pooling for database
- Compression middleware
- Efficient database queries with indexes
- Transaction support for data integrity

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check database credentials in `.env`

3. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

Change the PORT in `.env`:
```env
PORT=3001
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 👥 Support

For issues and questions, please contact the development team.

## 📄 License

MIT License - see LICENSE file for details