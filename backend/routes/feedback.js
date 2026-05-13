const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/v1/feedback
 * @desc    Submit course feedback
 * @access  Private
 */
router.post('/',
    authenticateToken,
    [
        body('enrollmentId').isUUID().withMessage('Valid enrollment ID is required'),
        body('courseId').isUUID().withMessage('Valid course ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('contentQuality').isInt({ min: 1, max: 5 }).withMessage('Content quality must be between 1 and 5'),
        body('trainerEffectiveness').isInt({ min: 1, max: 5 }).withMessage('Trainer effectiveness must be between 1 and 5'),
        body('relevance').isInt({ min: 1, max: 5 }).withMessage('Relevance must be between 1 and 5')
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
                enrollmentId,
                courseId,
                rating,
                contentQuality,
                trainerEffectiveness,
                relevance,
                comments,
                wouldRecommend
            } = req.body;
            
            // Verify enrollment belongs to user
            const enrollmentCheck = await query(
                'SELECT id FROM enrollments WHERE id = $1 AND user_id = $2 AND course_id = $3',
                [enrollmentId, req.user.id, courseId]
            );
            
            if (enrollmentCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Enrollment not found'
                });
            }
            
            const result = await query(
                `INSERT INTO course_feedback (
                    enrollment_id, user_id, course_id, rating,
                    content_quality, trainer_effectiveness, relevance,
                    comments, would_recommend
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    enrollmentId, req.user.id, courseId, rating,
                    contentQuality, trainerEffectiveness, relevance,
                    comments, wouldRecommend
                ]
            );
            
            res.status(201).json({
                message: 'Feedback submitted successfully',
                feedback: result.rows[0]
            });
            
        } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Feedback already submitted for this enrollment'
                });
            }
            
            console.error('Submit feedback error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to submit feedback'
            });
        }
    }
);

/**
 * @route   GET /api/v1/feedback/course/:courseId
 * @desc    Get course feedback
 * @access  Public
 */
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const result = await query(
            `SELECT cf.*, u.first_name, u.last_name
             FROM course_feedback cf
             JOIN users u ON cf.user_id = u.id
             WHERE cf.course_id = $1
             ORDER BY cf.created_at DESC`,
            [courseId]
        );
        
        res.json({ feedback: result.rows });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch feedback'
        });
    }
});

module.exports = router;

// Made with Bob
