-- Homework System Complete Database Schema
-- This is the only SQL file you need to run in Supabase

-- Clean up old tables if they exist
DROP TABLE IF EXISTS homework_solutions CASCADE;
DROP TABLE IF EXISTS homework_submissions CASCADE;
DROP TABLE IF EXISTS homework_image_uploads CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS apps CASCADE;

-- 1. Subjects Table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Icon identifier for UI display
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Image Uploads Table
CREATE TABLE homework_image_uploads (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255),
    storage_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Homework Submissions Table
CREATE TABLE homework_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id),
    question_type VARCHAR(50),
    image_id INTEGER REFERENCES homework_image_uploads(id),
    question_text TEXT,
    locale VARCHAR(10) DEFAULT 'tr',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. Homework Solutions Table
CREATE TABLE homework_solutions (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES homework_submissions(id) ON DELETE CASCADE,
    solution_text TEXT NOT NULL,
    steps JSONB NOT NULL, -- Array of step objects with explanation
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    methodology VARCHAR(100), -- e.g., 'algebraic', 'geometric', 'analytical'
    ai_model VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    response_json JSONB, -- Full AI response for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Apps Table (for mobile app status)
CREATE TABLE apps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    status_ios BOOLEAN DEFAULT true,
    status_android BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_homework_image_uploads_user_id ON homework_image_uploads(user_id);
CREATE INDEX idx_homework_image_uploads_uploaded_at ON homework_image_uploads(uploaded_at);
CREATE INDEX idx_homework_submissions_user_id ON homework_submissions(user_id);
CREATE INDEX idx_homework_submissions_status ON homework_submissions(status);
CREATE INDEX idx_homework_submissions_subject_id ON homework_submissions(subject_id);
CREATE INDEX idx_homework_submissions_created_at ON homework_submissions(created_at);
CREATE INDEX idx_homework_solutions_submission_id ON homework_solutions(submission_id);
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_apps_name ON apps(name);

-- Insert default subjects (Global - English only)
INSERT INTO subjects (name, description, icon) VALUES
    ('Mathematics', 'Algebra, geometry, calculus, statistics, and mathematical problem solving', 'calculator'),
    ('Physics', 'Mechanics, thermodynamics, electromagnetism, optics, and modern physics', 'atom'),
    ('Chemistry', 'Organic chemistry, inorganic chemistry, physical chemistry, and chemical reactions', 'atom'),
    ('Biology', 'Cell biology, genetics, ecology, evolution, and life sciences', 'atom'),
    ('Computer Science', 'Programming, algorithms, data structures, and computational thinking', 'computer'),
    ('History', 'World history, ancient civilizations, modern history, and historical analysis', 'history'),
    ('Geography', 'Physical geography, human geography, environmental studies, and cartography', 'globe'),
    ('Literature', 'Literary analysis, creative writing, poetry, and world literature', 'book'),
    ('Economics', 'Microeconomics, macroeconomics, finance, and economic theory', 'chart'),
    ('Psychology', 'Cognitive psychology, behavioral psychology, and mental processes', 'brain'),
    ('Philosophy', 'Ethics, logic, metaphysics, and philosophical reasoning', 'philosophy'),
    ('Art & Design', 'Visual arts, graphic design, art history, and creative expression', 'art'),
    ('Music', 'Music theory, composition, performance, and music history', 'music'),
    ('Environmental Science', 'Ecology, climate science, sustainability, and environmental systems', 'leaf'),
    ('Engineering', 'Mechanical, electrical, civil, and engineering principles', 'gear'),
    ('Business Studies', 'Business management, entrepreneurship, marketing, and finance', 'briefcase'),
    ('Political Science', 'Government systems, international relations, and political theory', 'building'),
    ('Sociology', 'Social structures, cultural studies, and human behavior in society', 'users'),
    ('Astronomy', 'Planetary science, astrophysics, and space exploration', 'star'),
    ('Health & Medicine', 'Human anatomy, physiology, health sciences, and medical studies', 'heart');

-- Insert default app
INSERT INTO apps (name, status_ios, status_android) VALUES
    ('Homework Solver', true, true);

-- Grant permissions for Supabase
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Example homework solution steps structure:
-- {
--   "steps": [
--     {
--       "step_number": 1,
--       "title": "Problem Tanımlama",
--       "explanation": "Verilen denklem: 2x + 5 = 15",
--       "latex": "2x + 5 = 15",
--       "visual_aid": null
--     },
--     {
--       "step_number": 2,
--       "title": "İşlem Adımı",
--       "explanation": "Her iki taraftan 5 çıkarıyoruz",
--       "latex": "2x + 5 - 5 = 15 - 5",
--       "visual_aid": null
--     }
--   ]
-- }