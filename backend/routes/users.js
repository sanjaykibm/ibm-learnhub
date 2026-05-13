const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user profile
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                    up.job_title, up.department, up.location, up.bio,
                    up.total_cpd_credits, cl.name as career_level
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             LEFT JOIN career_levels cl ON up.career_level_id = cl.id
             WHERE u.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        res.json({ user: result.rows[0] });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user'
        });
    }
});

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only update your own profile'
            });
        }
        
        const { jobTitle, department, location, bio, linkedinUrl } = req.body;
        
        const result = await query(
            `UPDATE user_profiles
             SET job_title = COALESCE($1, job_title),
                 department = COALESCE($2, department),
                 location = COALESCE($3, location),
                 bio = COALESCE($4, bio),
                 linkedin_url = COALESCE($5, linkedin_url),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $6
             RETURNING *`,
            [jobTitle, department, location, bio, linkedinUrl, id]
        );
        
        res.json({
            message: 'Profile updated successfully',
            profile: result.rows[0]
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update profile'
        });
    }
});

module.exports = router;

// Made with Bob
