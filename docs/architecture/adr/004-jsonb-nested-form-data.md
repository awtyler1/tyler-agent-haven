# ADR-004: JSONB for Nested Form Data

**Status:** Accepted
**Date:** December 2025
**Deciders:** Development team

## Context

The contracting application form has deeply nested data structures: arrays of disciplinary entries, legal question responses, agreement signatures, and selected carrier lists. These structures evolve as the form is developed.

## Decision

Store complex nested structures as JSONB columns in the `contracting_applications` table.

## Rationale

- **Schema flexibility** — form structure can evolve without migrations
- **Single-row updates** — update one JSONB column instead of multiple joined tables
- **PostgreSQL optimization** — JSONB is well-indexed and queryable
- **Simpler code** — map directly to TypeScript objects

## Implementation

```sql
-- contracting_applications table
selected_carriers    JSONB  -- [{code: 'aetna', name: 'Aetna'}, ...]
legal_questions      JSONB  -- {question1: true, question2: false, ...}
disciplinary_entries JSONB  -- [{description: '...', date: '...'}]
agreements           JSONB  -- {terms: true, signature: '...', date: '...'}
uploaded_documents   JSONB  -- [{name: '...', path: '...', type: '...'}]
```

## Consequences

### Positive
- Schema flexibility — add/modify form fields without migration
- Simple read/write — single row per application
- Good performance for the access patterns used

### Negative
- No foreign key constraints on nested data
- Harder to query individual nested fields across applications
- No type validation at the database level (relies on app-level Zod validation)
