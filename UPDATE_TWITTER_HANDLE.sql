-- Update Twitter handle for existing Twitter OAuth users
-- Run this SQL to fix users who logged in before the fix

-- For your specific case (assuming InvestorGav is your Twitter handle):
UPDATE users 
SET twitter_handle = 'InvestorGav'
WHERE id = 35;

-- Note: The Twitter API returns:
-- screen_name: The @username (e.g., 'InvestorGav')
-- name: The display name (e.g., 'Gav')
-- We want to store screen_name in twitter_handle field