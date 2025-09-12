-- Fix HTML entities in existing comments
-- This migration decodes HTML entities that were unnecessarily encoded

-- Update comments with encoded apostrophes
UPDATE comments 
SET content = REPLACE(content, '&#x27;', '''')
WHERE content LIKE '%&#x27;%';

-- Update comments with encoded quotes
UPDATE comments 
SET content = REPLACE(content, '&quot;', '"')
WHERE content LIKE '%&quot;%';

-- Update comments with encoded forward slashes
UPDATE comments 
SET content = REPLACE(content, '&#x2F;', '/')
WHERE content LIKE '%&#x2F;%';

-- Update comments with encoded less than
UPDATE comments 
SET content = REPLACE(content, '&lt;', '<')
WHERE content LIKE '%&lt;%';

-- Update comments with encoded greater than
UPDATE comments 
SET content = REPLACE(content, '&gt;', '>')
WHERE content LIKE '%&gt;%';

-- Also update the HTML content if it exists
UPDATE comments 
SET content_html = REPLACE(content_html, '&#x27;', '''')
WHERE content_html LIKE '%&#x27;%' AND content_html IS NOT NULL;

UPDATE comments 
SET content_html = REPLACE(content_html, '&quot;', '"')
WHERE content_html LIKE '%&quot;%' AND content_html IS NOT NULL;

UPDATE comments 
SET content_html = REPLACE(content_html, '&#x2F;', '/')
WHERE content_html LIKE '%&#x2F;%' AND content_html IS NOT NULL;