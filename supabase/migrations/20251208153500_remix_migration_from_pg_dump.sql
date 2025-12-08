CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: search_documents(public.vector, double precision, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_documents(query_embedding public.vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 5, filter_carrier text DEFAULT NULL::text, filter_type text DEFAULT NULL::text) RETURNS TABLE(id uuid, document_name text, document_type text, carrier text, plan_name text, chunk_text text, page_number integer, similarity double precision)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_name text NOT NULL,
    document_type text NOT NULL,
    carrier text,
    plan_name text,
    chunk_text text NOT NULL,
    chunk_index integer NOT NULL,
    page_number integer,
    embedding public.vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: processing_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_documents integer DEFAULT 0 NOT NULL,
    processed_documents integer DEFAULT 0 NOT NULL,
    failed_documents integer DEFAULT 0 NOT NULL,
    current_document text,
    error_message text,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT processing_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: processing_jobs processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: document_chunks_carrier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_chunks_carrier_idx ON public.document_chunks USING btree (carrier);


--
-- Name: document_chunks_document_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_chunks_document_name_idx ON public.document_chunks USING btree (document_name);


--
-- Name: document_chunks_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: document_chunks_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_chunks_type_idx ON public.document_chunks USING btree (document_type);


--
-- Name: idx_processing_jobs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_created_at ON public.processing_jobs USING btree (created_at DESC);


--
-- Name: idx_processing_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_status ON public.processing_jobs USING btree (status);


--
-- Name: document_chunks update_document_chunks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON public.document_chunks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: processing_jobs update_processing_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON public.processing_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_chunks Allow all access to document_chunks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to document_chunks" ON public.document_chunks USING (true) WITH CHECK (true);


--
-- Name: processing_jobs Allow all access to processing_jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to processing_jobs" ON public.processing_jobs USING (true) WITH CHECK (true);


--
-- Name: document_chunks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

--
-- Name: processing_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


