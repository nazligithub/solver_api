const { asyncHandler, ApiError, BaseResponse } = require('../utils/response');
const App = require('../models/App');

// Get all apps
const getAllApps = asyncHandler(async (req, res) => {
  const { platform, is_active } = req.query;
  
  const filters = {};
  if (platform) filters.platform = platform;
  if (is_active !== undefined) filters.is_active = is_active === 'true';
  
  const apps = await App.findAll(filters);
  
  return res.json(
    BaseResponse.success('Apps fetched successfully', { apps })
  );
});

// Get app by ID
const getAppById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const app = await App.findById(id);
  
  return res.json(
    BaseResponse.success('App fetched successfully', { app })
  );
});

// Create new app version
const createApp = asyncHandler(async (req, res) => {
  const {
    app_name,
    platform,
    bundle_id,
    package_name,
    version,
    min_version,
    build_number,
    update_url,
    release_notes,
    force_update,
    features
  } = req.body;
  
  // Validation
  if (!app_name || !platform || !version || !update_url) {
    throw new ApiError(400, 'Missing required fields');
  }
  
  if (platform === 'ios' && !bundle_id) {
    throw new ApiError(400, 'Bundle ID is required for iOS apps');
  }
  
  if (platform === 'android' && !package_name) {
    throw new ApiError(400, 'Package name is required for Android apps');
  }
  
  // Check if version already exists
  const identifier = platform === 'ios' ? bundle_id : package_name;
  const existingApp = await App.findByIdentifier(identifier);
  
  if (existingApp && existingApp.version === version && existingApp.platform === platform) {
    throw new ApiError(400, 'This version already exists');
  }
  
  const app = await App.create({
    app_name,
    platform,
    bundle_id: platform === 'ios' ? bundle_id : null,
    package_name: platform === 'android' ? package_name : null,
    version,
    min_version,
    build_number,
    update_url,
    release_notes,
    force_update: force_update || false,
    features: features || {}
  });
  
  return res.status(201).json(
    BaseResponse.success('App version created successfully', { app }, 201)
  );
});

// Update app
const updateApp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.created_at;
  
  const app = await App.update(id, updates);
  
  return res.json(
    BaseResponse.success('App updated successfully', { app })
  );
});

// Delete app
const deleteApp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await App.delete(id);
  
  return res.json(
    BaseResponse.success('App deleted successfully')
  );
});

// Check for updates
const checkUpdate = asyncHandler(async (req, res) => {
  const { platform, version, bundle_id, package_name } = req.query;
  
  if (!platform || !version) {
    throw new ApiError(400, 'Platform and version are required');
  }
  
  const identifier = platform === 'ios' ? bundle_id : package_name;
  
  if (!identifier) {
    throw new ApiError(400, 'Bundle ID (iOS) or Package Name (Android) is required');
  }
  
  const updateInfo = await App.checkUpdateRequired(identifier, version, platform);
  
  return res.json(
    BaseResponse.success('Update check completed', updateInfo)
  );
});

// Get latest version
const getLatestVersion = asyncHandler(async (req, res) => {
  const { platform, bundle_id, package_name } = req.query;
  
  if (!platform) {
    throw new ApiError(400, 'Platform is required');
  }
  
  const identifier = platform === 'ios' ? bundle_id : package_name;
  
  if (!identifier) {
    throw new ApiError(400, 'Bundle ID (iOS) or Package Name (Android) is required');
  }
  
  const app = await App.getLatestVersion(identifier, platform);
  
  if (!app) {
    throw new ApiError(404, 'No active app version found');
  }
  
  return res.json(
    BaseResponse.success('Latest version fetched successfully', { app })
  );
});

// Get app statistics
const getAppStats = asyncHandler(async (req, res) => {
  const stats = await App.getStats();
  
  return res.json(
    BaseResponse.success('App statistics fetched successfully', { stats })
  );
});

module.exports = {
  getAllApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
  checkUpdate,
  getLatestVersion,
  getAppStats
};