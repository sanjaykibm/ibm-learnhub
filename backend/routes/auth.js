const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// VALIDATION RULES
// ============================================

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
    
    return { accessToken, refreshToken };
};

// ============================================
// ROUTES
// ============================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation Error',
                errors: errors.array()
            });
        }
        
        const { email, password, firstName, lastName, role = 'learner' } = req.body;
        
        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User with this email already exists'
            });
        }
        
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user and profile in a transaction
        const result = await transaction(async (client) => {
            // Insert user
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, email, first_name, last_name, role, created_at`,
                [email, passwordHash, firstName, lastName, role]
            );
            
            const user = userResult.rows[0];
            
            // Create user profile
            await client.query(
                'INSERT INTO user_profiles (user_id) VALUES ($1)',
                [user.id]
            );
            
            return user;
        });
        
        // Generate tokens
        const tokens = generateTokens(result.id);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: result.id,
                email: result.email,
                firstName: result.first_name,
                lastName: result.last_name,
                role: result.role,
                createdAt: result.created_at
            },
            ...tokens
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to register user'
        });
    }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation Error',
                errors: errors.array()
            });
        }
        
        const { email, password } = req.body;
        
        // Get user
        const result = await query(
            `SELECT id, email, password_hash, first_name, last_name, role, is_active, is_verified
             FROM users WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        const user = result.rows[0];
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Account is inactive. Please contact support.'
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Generate tokens
        const tokens = generateTokens(user.id);
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified
            },
            ...tokens
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to login'
        });
    }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required'
            });
        }
        
        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        
        // Generate new tokens
        const tokens = generateTokens(decoded.userId);
        
        res.json({
            message: 'Token refreshed successfully',
            ...tokens
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired refresh token'
            });
        }
        
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to refresh token'
        });
    }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_verified,
                    u.created_at, u.last_login,
                    up.job_title, up.department, up.location, up.bio, up.linkedin_url,
                    up.total_cpd_credits, cl.name as career_level
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             LEFT JOIN career_levels cl ON up.career_level_id = cl.id
             WHERE u.id = $1`,
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        const user = result.rows[0];
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                profile: {
                    jobTitle: user.job_title,
                    department: user.department,
                    location: user.location,
                    bio: user.bio,
                    linkedinUrl: user.linkedin_url,
                    totalCpdCredits: user.total_cpd_credits,
                    careerLevel: user.career_level
                }
            }
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user profile'
        });
    }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // This endpoint is here for consistency and can be extended for token blacklisting
    res.json({
        message: 'Logout successful'
    });
});

module.exports = router;

// Made with Bob
