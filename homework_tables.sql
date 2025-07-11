-- Homework API Database Schema
-- This script creates the necessary tables for the homework solving service

-- Drop existing homework tables if they exist
DROP TABLE IF EXISTS homework_solutions CASCADE;
DROP TABLE IF EXISTS homework_submissions CASCADE;

-- Remove hair-related tables (to be run separately if needed)
-- DROP TABLE IF EXISTS processing_history CASCADE;
-- DROP TABLE IF EXISTS face_analyses CASCADE;
-- DROP TABLE IF EXISTS hair_colors CASCADE;
-- DROP TABLE IF EXISTS hair_styles CASCADE;

-- Homework Submissions Table
CREATE TABLE homework_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    subject VARCHAR(50),
    grade_level VARCHAR(20),
    question_type VARCHAR(50),
    image_id INTEGER REFERENCES image_uploads(id),
    question_text TEXT,
    locale VARCHAR(10) DEFAULT 'tr',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Homework Solutions Table
CREATE TABLE homework_solutions (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES homework_submissions(id) ON DELETE CASCADE,
    solution_text TEXT NOT NULL,
    steps JSONB NOT NULL, -- Array of step objects with explanation and optional images
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    methodology VARCHAR(100), -- e.g., 'algebraic', 'geometric', 'analytical'
    ai_model VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    response_json JSONB, -- Full AI response for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_homework_submissions_user_id ON homework_submissions(user_id);
CREATE INDEX idx_homework_submissions_status ON homework_submissions(status);
CREATE INDEX idx_homework_submissions_subject ON homework_submissions(subject);
CREATE INDEX idx_homework_submissions_created_at ON homework_submissions(created_at);
CREATE INDEX idx_homework_solutions_submission_id ON homework_solutions(submission_id);

-- Example of steps JSONB structure:
-- [
--   {
--     "step_number": 1,
--     "title": "Problem Tanımlama",
--     "explanation": "Verilen denklem: 2x + 5 = 15",
--     "latex": "2x + 5 = 15",
--     "image_url": null
--   },
--   {
--     "step_number": 2,
--     "title": "İşlem Adımı",
--     "explanation": "Her iki taraftan 5 çıkarıyoruz",
--     "latex": "2x + 5 - 5 = 15 - 5",
--     "image_url": null
--   },
--   {
--     "step_number": 3,
--     "title": "Sadeleştirme",
--     "explanation": "Sadeleştirme sonucu",
--     "latex": "2x = 10",
--     "image_url": null
--   },
--   {
--     "step_number": 4,
--     "title": "Çözüm",
--     "explanation": "Her iki tarafı 2'ye bölüyoruz",
--     "latex": "x = 5",
--     "image_url": null
--   }
-- ]