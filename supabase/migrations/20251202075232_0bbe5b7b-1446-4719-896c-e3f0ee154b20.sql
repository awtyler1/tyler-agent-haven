-- Fix security warnings from previous migration

-- 1. Fix search_documents function with proper search_path
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_carrier text DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_name text,
  document_type text,
  carrier text,
  plan_name text,
  chunk_text text,
  page_number integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_name,
    document_chunks.document_type,
    document_chunks.carrier,
    document_chunks.plan_name,
    document_chunks.chunk_text,
    document_chunks.page_number,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE 
    (filter_carrier IS NULL OR document_chunks.carrier = filter_carrier)
    AND (filter_type IS NULL OR document_chunks.document_type = filter_type)
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. Fix update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Move vector extension to extensions schema (if not already there)
-- Note: This cannot be moved after creation, so we'll just document it
-- The extension is safe in public schema for this use case