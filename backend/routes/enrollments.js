const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/v1/enrollments
 * @desc    Enroll in a course
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;
        
        if (!courseId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Course ID is required'
            });
        }
        
        // Check if course exists and is active
        const courseResult = await query(
            'SELECT id, title, max_enrollments FROM courses WHERE id = $1 AND is_active = true',
            [courseId]
        );
        
        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Course not found or inactive'
            });
        }
        
        // Check if already enrolled
        const existingEnrollment = await query(
            'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );
        
        if (existingEnrollment.rows.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Already enrolled in this course'
            });
        }
        
        // Check enrollment limit
        const course = courseResult.rows[0];
        if (course.max_enrollments) {
            const enrollmentCount = await query(
                'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1',
                [courseId]
            );
            
            if (parseInt(enrollmentCount.rows[0].count) >= course.max_enrollments) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Course enrollment limit reached'
                });
            }
        }
        
        // Create enrollment
        const result = await query(
            `INSERT INTO enrollments (user_id, course_id)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, courseId]
        );
        
        res.status(201).json({
            message: 'Successfully enrolled in course',
            enrollment: result.rows[0]
        });
        
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to enroll in course'
        });
    }
});

/**
 * @route   GET /api/v1/enrollments
 * @desc    Get user's enrollments
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        
        let queryText = `
            SELECT e.*, c.title, c.description, c.category, c.thumbnail_url,
                   c.duration_hours, c.cpd_credits,
                   u.first_name || ' ' || u.last_name as trainer_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON c.trainer_id = u.id
            WHERE e.user_id = $1
        `;
        
        const params = [req.user.id];
        
        if (status) {
            queryText += ' AND e.status = $2';
            params.push(status);
        }
        
        queryText += ' ORDER BY e.enrollment_date DESC';
        
        const result = await query(queryText, params);
        
        res.json({
            enrollments: result.rows
        });
        
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch enrollments'
        });
    }
});

/**
 * @route   GET /api/v1/enrollments/:id
 * @desc    Get enrollment details
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `SELECT e.*, c.title, c.description, c.category,
                    c.duration_hours, c.cpd_credits
             FROM enrollments e
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = $1 AND e.user_id = $2`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Enrollment not found'
            });
        }
        
        // Get module progress
        const progressResult = await query(
            `SELECT mp.*, cm.title, cm.module_order
             FROM module_progress mp
             JOIN course_modules cm ON mp.module_id = cm.id
             WHERE mp.enrollment_id = $1
             ORDER BY cm.module_order`,
            [id]
        );
        
        res.json({
            enrollment: {
                ...result.rows[0],
                moduleProgress: progressResult.rows
            }
        });
        
    } catch (error) {
        console.error('Get enrollment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch enrollment'
        });
    }
});

/**
 * @route   PUT /api/v1/enrollments/:id/complete
 * @desc    Mark course as completed
 * @access  Private
 */
router.put('/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { finalScore } = req.body;
        
        const result = await transaction(async (client) => {
            // Update enrollment
            const enrollmentResult = await client.query(
                `UPDATE enrollments
                 SET status = 'completed',
                     completion_date = CURRENT_TIMESTAMP,
                     progress_percentage = 100,
                     final_score = $1
                 WHERE id = $2 AND user_id = $3
                 RETURNING *`,
                [finalScore, id, req.user.id]
            );
            
            if (enrollmentResult.rows.length === 0) {
                throw new Error('Enrollment not found');
            }
            
            const enrollment = enrollmentResult.rows[0];
            
            // Get course CPD credits
            const courseResult = await client.query(
                'SELECT cpd_credits FROM courses WHERE id = $1',
                [enrollment.course_id]
            );
            
            // Update user's total CPD credits
            if (courseResult.rows[0].cpd_credits > 0) {
                await client.query(
                    `UPDATE user_profiles
                     SET total_cpd_credits = total_cpd_credits + $1
                     WHERE user_id = $2`,
                    [courseResult.rows[0].cpd_credits, req.user.id]
                );
            }
            
            return enrollment;
        });
        
        res.json({
            message: 'Course completed successfully',
            enrollment: result
        });
        
    } catch (error) {
        console.error('Complete course error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to complete course'
        });
    }
});

/**
 * @route   DELETE /api/v1/enrollments/:id
 * @desc    Drop a course
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `UPDATE enrollments
             SET status = 'dropped'
             WHERE id = $1 AND user_id = $2 AND status = 'active'
             RETURNING *`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Active enrollment not found'
            });
        }
        
        res.json({
            message: 'Successfully dropped course',
            enrollment: result.rows[0]
        });
        
    } catch (error) {
        console.error('Drop course error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to drop course'
        });
    }
});

module.exports = router;

// Made with Bob
