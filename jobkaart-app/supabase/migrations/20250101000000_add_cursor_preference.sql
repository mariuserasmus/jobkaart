-- Add cursor preference to users table
ALTER TABLE users
ADD COLUMN cursor_style VARCHAR(20) DEFAULT 'default' CHECK (cursor_style IN ('default', 'spanner', 'brush', 'screwdriver', 'hammer', 'drill'));

-- Add comment for documentation
COMMENT ON COLUMN users.cursor_style IS 'User''s preferred cursor style for clickable elements';
