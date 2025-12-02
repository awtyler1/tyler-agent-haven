-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'formulary', 'sob', 'eoc', 'anoc', 'other'
  carrier TEXT, -- 'aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare'
  plan_name TEXT,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  embedding vector(768), -- Using 768 dimensions for text-embedding-3-small
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for filtering by carrier and document type
CREATE INDEX IF NOT EXISTS document_chunks_carrier_idx ON public.document_chunks(carrier);
CREATE INDEX IF NOT EXISTS document_chunks_type_idx ON public.document_chunks(document_type);
CREATE INDEX IF NOT EXISTS document_chunks_document_name_idx ON public.document_chunks(document_name);

-- Create function to search documents by similarity
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

-- Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is an internal agent tool)
CREATE POLICY "Allow all access to document_chunks"
ON public.document_chunks
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_chunks_updated_at
BEFORE UPDATE ON public.document_chunks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();