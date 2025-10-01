-- Migration: URL Metadata Fields
-- Fügt Felder für automatisch gescrapte Website-Metadaten hinzu

ALTER TABLE public.urls
ADD COLUMN IF NOT EXISTS page_title TEXT,
ADD COLUMN IF NOT EXISTS page_description TEXT,
ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Kommentare für bessere Dokumentation
COMMENT ON COLUMN public.urls.page_title IS 'Automatisch gescrapeter Seitentitel';
COMMENT ON COLUMN public.urls.page_description IS 'Automatisch gescrapete Meta-Beschreibung';
COMMENT ON COLUMN public.urls.preview_image_url IS 'OpenGraph Vorschaubild URL';
COMMENT ON COLUMN public.urls.favicon_url IS 'Favicon URL als Fallback';
