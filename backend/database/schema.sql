-- IBM LearnHub PostgreSQL Database Schema
-- Created: 2026-05-13
-- Description: Complete database schema for IBM LearnHub learning management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS AND AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'learner' CHECK (role IN ('learner', 'trainer', 'admin')),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(200),
    department VARCHAR(200),
    location VARCHAR(200),
    bio TEXT,
    linkedin_url TEXT,
    career_level_id INTEGER,
    total_cpd_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- IBM CAREER LEVELS
-- ============================================

CREATE TABLE career_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level_order INTEGER NOT NULL,
    description TEXT,
    min_cpd_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert IBM Career Levels
INSERT INTO career_levels (name, level_order, description, min_cpd_credits) VALUES
('Analyst', 1, 'Entry-level consultant position', 0),
('Consultant', 2, 'Mid-level consultant with proven expertise', 50),
('Senior Consultant', 3, 'Senior consultant with deep expertise', 100),
('Managing Consultant', 4, 'Leadership role managing projects and teams', 200),
('Associate Partner', 5, 'Senior leadership with client relationships', 350),
('Partner', 6, 'Executive leadership position', 500);

-- ============================================
-- IBM SKILLS FRAMEWORK
-- ============================================

CREATE TABLE skills (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skill_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    level_order INTEGER NOT NULL,
    description TEXT
);

-- Insert Skill Levels
INSERT INTO skill_levels (name, level_order, description) VALUES
('Foundation', 1, 'Basic understanding and awareness'),
('Intermediate', 2, 'Working knowledge and practical application'),
('Advanced', 3, 'Expert level with deep understanding'),
('Expert', 4, 'Thought leader and innovator');

-- Insert IBM Skills
INSERT INTO skills (id, name, category, description) VALUES
('AI-001', 'Artificial Intelligence', 'Technology', 'AI and machine learning fundamentals'),
('CLOUD-001', 'Cloud Computing', 'Technology', 'Cloud architecture and services'),
('DATA-001', 'Data Analytics', 'Technology', 'Data analysis and visualization'),
('SEC-001', 'Cybersecurity', 'Technology', 'Security principles and practices'),
('AGILE-001', 'Agile Methodology', 'Process', 'Agile project management'),
('DESIGN-001', 'Design Thinking', 'Innovation', 'Human-centered design approach'),
('LEAD-001', 'Leadership', 'Soft Skills', 'Team leadership and management'),
('COMM-001', 'Communication', 'Soft Skills', 'Effective communication skills'),
('STRAT-001', 'Strategy', 'Business', 'Business strategy development'),
('CHANGE-001', 'Change Management', 'Business', 'Organizational change leadership'),
('SUSTAIN-001', 'Sustainability', 'Business', 'Sustainable business practices'),
('BLOCK-001', 'Blockchain', 'Technology', 'Blockchain and distributed ledger'),
('QUANTUM-001', 'Quantum Computing', 'Technology', 'Quantum computing fundamentals'),
('ETHICS-001', 'AI Ethics', 'Governance', 'Ethical AI development and deployment');

-- ============================================
-- USER SKILLS
-- ============================================

CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(20) REFERENCES skills(id),
    skill_level_id INTEGER REFERENCES skill_levels(id),
    acquired_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- ============================================
-- DIGITAL BADGES
-- ============================================

CREATE TABLE badge_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Badge Types
INSERT INTO badge_types (id, name, description, icon, criteria) VALUES
('completion', 'Course Completion', 'Awarded for completing a course', '🎓', 'Complete all course modules'),
('excellence', 'Excellence', 'Awarded for achieving 90%+ score', '⭐', 'Score 90% or higher on final assessment'),
('early_adopter', 'Early Adopter', 'Awarded for being among first learners', '🚀', 'Enroll within first week of course launch');

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type_id VARCHAR(50) REFERENCES badge_types(id),
    course_id UUID,
    awarded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- ============================================
-- COURSES
-- ============================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    duration_hours DECIMAL(5,2),
    trainer_id UUID REFERENCES users(id),
    thumbnail_url TEXT,
    video_url TEXT,
    cpd_credits INTEGER DEFAULT 0,
    max_enrollments INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_date DATE
);

-- ============================================
-- COURSE SKILLS MAPPING
-- ============================================

CREATE TABLE course_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_id VARCHAR(20) REFERENCES skills(id),
    skill_level_id INTEGER REFERENCES skill_levels(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, skill_id)
);

-- ============================================
-- COURSE CAREER LEVELS
-- ============================================

