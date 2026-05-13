const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorizeRole, optionalAuth } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// ============================================
// ROUTES
// ============================================

/**
 * @route   GET /api/v1/courses
 * @desc    Get all courses with optional filtering
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, difficulty, search, limit = 50, offset = 0 } = req.query;
        
        let queryText = `
            SELECT c.*, 
                   u.first_name || ' ' || u.last_name as trainer_name,
                   COUNT(DISTINCT e.id) as enrollment_count,
                   AVG(cf.rating) as average_rating
            FROM courses c
            LEFT JOIN users u ON c.trainer_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN course_feedback cf ON c.id = cf.course_id
            WHERE c.is_active = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (category) {
            queryText += ` AND c.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        
        if (difficulty) {
            queryText += ` AND c.difficulty_level = $${paramCount}`;
            params.push(difficulty);
            paramCount++;
        }
        
        if (search) {
            queryText += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        queryText += `
            GROUP BY c.id, u.first_name, u.last_name
            ORDER BY c.created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);
        
        const result = await query(queryText, params);
        
        // Get skills for each course
        const coursesWithSkills = await Promise.all(result.rows.map(async (course) => {
            const skillsResult = await query(
                `SELECT s.id, s.name, s.category, sl.name as level
                 FROM course_skills cs
                 JOIN skills s ON cs.skill_id = s.id
                 JOIN skill_levels sl ON cs.skill_level_id = sl.id
                 WHERE cs.course_id = $1`,
                [course.id]
            );
            
            const careerLevelsResult = await query(
                `SELECT cl.id, cl.name, cl.level_order
                 FROM course_career_levels ccl
                 JOIN career_levels cl ON ccl.career_level_id = cl.id
                 WHERE ccl.course_id = $1
                 ORDER BY cl.level_order`,
                [course.id]
            );
            
            return {
                ...course,
                skills: skillsResult.rows,
                careerLevels: careerLevelsResult.rows,
                enrollmentCount: parseInt(course.enrollment_count) || 0,
                averageRating: course.average_rating ? parseFloat(course.average_rating).toFixed(1) : null
            };
        }));
        
        res.json({
            courses: coursesWithSkills,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: coursesWithSkills.length
            }
        });
        
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch courses'
        });
    }
});

/**
 * @route   GET /api/v1/courses/:id
 * @desc    Get course by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `SELECT c.*, 
                    u.first_name || ' ' || u.last_name as trainer_name,
                    u.email as trainer_email,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    AVG(cf.rating) as average_rating,
                    COUNT(DISTINCT cf.id) as feedback_count
             FROM courses c
             LEFT JOIN users u ON c.trainer_id = u.id
             LEFT JOIN enrollments e ON c.id = e.course_id
             LEFT JOIN course_feedback cf ON c.id = cf.course_id
             WHERE c.id = $1 AND c.is_active = true
             GROUP BY c.id, u.first_name, u.last_name, u.email`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Course not found'
            });
        }
        
        const course = result.rows[0];
        
        // Get course modules
        const modulesResult = await query(
            `SELECT id, title, description, module_order, duration_minutes, 
                    content_type, is_mandatory
             FROM course_modules
             WHERE course_id = $1
             ORDER BY module_order`,
            [id]
        );
        
        // Get skills
        const skillsResult = await query(
            `SELECT s.id, s.name, s.category, sl.name as level
             FROM course_skills cs
             JOIN skills s ON cs.skill_id = s.id
             JOIN skill_levels sl ON cs.skill_level_id = sl.id
             WHERE cs.course_id = $1`,
            [id]
        );
        
        // Get career levels
        const careerLevelsResult = await query(
            `SELECT cl.id, cl.name, cl.level_order
             FROM course_career_levels ccl
             JOIN career_levels cl ON ccl.career_level_id = cl.id
             WHERE ccl.course_id = $1
             ORDER BY cl.level_order`,
            [id]
        );
        
        res.json({
            course: {
                ...course,
                modules: modulesResult.rows,
                skills: skillsResult.rows,
                careerLevels: careerLevelsResult.rows,
                enrollmentCount: parseInt(course.enrollment_count) || 0,
                averageRating: course.average_rating ? parseFloat(course.average_rating).toFixed(1) : null,
                feedbackCount: parseInt(course.feedback_count) || 0
            }
        });
        
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch course'
        });
    }
});

/**
 * @route   POST /api/v1/courses
 * @desc    Create a new course
 * @access  Private (Trainer/Admin)
 */
