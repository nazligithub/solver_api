-- Add order column to hair_styles table
ALTER TABLE hair_styles ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Add order column to hair_colors table
ALTER TABLE hair_colors ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hair_styles_order ON hair_styles("order");
CREATE INDEX IF NOT EXISTS idx_hair_colors_order ON hair_colors("order");

-- Set initial order values based on current ID order
UPDATE hair_styles SET "order" = ROW_NUMBER() OVER (ORDER BY id) - 1 WHERE "order" = 0;
UPDATE hair_colors SET "order" = ROW_NUMBER() OVER (ORDER BY id) - 1 WHERE "order" = 0;