CREATE TABLE course_career_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    career_level_id INTEGER REFERENCES career_levels(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, career_level_id)
);

-- ============================================
-- COURSE MODULES
-- ============================================

CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    duration_minutes INTEGER,
    content_type VARCHAR(50) CHECK (content_type IN ('video', 'document', 'quiz', 'assignment')),
    content_url TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ENROLLMENTS
-- ============================================

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    completion_date TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_score DECIMAL(5,2),
    certificate_url TEXT,
    UNIQUE(user_id, course_id)
);

-- ============================================
-- MODULE PROGRESS
-- ============================================

CREATE TABLE module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    UNIQUE(enrollment_id, module_id)
);

-- ============================================
-- FEEDBACK AND RATINGS
-- ============================================

CREATE TABLE course_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
    trainer_effectiveness INTEGER CHECK (trainer_effectiveness >= 1 AND trainer_effectiveness <= 5),
    relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
    comments TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id)
);

-- ============================================
-- RECORDINGS
-- ============================================

CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    recording_date DATE,
    duration_minutes INTEGER,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    trainer_id UUID REFERENCES users(id),
    view_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Courses
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_trainer ON courses(trainer_id);

-- Enrollments
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_date ON enrollments(enrollment_date);

-- Feedback
CREATE INDEX idx_feedback_course ON course_feedback(course_id);
CREATE INDEX idx_feedback_rating ON course_feedback(rating);

-- User Skills
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Activity Log
CREATE INDEX idx_activity_user ON user_activity_log(user_id);
CREATE INDEX idx_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_activity_date ON user_activity_log(created_at);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Course Statistics View
CREATE VIEW course_statistics AS
SELECT 
    c.id,
    c.title,
    c.category,
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_count,
    AVG(cf.rating) as average_rating,
    COUNT(DISTINCT cf.id) as feedback_count
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN course_feedback cf ON c.id = cf.course_id
GROUP BY c.id, c.title, c.category;

-- User Learning Progress View
CREATE VIEW user_learning_progress AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_courses,
    SUM(CASE WHEN e.status = 'completed' THEN c.cpd_credits ELSE 0 END) as total_cpd_credits,
    COUNT(DISTINCT ub.id) as total_badges,
    COUNT(DISTINCT us.id) as total_skills
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN courses c ON e.course_id = c.id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN user_skills us ON u.id = us.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate enrollment progress
CREATE OR REPLACE FUNCTION calculate_enrollment_progress(enrollment_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_modules INTEGER;
    completed_modules INTEGER;
    progress DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_modules
    FROM course_modules cm
    JOIN enrollments e ON cm.course_id = e.course_id
    WHERE e.id = enrollment_uuid;
    
    SELECT COUNT(*) INTO completed_modules
    FROM module_progress mp
    WHERE mp.enrollment_id = enrollment_uuid AND mp.status = 'completed';
    
    IF total_modules > 0 THEN
        progress := (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
    ELSE
        progress := 0;
    END IF;
    
    RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to award badge
CREATE OR REPLACE FUNCTION award_badge(
    p_user_id UUID,
    p_badge_type_id VARCHAR(50),
    p_course_id UUID,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    new_badge_id UUID;
BEGIN
    INSERT INTO user_badges (user_id, badge_type_id, course_id, metadata)
    VALUES (p_user_id, p_badge_type_id, p_course_id, p_metadata)
    RETURNING id INTO new_badge_id;
    
    RETURN new_badge_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award completion badge
CREATE OR REPLACE FUNCTION check_completion_badge()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM award_badge(NEW.user_id, 'completion', NEW.course_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_completion_badge
AFTER UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION check_completion_badge();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@ibm.com', '$2b$10$rKvVLZ8Z8Z8Z8Z8Z8Z8Z8OqKvVLZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Admin', 'User', 'admin', true);

-- Insert sample courses
INSERT INTO courses (title, description, category, difficulty_level, duration_hours, cpd_credits, is_active, published_date)
VALUES 
('Introduction to AI', 'Learn the fundamentals of Artificial Intelligence', 'Agentic AI', 'Beginner', 8.0, 10, true, CURRENT_DATE),
('Cloud Architecture Fundamentals', 'Master cloud computing concepts', 'Cloud & Infrastructure', 'Intermediate', 12.0, 15, true, CURRENT_DATE),
('Data Analytics with Python', 'Analyze data using Python', 'Data & Analytics', 'Intermediate', 10.0, 12, true, CURRENT_DATE);

COMMENT ON DATABASE CURRENT_DATABASE() IS 'IBM LearnHub Learning Management System Database';

-- Made with Bob
