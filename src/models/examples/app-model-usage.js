/**
 * App Model Usage Examples
 * 
 * This file demonstrates how to use the App model for various operations
 */

const App = require('../App');

// Example 1: Get all apps
async function getAllAppsExample() {
  try {
    // Get all apps
    const allApps = await App.findAll();
    console.log('All apps:', allApps);
    
    // Get only iOS apps
    const iosApps = await App.findAll({ platform: 'ios' });
    console.log('iOS apps:', iosApps);
    
    // Get only active Android apps
    const activeAndroidApps = await App.findAll({ 
      platform: 'android', 
      is_active: true 
    });
    console.log('Active Android apps:', activeAndroidApps);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Find specific app
async function findAppExample() {
  try {
    // Find by ID
    const appById = await App.findById(1);
    console.log('App by ID:', appById);
    
    // Find by bundle ID or package name
    const appByIdentifier = await App.findByIdentifier('com.company.homework');
    console.log('App by identifier:', appByIdentifier);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Create new app version
async function createAppExample() {
  try {
    const newApp = await App.create({
      app_name: 'Homework App',
      platform: 'ios',
      bundle_id: 'com.company.homework',
      version: '1.3.0',
      min_version: '1.0.0',
      build_number: 130,
      update_url: 'https://apps.apple.com/app/id123456789',
      release_notes: '- New AI-powered homework analysis\n- 50+ new features\n- Performance improvements',
      force_update: false,
      features: {
        chat_enabled: true,
        ai_analysis: true,
        premium_features: true,
        ar_preview: true
      }
    });
    console.log('Created app:', newApp);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 4: Update app
async function updateAppExample() {
  try {
    const updatedApp = await App.update(1, {
      is_active: false,
      force_update: true,
      release_notes: 'Critical security update - please update immediately'
    });
    console.log('Updated app:', updatedApp);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 5: Check if update is required
async function checkUpdateExample() {
  try {
    // Check if iOS app needs update
    const updateInfo = await App.checkUpdateRequired(
      'com.company.homework',
      '1.1.0', // Current version on user's device
      'ios'
    );
    console.log('Update info:', updateInfo);
    
    if (updateInfo.updateRequired) {
      console.log(`Update available: ${updateInfo.latestVersion}`);
      if (updateInfo.forceUpdate) {
        console.log('This is a mandatory update!');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 6: Get latest version
async function getLatestVersionExample() {
  try {
    const latestIOS = await App.getLatestVersion('com.company.homework', 'ios');
    console.log('Latest iOS version:', latestIOS);
    
    const latestAndroid = await App.getLatestVersion('com.company.homework', 'android');
    console.log('Latest Android version:', latestAndroid);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 7: Get app statistics
async function getStatsExample() {
  try {
    const stats = await App.getStats();
    console.log('App statistics:', stats);
    // Output: { total: 4, byPlatform: { ios: 2, android: 2 }, active: 3, inactive: 1 }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 8: Version comparison
function versionComparisonExample() {
  console.log(App.compareVersions('1.0.0', '1.0.1')); // -1 (first is older)
  console.log(App.compareVersions('2.0.0', '1.9.9')); // 1 (first is newer)
  console.log(App.compareVersions('1.2.3', '1.2.3')); // 0 (equal)
  console.log(App.compareVersions('1.2', '1.2.0')); // 0 (equal, handles different formats)
}

// Example 9: Integration with Express route
async function expressRouteExample(req, res) {
  try {
    // This would be in your route handler
    const { platform, current_version } = req.query;
    const identifier = platform === 'ios' ? req.query.bundle_id : req.query.package_name;
    
    const updateInfo = await App.checkUpdateRequired(identifier, current_version, platform);
    
    res.json({
      success: true,
      data: updateInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Export examples for testing
module.exports = {
  getAllAppsExample,
  findAppExample,
  createAppExample,
  updateAppExample,
  checkUpdateExample,
  getLatestVersionExample,
  getStatsExample,
  versionComparisonExample,
  expressRouteExample
};