const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const appStatusController = {
  // GET /api/app/status
  async getAppStatus(req, res) {
    try {
      const query = `
        SELECT 
          name,
          status_ios,
          status_android
        FROM apps
        WHERE name = $1
        LIMIT 1
      `;
      
      const result = await db.query(query, ['Homework Solver']);
      
      if (result.rows.length === 0) {
        return errorResponse(res, 'App status not found', 404);
      }
      
      const app = result.rows[0];
      
      return successResponse(res, 'App status retrieved successfully', {
        name: app.name,
        ios: {
          status: app.status_ios,
          message: app.status_ios ? 'App is active' : 'App is under maintenance'
        },
        android: {
          status: app.status_android,
          message: app.status_android ? 'App is active' : 'App is under maintenance'
        }
      });
    } catch (error) {
      console.error('Get app status error:', error);
      return errorResponse(res, 'Failed to get app status', 500);
    }
  },

  // PUT /api/app/status (Admin only)
  async updateAppStatus(req, res) {
    try {
      const { status_ios, status_android } = req.body;
      
      if (status_ios === undefined && status_android === undefined) {
        return errorResponse(res, 'At least one status must be provided', 400);
      }
      
      let updates = [];
      let params = [];
      let paramCount = 1;
      
      if (status_ios !== undefined) {
        updates.push(`status_ios = $${paramCount}`);
        params.push(status_ios);
        paramCount++;
      }
      
      if (status_android !== undefined) {
        updates.push(`status_android = $${paramCount}`);
        params.push(status_android);
        paramCount++;
      }
      
      params.push('Homework Solver');
      
      const query = `
        UPDATE apps 
        SET ${updates.join(', ')}
        WHERE name = $${paramCount}
        RETURNING *
      `;
      
      const result = await db.query(query, params);
      
      if (result.rows.length === 0) {
        return errorResponse(res, 'App not found', 404);
      }
      
      const app = result.rows[0];
      
      return successResponse(res, 'App status updated successfully', {
        name: app.name,
        status_ios: app.status_ios,
        status_android: app.status_android
      });
    } catch (error) {
      console.error('Update app status error:', error);
      return errorResponse(res, 'Failed to update app status', 500);
    }
  },

  // Admin functions for app management
  async getAllApps(req, res) {
    try {
      const query = 'SELECT * FROM apps ORDER BY id';
      const result = await db.query(query);
      
      return successResponse(res, 'Apps retrieved successfully', result.rows);
    } catch (error) {
      console.error('Get all apps error:', error);
      return errorResponse(res, 'Failed to get apps', 500);
    }
  },

  async getAppById(req, res) {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM apps WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return errorResponse(res, 'App not found', 404);
      }
      
      return successResponse(res, 'App retrieved successfully', result.rows[0]);
    } catch (error) {
      console.error('Get app by id error:', error);
      return errorResponse(res, 'Failed to get app', 500);
    }
  },

  async createApp(req, res) {
    try {
      const { name, status_ios = true, status_android = true } = req.body;
      
      if (!name) {
        return errorResponse(res, 'App name is required', 400);
      }
      
      const query = `
        INSERT INTO apps (name, status_ios, status_android)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await db.query(query, [name, status_ios, status_android]);
      
      return successResponse(res, 'App created successfully', result.rows[0]);
    } catch (error) {
      console.error('Create app error:', error);
      if (error.code === '23505') { // Unique violation
        return errorResponse(res, 'App with this name already exists', 409);
      }
      return errorResponse(res, 'Failed to create app', 500);
    }
  },

  async updateApp(req, res) {
    try {
      const { id } = req.params;
      const { name, status_ios, status_android } = req.body;
      
      let updates = [];
      let params = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        params.push(name);
        paramCount++;
      }
      
      if (status_ios !== undefined) {
        updates.push(`status_ios = $${paramCount}`);
        params.push(status_ios);
        paramCount++;
      }
      
      if (status_android !== undefined) {
        updates.push(`status_android = $${paramCount}`);
        params.push(status_android);
        paramCount++;
      }
      
      if (updates.length === 0) {
        return errorResponse(res, 'No fields to update', 400);
      }
      
      params.push(id);
      
      const query = `
        UPDATE apps 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await db.query(query, params);
      
      if (result.rows.length === 0) {
        return errorResponse(res, 'App not found', 404);
      }
      
      return successResponse(res, 'App updated successfully', result.rows[0]);
    } catch (error) {
      console.error('Update app error:', error);
      if (error.code === '23505') { // Unique violation
        return errorResponse(res, 'App with this name already exists', 409);
      }
      return errorResponse(res, 'Failed to update app', 500);
    }
  },

  async deleteApp(req, res) {
    try {
      const { id } = req.params;
      
      const query = 'DELETE FROM apps WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return errorResponse(res, 'App not found', 404);
      }
      
      return successResponse(res, 'App deleted successfully', result.rows[0]);
    } catch (error) {
      console.error('Delete app error:', error);
      return errorResponse(res, 'Failed to delete app', 500);
    }
  },

  async getAppStats(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_apps,
          COUNT(CASE WHEN status_ios = true THEN 1 END) as active_ios,
          COUNT(CASE WHEN status_android = true THEN 1 END) as active_android,
          COUNT(CASE WHEN status_ios = false THEN 1 END) as inactive_ios,
          COUNT(CASE WHEN status_android = false THEN 1 END) as inactive_android
        FROM apps
      `;
      
      const result = await db.query(query);
      
      return successResponse(res, 'App statistics retrieved successfully', result.rows[0]);
    } catch (error) {
      console.error('Get app stats error:', error);
      return errorResponse(res, 'Failed to get app statistics', 500);
    }
  }
};

module.exports = appStatusController;