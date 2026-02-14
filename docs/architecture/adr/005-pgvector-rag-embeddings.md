# ADR-005: pgvector for RAG Embeddings

**Status:** Accepted
**Date:** January 2026
**Deciders:** Development team

## Context

The AI chatbot needs vector similarity search for RAG (Retrieval Augmented Generation). Options:
- Dedicated vector DB (Pinecone, Weaviate, Qdrant)
- pgvector extension in existing PostgreSQL

## Decision

Use pgvector extension with 1536-dimension embeddings in the existing Supabase PostgreSQL database.

## Rationale

- **Single database** — no additional infrastructure to manage
- **Native PostgreSQL** — extension installs with one command
- **Supabase support** — pgvector is a first-class Supabase extension
- **Sufficient scale** — our document corpus is small (carrier guides, compliance docs)

## Implementation

```sql
-- Enable extension
CREATE EXTENSION vector;

-- document_chunks table
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI embedding dimensions
  metadata JSONB,
  source_document TEXT
);

-- Similarity search
SELECT content, 1 - (embedding <=> query_vector) AS similarity
FROM document_chunks
ORDER BY embedding <=> query_vector
LIMIT 5;
```

## Consequences

### Positive
- No additional infrastructure costs
- Same backup/recovery as main database
- Integrated with existing RLS policies
- Simple deployment (extension already available)

### Negative
- May need index optimization (IVFFlat or HNSW) if corpus grows large
- Embedding computation happens in edge functions, not in DB
- Limited to PostgreSQL's vector capabilities
