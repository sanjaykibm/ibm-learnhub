const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private (Admin)
 */
router.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        // Get total active courses
        const coursesResult = await query(
            'SELECT COUNT(*) as total FROM courses WHERE is_active = true'
        );
        
        // Get total enrolled learners
        const learnersResult = await query(
            'SELECT COUNT(DISTINCT user_id) as total FROM enrollments'
        );
        
        // Get completion rate
        const completionResult = await query(
            `SELECT 
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
             FROM enrollments`
        );
        
        const completionRate = completionResult.rows[0].total_enrollments > 0
            ? (completionResult.rows[0].completed / completionResult.rows[0].total_enrollments * 100).toFixed(2)
            : 0;
        
        // Get average feedback score
        const feedbackResult = await query(
            'SELECT AVG(rating) as avg_rating FROM course_feedback'
        );
        
        res.json({
            analytics: {
                totalActiveCourses: parseInt(coursesResult.rows[0].total),
                totalEnrolledLearners: parseInt(learnersResult.rows[0].total),
                completionRate: parseFloat(completionRate),
                averageFeedbackScore: feedbackResult.rows[0].avg_rating 
                    ? parseFloat(feedbackResult.rows[0].avg_rating).toFixed(1)
                    : null
            }
        });
        
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch analytics'
        });
    }
});

/**
 * @route   GET /api/v1/analytics/user/:userId
 * @desc    Get user learning analytics
 * @access  Private
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only view your own analytics'
            });
        }
        
        // Get enrollment statistics
        const enrollmentStats = await query(
            `SELECT 
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_courses,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_courses,
                AVG(CASE WHEN final_score IS NOT NULL THEN final_score END) as avg_score
             FROM enrollments
             WHERE user_id = $1`,
            [userId]
        );
        
        // Get CPD credits
        const cpdResult = await query(
            'SELECT total_cpd_credits FROM user_profiles WHERE user_id = $1',
            [userId]
        );
        
        // Get badges count
        const badgesResult = await query(
            'SELECT COUNT(*) as total FROM user_badges WHERE user_id = $1',
            [userId]
        );
        
        // Get skills count
        const skillsResult = await query(
            'SELECT COUNT(*) as total FROM user_skills WHERE user_id = $1',
            [userId]
        );
        
        res.json({
            analytics: {
                totalEnrollments: parseInt(enrollmentStats.rows[0].total_enrollments),
                completedCourses: parseInt(enrollmentStats.rows[0].completed_courses),
                activeCourses: parseInt(enrollmentStats.rows[0].active_courses),
                averageScore: enrollmentStats.rows[0].avg_score 
                    ? parseFloat(enrollmentStats.rows[0].avg_score).toFixed(1)
                    : null,
                totalCpdCredits: cpdResult.rows[0]?.total_cpd_credits || 0,
                totalBadges: parseInt(badgesResult.rows[0].total),
                totalSkills: parseInt(skillsResult.rows[0].total)
            }
        });
        
    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user analytics'
        });
    }
});

/**
 * @route   GET /api/v1/analytics/course/:courseId
 * @desc    Get course analytics
 * @access  Private (Trainer/Admin)
 */
router.get('/course/:courseId', authenticateToken, authorizeRole('trainer', 'admin'), async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Get enrollment statistics
        const enrollmentStats = await query(
            `SELECT 
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped,
                AVG(CASE WHEN final_score IS NOT NULL THEN final_score END) as avg_score
             FROM enrollments
             WHERE course_id = $1`,
            [courseId]
        );
        
        // Get feedback statistics
        const feedbackStats = await query(
            `SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as avg_rating,
                AVG(content_quality) as avg_content_quality,
                AVG(trainer_effectiveness) as avg_trainer_effectiveness,
                AVG(relevance) as avg_relevance,
                COUNT(CASE WHEN would_recommend = true THEN 1 END) as would_recommend_count
             FROM course_feedback
             WHERE course_id = $1`,
            [courseId]
        );
        
        const stats = enrollmentStats.rows[0];
        const feedback = feedbackStats.rows[0];
        
        res.json({
            analytics: {
                enrollments: {
                    total: parseInt(stats.total_enrollments),
                    completed: parseInt(stats.completed),
                    active: parseInt(stats.active),
                    dropped: parseInt(stats.dropped),
                    completionRate: stats.total_enrollments > 0
                        ? ((stats.completed / stats.total_enrollments) * 100).toFixed(2)
                        : 0
                },
                performance: {
                    averageScore: stats.avg_score ? parseFloat(stats.avg_score).toFixed(1) : null
                },
                feedback: {
                    totalFeedback: parseInt(feedback.total_feedback),
                    averageRating: feedback.avg_rating ? parseFloat(feedback.avg_rating).toFixed(1) : null,
                    contentQuality: feedback.avg_content_quality ? parseFloat(feedback.avg_content_quality).toFixed(1) : null,
                    trainerEffectiveness: feedback.avg_trainer_effectiveness ? parseFloat(feedback.avg_trainer_effectiveness).toFixed(1) : null,
                    relevance: feedback.avg_relevance ? parseFloat(feedback.avg_relevance).toFixed(1) : null,
                    recommendationRate: feedback.total_feedback > 0
                        ? ((feedback.would_recommend_count / feedback.total_feedback) * 100).toFixed(2)
                        : 0
                }
            }
        });
        
    } catch (error) {
        console.error('Get course analytics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch course analytics'
        });
    }
});

module.exports = router;

// Made with Bob
