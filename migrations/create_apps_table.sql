-- Apps Table for managing mobile app versions and updates
CREATE TABLE IF NOT EXISTS apps (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL,
    platform VARCHAR(10) CHECK (platform IN ('ios', 'android')) NOT NULL,
    bundle_id VARCHAR(255), -- For iOS apps
    package_name VARCHAR(255), -- For Android apps
    version VARCHAR(50) NOT NULL,
    min_version VARCHAR(50), -- Minimum supported version
    build_number INTEGER,
    update_url TEXT NOT NULL, -- App Store or Play Store URL
    release_notes TEXT,
    force_update BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    features JSONB, -- Store feature flags or configurations
    metadata JSONB, -- Additional app-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique version per platform and app identifier
    CONSTRAINT unique_ios_version UNIQUE (bundle_id, version, platform),
    CONSTRAINT unique_android_version UNIQUE (package_name, version, platform)
);

-- Indexes for better performance
CREATE INDEX idx_apps_platform ON apps(platform);
CREATE INDEX idx_apps_bundle_id ON apps(bundle_id);
CREATE INDEX idx_apps_package_name ON apps(package_name);
CREATE INDEX idx_apps_is_active ON apps(is_active);
CREATE INDEX idx_apps_version ON apps(version);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO apps (app_name, platform, bundle_id, package_name, version, min_version, update_url, release_notes, force_update, features) VALUES
-- iOS App
('Homework App', 'ios', 'com.company.homework', NULL, '1.2.0', '1.0.0', 'https://apps.apple.com/app/id123456789', 
'- New features added\n- Performance improvements\n- Bug fixes', false, 
'{"chat_enabled": true, "ai_analysis": true, "premium_features": false}'::jsonb),

('Homework App', 'ios', 'com.company.homework', NULL, '1.1.0', '1.0.0', 'https://apps.apple.com/app/id123456789', 
'- Fixed camera issues\n- Added new filters', false, 
'{"chat_enabled": true, "ai_analysis": false, "premium_features": false}'::jsonb),

-- Android App
('Homework App', 'android', NULL, 'com.company.homework', '1.2.0', '1.0.0', 'https://play.google.com/store/apps/details?id=com.company.homework', 
'- New features added\n- Performance improvements\n- Bug fixes', false, 
'{"chat_enabled": true, "ai_analysis": true, "premium_features": false}'::jsonb),

('Homework App', 'android', NULL, 'com.company.homework', '1.1.0', '1.0.0', 'https://play.google.com/store/apps/details?id=com.company.homework', 
'- Fixed camera issues\n- Added new filters', false, 
'{"chat_enabled": true, "ai_analysis": false, "premium_features": false}'::jsonb);