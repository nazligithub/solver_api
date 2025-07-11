-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_contexts CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS processing_history CASCADE;
DROP TABLE IF EXISTS face_analyses CASCADE;
DROP TABLE IF EXISTS image_uploads CASCADE;
DROP TABLE IF EXISTS hair_colors CASCADE;
DROP TABLE IF EXISTS hair_styles CASCADE;

-- Hair Styles Table
CREATE TABLE hair_styles (
    id SERIAL PRIMARY KEY,
    style_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    prompt_text TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hair Colors Table
CREATE TABLE hair_colors (
    id SERIAL PRIMARY KEY,
    color_name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    prompt_text TEXT NOT NULL,
    image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image Uploads Table
CREATE TABLE image_uploads (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255),
    storage_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing History Table (for hair color/style changes)
CREATE TABLE processing_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    input_image_id INTEGER REFERENCES image_uploads(id),
    output_image_url TEXT,
    process_type VARCHAR(20) CHECK (process_type IN ('color_change', 'style_change')),
    style_id INTEGER REFERENCES hair_styles(id),
    color_id INTEGER REFERENCES hair_colors(id),
    custom_color VARCHAR(50),
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Face Analyses Table
CREATE TABLE face_analyses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    input_image_id INTEGER REFERENCES image_uploads(id),
    face_shape VARCHAR(50),
    analysis_result JSONB,
    recommendations JSONB,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_processing_history_user_id ON processing_history(user_id);
CREATE INDEX idx_processing_history_status ON processing_history(status);
CREATE INDEX idx_face_analyses_user_id ON face_analyses(user_id);
CREATE INDEX idx_face_analyses_status ON face_analyses(status);
CREATE INDEX idx_hair_styles_gender ON hair_styles(gender);
CREATE INDEX idx_hair_colors_gender ON hair_colors(gender);
CREATE INDEX idx_hair_colors_name_gender ON hair_colors(color_name, gender);
CREATE INDEX idx_image_uploads_user_id ON image_uploads(user_id);

-- Insert predefined hair colors (Male)
INSERT INTO hair_colors (color_name, hex_code, gender, prompt_text, image_url) VALUES
('Jet Black', '#1B1B1B', 'male', 'jet black hair on male', 'https://example.com/male-jet-black-hair.jpg'),
('Natural Black', '#2C2416', 'male', 'natural black hair on male', 'https://example.com/male-natural-black-hair.jpg'),
('Dark Chocolate', '#3B2F2F', 'male', 'dark chocolate brown hair on male', 'https://example.com/male-dark-chocolate-hair.jpg'),
('Chestnut Brown', '#8B4513', 'male', 'chestnut brown hair on male', 'https://example.com/male-chestnut-hair.jpg'),
('Caramel Brown', '#C68642', 'male', 'caramel brown hair on male', 'https://example.com/male-caramel-hair.jpg'),
('Honey Blonde', '#F0E68C', 'male', 'honey blonde hair on male', 'https://example.com/male-honey-blonde-hair.jpg'),
('Platinum Blonde', '#FAFAD2', 'male', 'platinum blonde hair on male', 'https://example.com/male-platinum-hair.jpg'),
('Strawberry Blonde', '#F4A460', 'male', 'strawberry blonde hair on male', 'https://example.com/male-strawberry-blonde-hair.jpg'),
('Copper Red', '#B87333', 'male', 'copper red hair on male', 'https://example.com/male-copper-hair.jpg'),
('Auburn', '#A52A2A', 'male', 'auburn hair on male', 'https://example.com/male-auburn-hair.jpg'),
('Ash Gray', '#B2BEB5', 'male', 'ash gray hair on male', 'https://example.com/male-ash-gray-hair.jpg'),
('Silver Fox', '#C0C0C0', 'male', 'silver fox hair on male', 'https://example.com/male-silver-fox-hair.jpg');

-- Insert predefined hair colors (Female)
INSERT INTO hair_colors (color_name, hex_code, gender, prompt_text, image_url) VALUES
('Jet Black', '#1B1B1B', 'female', 'jet black hair on female', 'https://example.com/female-jet-black-hair.jpg'),
('Natural Black', '#2C2416', 'female', 'natural black hair on female', 'https://example.com/female-natural-black-hair.jpg'),
('Espresso Brown', '#4E3B31', 'female', 'espresso brown hair on female', 'https://example.com/female-espresso-hair.jpg'),
('Chocolate Brown', '#7B3F00', 'female', 'chocolate brown hair on female', 'https://example.com/female-chocolate-hair.jpg'),
('Caramel Highlights', '#DDA15E', 'female', 'caramel highlights hair on female', 'https://example.com/female-caramel-hair.jpg'),
('Golden Blonde', '#FFD700', 'female', 'golden blonde hair on female', 'https://example.com/female-golden-blonde-hair.jpg'),
('Platinum Blonde', '#E5E4E2', 'female', 'platinum blonde hair on female', 'https://example.com/female-platinum-hair.jpg'),
('Rose Gold', '#E0BFB8', 'female', 'rose gold hair on female', 'https://example.com/female-rose-gold-hair.jpg'),
('Burgundy', '#800020', 'female', 'burgundy hair on female', 'https://example.com/female-burgundy-hair.jpg'),
('Mahogany', '#C04000', 'female', 'mahogany hair on female', 'https://example.com/female-mahogany-hair.jpg'),
('Ash Blonde', '#A8A19E', 'female', 'ash blonde hair on female', 'https://example.com/female-ash-blonde-hair.jpg'),
('Pearl Silver', '#F5F5F5', 'female', 'pearl silver hair on female', 'https://example.com/female-pearl-silver-hair.jpg');

-- Insert custom color option
INSERT INTO hair_colors (color_name, hex_code, gender, prompt_text, image_url) VALUES
('Custom', NULL, 'male', 'custom color hair on male', 'https://example.com/male-custom-color.jpg'),
('Custom', NULL, 'female', 'custom color hair on female', 'https://example.com/female-custom-color.jpg');

-- Insert hair styles
INSERT INTO hair_styles (style_name, gender, prompt_text, description, image_url) VALUES
-- Male Styles
('Classic Fade', 'male', 'classic fade haircut, short on sides, medium on top', 'A timeless fade with clean lines', 'https://example.com/male-classic-fade.jpg'),
('Textured Quiff', 'male', 'modern textured quiff hairstyle, volumized front', 'Stylish quiff with natural texture', 'https://example.com/male-textured-quiff.jpg'),
('Slick Back', 'male', 'slicked back hairstyle, smooth and professional', 'Professional slicked back look', 'https://example.com/male-slick-back.jpg'),
('Messy Fringe', 'male', 'messy fringe haircut, textured bangs', 'Casual messy fringe style', 'https://example.com/male-messy-fringe.jpg'),
('Buzz Cut', 'male', 'buzz cut, very short all over', 'Clean and minimal buzz cut', 'https://example.com/male-buzz-cut.jpg'),
('Pompadour', 'male', 'classic pompadour, high volume on top', 'Vintage-inspired pompadour', 'https://example.com/male-pompadour.jpg'),
('Man Bun', 'male', 'man bun hairstyle, long hair tied up', 'Trendy man bun style', 'https://example.com/male-man-bun.jpg'),
('Crew Cut', 'male', 'crew cut, short and neat', 'Military-inspired crew cut', 'https://example.com/male-crew-cut.jpg'),
('French Crop', 'male', 'french crop haircut, textured fringe', 'Modern French crop with texture', 'https://example.com/male-french-crop.jpg'),
('Mohawk Fade', 'male', 'mohawk fade, edgy and modern', 'Bold mohawk with faded sides', 'https://example.com/male-mohawk-fade.jpg'),
('Side Part', 'male', 'classic side part, professional look', 'Traditional side part style', 'https://example.com/male-side-part.jpg'),
('Spiky Hair', 'male', 'spiky hairstyle, textured spikes', 'Edgy spiky hair look', 'https://example.com/male-spiky-hair.jpg'),
('Curly Top', 'male', 'curly hair on top, faded sides', 'Natural curls with fade', 'https://example.com/male-curly-top.jpg'),
('Long Flow', 'male', 'long flowing hair, shoulder length', 'Relaxed long hair style', 'https://example.com/male-long-flow.jpg'),
('Undercut', 'male', 'undercut hairstyle, disconnected sides', 'Modern undercut style', 'https://example.com/male-undercut.jpg'),

-- Female Styles
('Long Waves', 'female', 'long wavy hair, beachy waves', 'Elegant beach waves', 'https://example.com/female-long-waves.jpg'),
('Bob Cut', 'female', 'classic bob haircut, chin length', 'Timeless bob cut', 'https://example.com/female-bob-cut.jpg'),
('Pixie Cut', 'female', 'pixie cut, short and chic', 'Edgy pixie cut', 'https://example.com/female-pixie-cut.jpg'),
('Long Straight', 'female', 'long straight hair, sleek and smooth', 'Sleek straight hair', 'https://example.com/female-long-straight.jpg'),
('Layered Cut', 'female', 'layered haircut, textured layers', 'Dynamic layered style', 'https://example.com/female-layered-cut.jpg'),
('Side Swept Bangs', 'female', 'side swept bangs with long hair', 'Romantic side swept style', 'https://example.com/female-side-swept-bangs.jpg'),
('Braided Updo', 'female', 'elegant braided updo hairstyle', 'Sophisticated braided updo', 'https://example.com/female-braided-updo.jpg'),
('Messy Bun', 'female', 'messy bun hairstyle, casual chic', 'Effortless messy bun', 'https://example.com/female-messy-bun.jpg'),
('Shoulder Length Curls', 'female', 'shoulder length curly hair', 'Bouncy shoulder curls', 'https://example.com/female-shoulder-curls.jpg'),
('Blunt Bangs', 'female', 'blunt bangs with long hair', 'Bold blunt bangs look', 'https://example.com/female-blunt-bangs.jpg'),
('Shag Cut', 'female', 'modern shag haircut, textured layers', 'Retro-inspired shag', 'https://example.com/female-shag-cut.jpg'),
('French Bob', 'female', 'french bob, chin length with bangs', 'Chic French bob', 'https://example.com/female-french-bob.jpg'),
('Half Up Half Down', 'female', 'half up half down hairstyle', 'Versatile half up style', 'https://example.com/female-half-up-half-down.jpg'),
('Asymmetrical Cut', 'female', 'asymmetrical haircut, edgy and modern', 'Edgy asymmetrical style', 'https://example.com/female-asymmetrical-cut.jpg'),
('Volume Blowout', 'female', 'voluminous blowout, full body hair', 'Glamorous volume blowout', 'https://example.com/female-volume-blowout.jpg');

-- Conversations Table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) DEFAULT 'Yeni Sohbet',
    last_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Contexts Table (for linking face analyses to conversations)
CREATE TABLE conversation_contexts (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    face_analysis_id INTEGER REFERENCES face_analyses(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, face_analysis_id)
);

-- Indexes for chat tables
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversation_contexts_conversation_id ON conversation_contexts(conversation_id);