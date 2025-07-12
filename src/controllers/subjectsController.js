const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const subjectsController = {
  // GET /api/subjects
  async getAllSubjects(req, res) {
    try {
      const supabase = require('../config/supabase');
      
      // Get all subjects from Supabase
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('id, name, description, icon')
        .order('name');
      
      if (error) {
        console.error('Failed to fetch subjects:', error);
        throw new Error('Failed to fetch subjects');
      }
      
      // Define display order for subjects
      const displayOrder = {
        'Mathematics': 1,
        'Physics': 2,
        'Chemistry': 3,
        'Biology': 4,
        'Computer Science': 5,
        'History': 6,
        'Geography': 7,
        'Literature': 8,
        'Economics': 9,
        'Psychology': 10
      };
      
      // Sort subjects by display order
      let sortedSubjects = subjects.sort((a, b) => {
        const orderA = displayOrder[a.name] || 11;
        const orderB = displayOrder[b.name] || 11;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Add color schemes for UI display
      const colorMap = {
        'calculator': '#3B82F6', // Blue for Math
        'atom': '#10B981', // Green for Sciences
        'computer': '#6366F1', // Indigo for Computer Science
        'history': '#F59E0B', // Amber for History
        'globe': '#8B5CF6', // Purple for Geography
        'book': '#EC4899', // Pink for Literature
        'chart': '#F97316', // Orange for Economics
        'brain': '#14B8A6', // Teal for Psychology
        'philosophy': '#9333EA', // Purple for Philosophy
        'art': '#EF4444', // Red for Art
        'music': '#A855F7', // Purple for Music
        'leaf': '#22C55E', // Green for Environmental Science
        'gear': '#64748B', // Slate for Engineering
        'briefcase': '#78716C', // Stone for Business
        'building': '#0EA5E9', // Sky for Political Science
        'users': '#06B6D4', // Cyan for Sociology
        'star': '#7C3AED', // Violet for Astronomy
        'heart': '#DC2626', // Red for Health & Medicine
        'language': '#2563EB', // Blue for Languages
        'default': '#6B7280' // Gray for others
      };
      
      sortedSubjects = sortedSubjects.map(subject => ({
        ...subject,
        color: colorMap[subject.icon] || colorMap.default,
        display_order: displayOrder[subject.name] || 11
      }));
      
      return successResponse(res, 'Subjects retrieved successfully', {
        subjects: sortedSubjects.slice(0, 8), // Return max 8 subjects for 2x4 grid
        total: sortedSubjects.length
      });
    } catch (error) {
      console.error('Get subjects error:', error);
      return errorResponse(res, 'Failed to get subjects', 500);
    }
  },
  
  // GET /api/subjects/:id
  async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const supabase = require('../config/supabase');
      
      const { data: subject, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (error || !subject) {
        return errorResponse(res, 'Subject not found', 404);
      }
      
      return successResponse(res, 'Subject retrieved successfully', subject);
    } catch (error) {
      console.error('Get subject by id error:', error);
      return errorResponse(res, 'Failed to get subject', 500);
    }
  },
  
  // GET /api/subjects/stats
  async getSubjectStats(req, res) {
    try {
      // Get user_id from headers (consistent with other controllers)
      const user_id = req.headers['x-user-id'] || req.headers['user-id'] || req.ip;
      
      if (!user_id) {
        return errorResponse(res, 'User ID is required', 400);
      }
      
      const supabase = require('../config/supabase');
      
      // Get all subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, icon');
      
      if (subjectsError) {
        throw new Error('Failed to fetch subjects');
      }
      
      // Get user's submissions grouped by subject
      const { data: submissions, error: submissionsError } = await supabase
        .from('homework_submissions')
        .select('subject_id, status, processing_time_ms, created_at')
        .eq('user_id', user_id);
      
      if (submissionsError) {
        throw new Error('Failed to fetch submissions');
      }
      
      // Calculate statistics for each subject
      const stats = subjects.map(subject => {
        const subjectSubmissions = submissions.filter(s => s.subject_id === subject.id);
        const completedSubmissions = subjectSubmissions.filter(s => s.status === 'completed');
        const processingTimes = completedSubmissions.map(s => s.processing_time_ms).filter(Boolean);
        const avgProcessingTime = processingTimes.length > 0 
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
          : null;
        
        const lastSubmission = subjectSubmissions.length > 0
          ? subjectSubmissions.reduce((latest, s) => 
              new Date(s.created_at) > new Date(latest.created_at) ? s : latest
            ).created_at
          : null;
        
        return {
          id: subject.id,
          name: subject.name,
          icon: subject.icon,
          total_submissions: subjectSubmissions.length,
          completed_submissions: completedSubmissions.length,
          avg_processing_time: avgProcessingTime ? Math.round(avgProcessingTime) : null,
          last_submission_date: lastSubmission
        };
      }).filter(stat => stat.total_submissions > 0)
        .sort((a, b) => b.total_submissions - a.total_submissions);
      
      return successResponse(res, 'Subject statistics retrieved', stats);
    } catch (error) {
      console.error('Get subject stats error:', error);
      return errorResponse(res, 'Failed to get subject statistics', 500);
    }
  }
};

module.exports = subjectsController;