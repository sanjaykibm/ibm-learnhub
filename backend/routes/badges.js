const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/v1/badges/user/:userId
 * @desc    Get user's badges
 * @access  Private
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await query(
            `SELECT ub.*, bt.name, bt.description, bt.icon, c.title as course_title
             FROM user_badges ub
             JOIN badge_types bt ON ub.badge_type_id = bt.id
             LEFT JOIN courses c ON ub.course_id = c.id
             WHERE ub.user_id = $1
             ORDER BY ub.awarded_date DESC`,
            [userId]
        );
        
        res.json({ badges: result.rows });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch badges'
        });
    }
});

module.exports = router;

// Made with Bob