router.post('/', 
    authenticateToken,
    authorizeRole('trainer', 'admin'),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('category').trim().notEmpty().withMessage('Category is required'),
        body('difficultyLevel').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty level'),
        body('durationHours').isFloat({ min: 0 }).withMessage('Duration must be a positive number'),
        body('cpdCredits').isInt({ min: 0 }).withMessage('CPD credits must be a positive integer')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation Error',
                    errors: errors.array()
                });
            }
            
            const {
                title,
                description,
                category,
                difficultyLevel,
                durationHours,
                cpdCredits,
                maxEnrollments,
                thumbnailUrl,
                videoUrl
            } = req.body;
            
            const result = await query(
                `INSERT INTO courses (
                    title, description, category, difficulty_level, duration_hours,
                    cpd_credits, max_enrollments, thumbnail_url, video_url, trainer_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    title, description, category, difficultyLevel, durationHours,
                    cpdCredits, maxEnrollments, thumbnailUrl, videoUrl, req.user.id
                ]
            );
            
            res.status(201).json({
                message: 'Course created successfully',
                course: result.rows[0]
            });
            
        } catch (error) {
            console.error('Create course error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to create course'
            });
        }
    }
);

/**
 * @route   PUT /api/v1/courses/:id
 * @desc    Update a course
 * @access  Private (Trainer/Admin)
 */
router.put('/:id',
    authenticateToken,
    authorizeRole('trainer', 'admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                category,
                difficultyLevel,
                durationHours,
                cpdCredits,
                maxEnrollments,
                thumbnailUrl,
                videoUrl,
                isActive
            } = req.body;
            
            // Check if course exists and user has permission
            const courseCheck = await query(
                'SELECT trainer_id FROM courses WHERE id = $1',
                [id]
            );
            
            if (courseCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Course not found'
                });
            }
            
            if (req.user.role !== 'admin' && courseCheck.rows[0].trainer_id !== req.user.id) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to update this course'
                });
            }
            
            const result = await query(
                `UPDATE courses SET
                    title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    category = COALESCE($3, category),
                    difficulty_level = COALESCE($4, difficulty_level),
                    duration_hours = COALESCE($5, duration_hours),
                    cpd_credits = COALESCE($6, cpd_credits),
                    max_enrollments = COALESCE($7, max_enrollments),
                    thumbnail_url = COALESCE($8, thumbnail_url),
                    video_url = COALESCE($9, video_url),
                    is_active = COALESCE($10, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $11
                RETURNING *`,
                [title, description, category, difficultyLevel, durationHours,
                 cpdCredits, maxEnrollments, thumbnailUrl, videoUrl, isActive, id]
            );
            
            res.json({
                message: 'Course updated successfully',
                course: result.rows[0]
            });
            
        } catch (error) {
            console.error('Update course error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update course'
            });
        }
    }
);

/**
 * @route   DELETE /api/v1/courses/:id
 * @desc    Delete a course (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id',
    authenticateToken,
    authorizeRole('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            const result = await query(
                'UPDATE courses SET is_active = false WHERE id = $1 RETURNING id',
                [id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Course not found'
                });
            }
            
            res.json({
                message: 'Course deleted successfully'
            });
            
        } catch (error) {
            console.error('Delete course error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to delete course'
            });
        }
    }
);

/**
 * @route   GET /api/v1/courses/categories/list
 * @desc    Get all unique course categories
 * @access  Public
 */
router.get('/categories/list', async (req, res) => {
    try {
        const result = await query(
            `SELECT DISTINCT category, COUNT(*) as course_count
             FROM courses
             WHERE is_active = true
             GROUP BY category
             ORDER BY category`
        );
        
        res.json({
            categories: result.rows
        });
        
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch categories'
        });
    }
});

module.exports = router;

// Made with Bob
