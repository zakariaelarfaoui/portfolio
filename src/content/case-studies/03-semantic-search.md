---
title: "Semantic Search and LLM Integration for Document Discovery"
description: "Building a search system that understands meaning, not just keywords — using vector embeddings, pgvector, and an LLM to surface relevant documents and generate structured breakdowns."
date: "2025-08-01"
tags: ["PostgreSQL", "pgvector", "Python", "Django", "Celery", "LLM"]
featured: true
---

## Context

A platform aggregating large volumes of structured documents needed a smarter search than keyword matching. Users needed to find relevant items based on intent — not exact terminology — and get an AI-generated breakdown of why a result was relevant to their query.

I built the search backend and LLM integration layer for this system.

## The Challenge

Keyword search fails when users don't know the exact terms used in a document. Two documents can describe the same concept using completely different words. Traditional full-text search misses these matches.

Additionally, documents were long — often multi-section PDFs. A simple "embed the whole document" approach loses precision: a document might be highly relevant on page 3 but completely off-topic on page 1. Embedding the whole thing buries the signal.

## How We Approached It

### Per-Chunk Embeddings with Best-Chunk-Wins Scoring

Instead of embedding entire documents, we split each document into chunks and embed each chunk independently. At query time, we embed the user's query and find the most similar chunk across all documents.

The score for a document is the score of its best-matching chunk — not an average. This means one highly relevant section surfaces the whole document, even if the rest is noise.

```
query → embedding → pgvector similarity search → top-K chunks → deduplicate by document → ranked results
```

We store embeddings in PostgreSQL using `pgvector`, which keeps everything in one database and avoids a separate vector store.

### Background Re-Embedding on Content Updates

When a document is updated, its chunks need to be re-embedded. We queued re-embedding as a Celery task triggered on save — the user gets an immediate response, and the embedding update happens asynchronously.

This matters because embedding calls are slow and synchronous re-embedding would block the request cycle.

### LLM-Generated Breakdowns

For each search result, users could request an AI-generated breakdown: why is this relevant? What are the key points?

We used Google Gemini with inline multi-PDF context — passing up to 5 source documents directly in the prompt rather than summarizing them first. This gives the model full fidelity and avoids lossy pre-summarization.

The breakdown is generated on demand and cached — not pre-computed for every document on every query.

### Automated Ingestion Pipeline

New documents arrived from external sources on a schedule. We used Celery Beat to run ingestion every 30 minutes with two fetch modes:

- **Concurrent**: multiple sources fetched in parallel for speed
- **Sequential**: for sources with rate limits or unstable APIs

Each ingested document is deduplicated by hash before being stored and queued for embedding.

### Caching for Performance

Search results and opportunity lists are Redis-cached with configurable TTL. Fresh queries hit pgvector; repeated queries with the same parameters serve from cache. Cache invalidation happens on document updates.

## Tech Stack

Django, PostgreSQL, pgvector, Celery, Celery Beat, Redis, Google Gemini API, Python.

## What I'd Do Differently

- **Chunk strategy**: Fixed-size chunking works but loses semantic boundaries. Sentence-aware or paragraph-aware chunking would improve retrieval precision.
- **Hybrid search**: Pure vector search misses exact keyword matches that are always relevant (IDs, codes, names). A hybrid approach — vector + BM25 with score fusion — would cover both cases.
- **Embedding model**: We used a general-purpose embedding model. A domain-specific model fine-tuned on the document type would likely improve relevance significantly.

## Key Takeaways

1. **Chunk, don't embed whole documents.** Long documents need fine-grained embeddings. Best-chunk-wins scoring surfaces the right signal.
2. **Keep vectors in your existing database if you can.** pgvector is fast enough for most scales and eliminates operational complexity of a separate vector store.
3. **Re-embedding is async work.** Never block a write request on an embedding call.
4. **LLMs work best with full context.** Passing source documents directly beats pre-summarizing — the model does the reasoning, not a lossy preprocessing step.
