const HomeworkService = require('../services/homeworkService');
const db = require('../config/database');
const { uploadToSupabase } = require('../services/uploadService');
const { successResponse, errorResponse } = require('../utils/response');

const homeworkService = new HomeworkService();

const homeworkController = {
  // POST /api/homework/solve
  async solveHomework(req, res) {
    const totalStartTime = Date.now();
    const timings = {};
    
    try {
      console.log(`📸 Homework solve request [${req.id}]`);
      
      // Get user_id from headers (consistent with other controllers)
      const user_id = req.headers['x-user-id'] || req.headers['user-id'] || req.ip;
      
      // Get locale from headers, default to 'en'
      const supportedLocales = ['tr', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar'];
      let locale = req.headers['x-locale'] || req.headers['locale'] || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
      
      // Validate locale
      if (!supportedLocales.includes(locale)) {
        console.log(`⚠️  Unsupported locale: ${locale}, defaulting to 'en'`);
        locale = 'en';
      }
      
      console.log(`🌐 Locale: ${locale}`);
      
      const { subject_id } = req.body;
      
      if (!req.file) {
        return errorResponse(res, 'No image file uploaded', 400);
      }

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      // Validate subject_id
      const validationStart = Date.now();
      if (subject_id) {
        console.log('📚 Validating subject:', subject_id);
        const subjectCheck = await db.query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
        if (subjectCheck.rows.length === 0) {
          return errorResponse(res, 'Invalid subject ID', 400);
        }
      }

      timings.validation = Date.now() - validationStart;
      
      // Start tracking submission
      const dbStart = Date.now();
      console.log('💾 Creating submission record');
      const submissionResult = await db.query(
        `INSERT INTO homework_submissions (user_id, subject_id, locale, status) 
         VALUES ($1, $2, $3, 'processing') 
         RETURNING id`,
        [user_id, subject_id || null, locale]
      );
      timings.createSubmission = Date.now() - dbStart;
      
      const submissionId = submissionResult.rows[0].id;
      const startTime = Date.now();

      try {
        // Upload image to Supabase
        const uploadStart = Date.now();
        console.log('☁️  Uploading image');
        const uploadResult = await uploadToSupabase(req.file, 'homework-images');
        timings.imageUpload = Date.now() - uploadStart;
        
        // Save image upload record
        const imageRecordStart = Date.now();
        const imageResult = await db.query(
          `INSERT INTO homework_image_uploads (user_id, original_filename, storage_url, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            user_id,
            req.file.originalname,
            uploadResult.url,
            req.file.buffer.length,
            req.file.mimetype
          ]
        );
        
        const imageId = imageResult.rows[0].id;
        
        // Update submission with image ID
        await db.query(
          `UPDATE homework_submissions SET image_id = $1 WHERE id = $2`,
          [imageId, submissionId]
        );
        timings.imageRecord = Date.now() - imageRecordStart;

        // Solve homework using AI
        const aiStart = Date.now();
        console.log('🤖 Sending to AI');
        const solutionData = await homeworkService.solveHomework(
          req.file.buffer,
          uploadResult.url,
          locale,
          subject_id
        );
        timings.aiProcessing = Date.now() - aiStart;

        const processingTime = Date.now() - startTime;

        // Save solution to database
        const saveStart = Date.now();
        console.log('💡 Saving solution');
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
        timings.saveSolution = Date.now() - saveStart;

        // Update submission status
        const updateStart = Date.now();
        await db.query(
          `UPDATE homework_submissions 
           SET status = 'completed', processing_time_ms = $1, completed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [processingTime, submissionId]
        );
        timings.updateStatus = Date.now() - updateStart;
        timings.total = Date.now() - totalStartTime;

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

        // Print timing summary
        console.log('⏱️  Performance Summary:');
        console.log(`  🔍 Validation: ${timings.validation}ms`);
        console.log(`  💾 Create submission: ${timings.createSubmission}ms`);
        console.log(`  ☁️  Image upload: ${timings.imageUpload}ms`);
        console.log(`  📝 Image record: ${timings.imageRecord}ms`);
        console.log(`  🤖 AI processing: ${timings.aiProcessing}ms`);
        console.log(`  💡 Save solution: ${timings.saveSolution}ms`);
        console.log(`  🔄 Update status: ${timings.updateStatus}ms`);
        console.log(`  🎯 TOTAL: ${timings.total}ms`);
        
        console.log('✅ Success:', submissionId);
        return successResponse(res, 'Homework solved successfully', clientResponse);
      } catch (error) {
        console.log('❌ AI processing failed');
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
      console.log('🚨 Request failed');
      console.error('Homework solving error:', error);
      return errorResponse(res, error.message || 'Failed to solve homework', error.statusCode || 500);
    }
  },

  // GET /api/homework/history
  async getHistory(req, res) {
    try {
      console.log('📜 History request');
      
      // Get user_id from headers (consistent with other controllers)
      const user_id = req.headers['x-user-id'] || req.headers['user-id'] || req.ip;
      const { subject_id, limit = 50, group_by_subject } = req.query;

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      // Use Supabase query builder directly
      const supabase = require('../config/supabase');
      
      // First get submissions
      let submissionsQuery = supabase
        .from('homework_submissions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));
      
      // Add subject filter if provided
      if (subject_id) {
        submissionsQuery = submissionsQuery.eq('subject_id', parseInt(subject_id));
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;
      
      if (submissionsError) {
        console.error('Failed to fetch submissions:', submissionsError);
        throw new Error('Failed to fetch history');
      }

      if (!submissions || submissions.length === 0) {
        return successResponse(res, 'History retrieved successfully', {
          submissions: []
        });
      }

      // Get related data
      const submissionIds = submissions.map(s => s.id);
      const subjectIds = [...new Set(submissions.map(s => s.subject_id).filter(Boolean))];
      const imageIds = [...new Set(submissions.map(s => s.image_id).filter(Boolean))];

      // Fetch related data in parallel
      const [subjectsRes, imagesRes, solutionsRes] = await Promise.all([
        subjectIds.length > 0 ? supabase.from('subjects').select('id, name, icon').in('id', subjectIds) : { data: [] },
        imageIds.length > 0 ? supabase.from('homework_image_uploads').select('id, storage_url').in('id', imageIds) : { data: [] },
        supabase.from('homework_solutions').select('submission_id, solution_text, confidence_score, methodology').in('submission_id', submissionIds)
      ]);

      // Create lookup maps
      const subjectsMap = Object.fromEntries((subjectsRes.data || []).map(s => [s.id, s]));
      const imagesMap = Object.fromEntries((imagesRes.data || []).map(i => [i.id, i]));
      const solutionsMap = Object.fromEntries((solutionsRes.data || []).map(s => [s.submission_id, s]));

      // Group by subject if requested
      if (group_by_subject === 'true') {
        const groupedSubmissions = {};
        
        submissions.forEach(row => {
          const subject = subjectsMap[row.subject_id];
          const subjectName = subject?.name || 'Other';
          
          if (!groupedSubmissions[subjectName]) {
            groupedSubmissions[subjectName] = {
              subject_id: row.subject_id,
              subject_icon: subject?.icon,
              submissions: []
            };
          }
          
          const solution = solutionsMap[row.id];
          const image = imagesMap[row.image_id];
          
          groupedSubmissions[subjectName].submissions.push({
            id: row.id,
            subject_id: row.subject_id,
            subject_name: subject?.name,
            status: row.status,
            locale: row.locale,
            created_at: row.created_at,
            processing_time_ms: row.processing_time_ms,
            image_url: image?.storage_url,
            solution: solution?.solution_text,
            confidence: solution?.confidence_score,
            methodology: solution?.methodology
          });
        });
        
        return successResponse(res, 'History retrieved successfully', {
          grouped_submissions: groupedSubmissions,
          total_submissions: submissions.length
        });
      }

      // Map submissions with related data
      const formattedSubmissions = submissions.map(row => {
        const subject = subjectsMap[row.subject_id];
        const image = imagesMap[row.image_id];
        const solution = solutionsMap[row.id];
        
        return {
          id: row.id,
          subject_id: row.subject_id,
          subject_name: subject?.name,
          subject_icon: subject?.icon,
          status: row.status,
          locale: row.locale,
          created_at: row.created_at,
          processing_time_ms: row.processing_time_ms,
          image_url: image?.storage_url,
          solution: solution?.solution_text,
          confidence: solution?.confidence_score,
          methodology: solution?.methodology
        };
      });

      return successResponse(res, 'History retrieved successfully', {
        submissions: formattedSubmissions
      });
    } catch (error) {
      console.error('Get history error:', error);
      return errorResponse(res, error.message || 'Failed to get history', 500);
    }
  },

  // GET /api/homework/submission/:id
  async getSubmission(req, res) {
    try {
      // Get user_id from headers (consistent with other controllers)
      const user_id = req.headers['x-user-id'] || req.headers['user-id'] || req.ip;
      const { id } = req.params;

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      const supabase = require('../config/supabase');

      // Get submission
      const { data: submission, error: submissionError } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('id', parseInt(id))
        .eq('user_id', user_id)
        .single();

      if (submissionError || !submission) {
        return errorResponse(res, 'Submission not found or access denied', 404);
      }

      // Get related data in parallel
      const [subjectRes, imageRes, solutionRes] = await Promise.all([
        submission.subject_id ? supabase.from('subjects').select('name, icon').eq('id', submission.subject_id).single() : { data: null },
        submission.image_id ? supabase.from('homework_image_uploads').select('storage_url').eq('id', submission.image_id).single() : { data: null },
        supabase.from('homework_solutions').select('*').eq('submission_id', submission.id).single()
      ]);

      const subject = subjectRes.data;
      const image = imageRes.data;
      const solution = solutionRes.data;
      
      // Parse steps JSON
      let steps = [];
      try {
        steps = solution?.steps ? (typeof solution.steps === 'string' ? JSON.parse(solution.steps) : solution.steps) : [];
      } catch (e) {
        console.error('Failed to parse steps:', e);
        steps = solution?.steps || [];
      }

      const response = {
        id: submission.id,
        user_id: submission.user_id,
        subject_id: submission.subject_id,
        subject_name: subject?.name,
        subject_icon: subject?.icon,
        status: submission.status,
        locale: submission.locale,
        image_url: image?.storage_url,
        created_at: submission.created_at,
        completed_at: submission.completed_at,
        processing_time_ms: submission.processing_time_ms,
        solution: solution ? {
          text: solution.solution_text,
          steps: steps,
          confidence: solution.confidence_score,
          methodology: solution.methodology,
          solved_at: solution.created_at
        } : null
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
      // Get user_id from headers (consistent with other controllers)
      const user_id = req.headers['x-user-id'] || req.headers['user-id'] || req.ip;

      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_submissions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_submissions,
          AVG(CASE WHEN status = 'completed' THEN processing_time_ms END) as avg_processing_time,
          COUNT(DISTINCT subject_id) as unique_subjects
        FROM homework_submissions
        WHERE user_id = $1
      `;

      const subjectQuery = `
        SELECT 
          s.id as subject_id,
          s.name as subject_name,
          s.icon as subject_icon,
          COUNT(*) as count
        FROM homework_submissions hs
        JOIN subjects s ON hs.subject_id = s.id
        WHERE hs.user_id = $1 AND hs.subject_id IS NOT NULL
        GROUP BY s.id, s.name, s.icon
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
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          subject_icon: row.subject_icon,
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