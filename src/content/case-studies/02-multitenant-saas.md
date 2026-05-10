---
title: "Multi-Tenant SaaS Backend with Schema Isolation"
description: "How we architected a backend where each customer's data is completely isolated at the database schema level — no shared tables, no risk of data leakage."
date: "2025-06-01"
tags: ["Django", "PostgreSQL", "Celery", "Azure", "Python"]
featured: true
---

## Context

A SaaS platform serving multiple independent organizations needed strict data isolation between tenants. Not row-level filtering — full schema separation. Each customer gets their own PostgreSQL schema, their own Celery task queue awareness, their own media storage paths, and their own audit trail.

I designed and built the backend architecture for this system as part of a backend role at a software company.

## The Challenge

Multi-tenancy is easy to get wrong. Common failure modes:

- Row-level filtering with a `tenant_id` column — one missing `WHERE` clause exposes all tenant data
- Shared sequences and IDs — tenants can enumerate each other's records
- Shared task queues — one tenant's background jobs affect another's performance
- Shared media storage — misconfigured paths leak files across tenants

The platform needed hard isolation, not soft filtering.

## How We Approached It

### Schema-Per-Tenant with django-tenants

We used `django-tenants` to give each customer their own PostgreSQL schema. When a request comes in, the middleware reads the subdomain, resolves the tenant, and sets the search path to that tenant's schema for the duration of the request.

This means:
- `SELECT * FROM users` only ever returns that tenant's users — no `WHERE tenant_id = ?` needed
- Migrations run per-tenant, not globally
- Tenant onboarding creates a new schema and runs all migrations fresh

### Tenant-Aware Celery Tasks

Background tasks inherit the tenant context. When a task is queued, we attach the tenant identifier to the task kwargs. The Celery worker resolves the tenant and sets the schema before executing.

Without this, async tasks run in the public schema — wrong data, wrong tenant, silent failures.

### Media Storage with Tenant-Scoped Paths

Every file upload goes to a path prefixed with the tenant identifier. Azure Blob Storage paths follow the pattern `{tenant-slug}/{resource-type}/{uuid}.{ext}`. Signed URLs are generated with 1-hour expiration — no direct blob access.

This means even if a URL leaks, it expires quickly and can't be guessed.

### Device Authentication for Non-Browser Clients

One module needed to authenticate hardware devices (not users with passwords). We implemented a `client_id + PIN` flow that provisions a device token on first auth and rotates it daily. No password, no session — just a token with a short freshness window.

This was cleaner than shoehorning browser session logic onto hardware clients.

### Audit Trails Per Tenant

We used `django-simple-history` to track changes on every model. Because each tenant has its own schema, history tables are automatically scoped — no cross-tenant history bleed. UUID primary keys throughout prevent ID enumeration.

## Tech Stack

Django, django-tenants, PostgreSQL (schema-per-tenant), Celery, Azure Blob Storage, Python, REST Framework.

## What I'd Do Differently

- **Tenant onboarding time**: Running all migrations for a new tenant is slow. Tenant cloning from a template schema would be faster for large schemas.
- **Task routing**: Dedicated Celery queues per tenant would give better isolation for heavy workloads. We used a shared queue with tenant context — fine for moderate load but not ideal at scale.
- **Schema migration strategy**: Rolling out breaking migrations across many tenant schemas requires careful sequencing. We handled it manually — automating this would reduce risk.

## Key Takeaways

1. **Schema isolation beats row-level filtering** for regulated or sensitive SaaS. The complexity cost is worth it — a missing `WHERE` clause can't leak what doesn't exist in the same table.
2. **Async tasks need tenant context explicitly.** It doesn't propagate automatically. Design for it from day one.
3. **Storage paths are a security boundary.** Treat them as such — prefix with tenant identifiers, sign URLs, set short expiration.
4. **Hardware clients need their own auth model.** Don't stretch browser session patterns to cover them.
