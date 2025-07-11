const HomeworkService = require('../services/homeworkService');
const { db } = require('../config/database');
const { uploadToSupabase } = require('../services/uploadService');
const { successResponse, errorResponse } = require('../utils/response');

const homeworkService = new HomeworkService();

const homeworkController = {
  // POST /api/homework/solve
  async solveHomework(req, res) {
    try {
      const { user_id, locale = 'tr', subject, grade_level } = req.body;
      
      if (!req.file) {
        return errorResponse(res, 'No image file uploaded', 400);
      }

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      // Start tracking submission
      const submissionResult = await db.query(
        `INSERT INTO homework_submissions (user_id, subject, grade_level, locale, status) 
         VALUES ($1, $2, $3, $4, 'processing') 
         RETURNING id`,
        [user_id, subject, grade_level, locale]
      );
      
      const submissionId = submissionResult.rows[0].id;
      const startTime = Date.now();

      try {
        // Upload image to Supabase
        const uploadResult = await uploadToSupabase(req.file, 'homework-images');
        
        // Save image upload record
        const imageResult = await db.query(
          `INSERT INTO image_uploads (user_id, original_filename, storage_url, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            user_id,
            req.file.originalname,
            uploadResult.url,
            req.file.size,
            req.file.mimetype
          ]
        );
        
        const imageId = imageResult.rows[0].id;
        
        // Update submission with image ID
        await db.query(
          `UPDATE homework_submissions SET image_id = $1 WHERE id = $2`,
          [imageId, submissionId]
        );

        // Solve homework using AI
        const solutionData = await homeworkService.solveHomework(
          req.file.buffer,
          uploadResult.url,
          locale,
          subject,
          grade_level
        );

        const processingTime = Date.now() - startTime;

        // Save solution to database
        await db.query(
          `INSERT INTO homework_solutions 
           (submission_id, solution_text, steps, confidence_score, methodology, response_json)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            submissionId,
            solutionData.solution,
            JSON.stringify(solutionData.steps),
            solutionData.confidence_score,
            solutionData.methodology,
            JSON.stringify(solutionData.ai_response)
          ]
        );

        // Update submission status
        await db.query(
          `UPDATE homework_submissions 
           SET status = 'completed', processing_time_ms = $1, completed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [processingTime, submissionId]
        );

        // Format response for client
        const clientResponse = {
          submission_id: submissionId,
          image_url: uploadResult.url,
          result: solutionData.solution,
          steps: solutionData.steps.map(step => ({
            step: step.step_number,
            title: step.title,
            explanation: step.explanation,
            math: step.latex,
            visual: step.visual_aid
          })),
          confidence: solutionData.confidence_score,
          methodology: solutionData.methodology,
          processing_time_ms: processingTime
        };

        return successResponse(res, 'Homework solved successfully', clientResponse);
      } catch (error) {
        // Update submission status to failed
        await db.query(
          `UPDATE homework_submissions 
           SET status = 'failed', processing_time_ms = $1, completed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [Date.now() - startTime, submissionId]
        );
        throw error;
      }
    } catch (error) {
      console.error('Homework solving error:', error);
      return errorResponse(res, error.message || 'Failed to solve homework', error.statusCode || 500);
    }
  },

  // GET /api/homework/history
  async getHistory(req, res) {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      const query = `
        SELECT 
          hs.id,
          hs.subject,
          hs.grade_level,
          hs.status,
          hs.locale,
          hs.created_at,
          hs.processing_time_ms,
          iu.storage_url as image_url,
          sol.solution_text,
          sol.confidence_score,
          sol.methodology
        FROM homework_submissions hs
        LEFT JOIN image_uploads iu ON hs.image_id = iu.id
        LEFT JOIN homework_solutions sol ON hs.id = sol.submission_id
        WHERE hs.user_id = $1
        ORDER BY hs.created_at DESC
        LIMIT 50
      `;

      const result = await db.query(query, [user_id]);

      return successResponse(res, 'History retrieved successfully', {
        submissions: result.rows.map(row => ({
          id: row.id,
          subject: row.subject,
          grade_level: row.grade_level,
          status: row.status,
          locale: row.locale,
          created_at: row.created_at,
          processing_time_ms: row.processing_time_ms,
          image_url: row.image_url,
          solution: row.solution_text,
          confidence: row.confidence_score,
          methodology: row.methodology
        }))
      });
    } catch (error) {
      console.error('Get history error:', error);
      return errorResponse(res, error.message || 'Failed to get history', 500);
    }
  },

  // GET /api/homework/submission/:id
  async getSubmission(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          hs.*,
          iu.storage_url as image_url,
          sol.solution_text,
          sol.steps,
          sol.confidence_score,
          sol.methodology,
          sol.created_at as solved_at
        FROM homework_submissions hs
        LEFT JOIN image_uploads iu ON hs.image_id = iu.id
        LEFT JOIN homework_solutions sol ON hs.id = sol.submission_id
        WHERE hs.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return errorResponse(res, 'Submission not found', 404);
      }

      const submission = result.rows[0];
      
      // Parse steps JSON
      let steps = [];
      try {
        steps = submission.steps ? JSON.parse(submission.steps) : [];
      } catch (e) {
        console.error('Failed to parse steps:', e);
      }

      const response = {
        id: submission.id,
        user_id: submission.user_id,
        subject: submission.subject,
        grade_level: submission.grade_level,
        status: submission.status,
        locale: submission.locale,
        image_url: submission.image_url,
        created_at: submission.created_at,
        completed_at: submission.completed_at,
        processing_time_ms: submission.processing_time_ms,
        solution: {
          text: submission.solution_text,
          steps: steps,
          confidence: submission.confidence_score,
          methodology: submission.methodology,
          solved_at: submission.solved_at
        }
      };

      return successResponse(res, 'Submission retrieved successfully', response);
    } catch (error) {
      console.error('Get submission error:', error);
      return errorResponse(res, error.message || 'Failed to get submission', 500);
    }
  },

  // GET /api/homework/stats
  async getStats(req, res) {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_submissions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_submissions,
          AVG(CASE WHEN status = 'completed' THEN processing_time_ms END) as avg_processing_time,
          COUNT(DISTINCT subject) as unique_subjects
        FROM homework_submissions
        WHERE user_id = $1
      `;

      const subjectQuery = `
        SELECT subject, COUNT(*) as count
        FROM homework_submissions
        WHERE user_id = $1 AND subject IS NOT NULL
        GROUP BY subject
        ORDER BY count DESC
        LIMIT 5
      `;

      const [statsResult, subjectResult] = await Promise.all([
        db.query(statsQuery, [user_id]),
        db.query(subjectQuery, [user_id])
      ]);

      const stats = statsResult.rows[0];
      
      return successResponse(res, 'Stats retrieved successfully', {
        total_submissions: parseInt(stats.total_submissions) || 0,
        completed_submissions: parseInt(stats.completed_submissions) || 0,
        failed_submissions: parseInt(stats.failed_submissions) || 0,
        avg_processing_time_ms: stats.avg_processing_time ? Math.round(stats.avg_processing_time) : 0,
        unique_subjects: parseInt(stats.unique_subjects) || 0,
        top_subjects: subjectResult.rows.map(row => ({
          subject: row.subject,
          count: parseInt(row.count)
        }))
      });
    } catch (error) {
      console.error('Get stats error:', error);
      return errorResponse(res, error.message || 'Failed to get stats', 500);
    }
  }
};

module.exports = homeworkController;