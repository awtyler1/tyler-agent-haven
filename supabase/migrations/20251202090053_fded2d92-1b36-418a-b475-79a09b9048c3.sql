-- Update embedding column to support 1536 dimensions (OpenAI text-embedding-3-small)
ALTER TABLE document_chunks 
ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the search function with updated dimension
DROP FUNCTION IF EXISTS search_documents(vector, double precision, integer, text, text);

CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 5,
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
  similarity double precision
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