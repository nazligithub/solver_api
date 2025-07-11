const supabase = require('../config/supabase');
const { ApiError } = require('../utils/ApiError');

class App {
  static tableName = 'apps';

  /**
   * Get all apps
   * @param {Object} filters - Optional filters (e.g., { platform: 'ios', is_active: true })
   * @returns {Promise<Array>} Array of apps
   */
  static async findAll(filters = {}) {
    let query = supabase.from(this.tableName).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new ApiError(500, error.message);
    
    return data;
  }

  /**
   * Get app by ID
   * @param {number} id - App ID
   * @returns {Promise<Object>} App object
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError(404, 'App not found');
      }
      throw new ApiError(500, error.message);
    }
    
    return data;
  }

  /**
   * Get app by bundle ID or package name
   * @param {string} identifier - Bundle ID (iOS) or Package Name (Android)
   * @returns {Promise<Object>} App object
   */
  static async findByIdentifier(identifier) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`bundle_id.eq.${identifier},package_name.eq.${identifier}`)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ApiError(500, error.message);
    }
    
    return data;
  }

  /**
   * Create a new app
   * @param {Object} appData - App data
   * @returns {Promise<Object>} Created app
   */
  static async create(appData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([appData])
      .select()
      .single();
    
    if (error) throw new ApiError(500, error.message);
    
    return data;
  }

  /**
   * Update an app
   * @param {number} id - App ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated app
   */
  static async update(id, updates) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new ApiError(404, 'App not found');
      }
      throw new ApiError(500, error.message);
    }
    
    return data;
  }

  /**
   * Delete an app
   * @param {number} id - App ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw new ApiError(500, error.message);
    
    if (!data || data.length === 0) {
      throw new ApiError(404, 'App not found');
    }
    
    return true;
  }

  /**
   * Get active apps by platform
   * @param {string} platform - 'ios' or 'android'
   * @returns {Promise<Array>} Array of active apps for the platform
   */
  static async getActiveByPlatform(platform) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('version', { ascending: false });
    
    if (error) throw new ApiError(500, error.message);
    
    return data;
  }

  /**
   * Get latest version for a specific app
   * @param {string} identifier - Bundle ID or Package Name
   * @param {string} platform - 'ios' or 'android'
   * @returns {Promise<Object|null>} Latest app version or null
   */
  static async getLatestVersion(identifier, platform) {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true);
    
    // Use appropriate identifier based on platform
    if (platform === 'ios') {
      query = query.eq('bundle_id', identifier);
    } else if (platform === 'android') {
      query = query.eq('package_name', identifier);
    }
    
    const { data, error } = await query
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ApiError(500, error.message);
    }
    
    return data;
  }

  /**
   * Check if update is required
   * @param {string} identifier - Bundle ID or Package Name
   * @param {string} currentVersion - Current app version
   * @param {string} platform - 'ios' or 'android'
   * @returns {Promise<Object>} Update status and latest version info
   */
  static async checkUpdateRequired(identifier, currentVersion, platform) {
    const latestApp = await this.getLatestVersion(identifier, platform);
    
    if (!latestApp) {
      return {
        updateRequired: false,
        message: 'App not found in database'
      };
    }
    
    const isUpdateRequired = this.compareVersions(currentVersion, latestApp.version) < 0;
    const isForceUpdate = isUpdateRequired && latestApp.force_update;
    
    return {
      updateRequired: isUpdateRequired,
      forceUpdate: isForceUpdate,
      latestVersion: latestApp.version,
      updateUrl: latestApp.update_url,
      releaseNotes: latestApp.release_notes,
      minVersion: latestApp.min_version
    };
  }

  /**
   * Compare version strings
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  static compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Get app statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStats() {
    const { data: allApps } = await supabase
      .from(this.tableName)
      .select('*');
    
    const stats = {
      total: allApps?.length || 0,
      byPlatform: {
        ios: allApps?.filter(app => app.platform === 'ios').length || 0,
        android: allApps?.filter(app => app.platform === 'android').length || 0
      },
      active: allApps?.filter(app => app.is_active).length || 0,
      inactive: allApps?.filter(app => !app.is_active).length || 0
    };
    
    return stats;
  }
}

module.exports = App;