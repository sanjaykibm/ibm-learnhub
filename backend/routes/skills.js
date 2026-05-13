const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/v1/skills
 * @desc    Get all skills
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM skills ORDER BY category, name'
        );
        
        res.json({ skills: result.rows });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch skills'
        });
    }
});

/**
 * @route   GET /api/v1/skills/user/:userId
 * @desc    Get user's skills
 * @access  Private
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await query(
            `SELECT s.*, sl.name as level, us.acquired_date
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.id
             JOIN skill_levels sl ON us.skill_level_id = sl.id
             WHERE us.user_id = $1
             ORDER BY s.category, s.name`,
            [userId]
        );
        
        res.json({ skills: result.rows });
    } catch (error) {
        console.error('Get user skills error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user skills'
        });
    }
});

module.exports = router;

// Made with Bob
