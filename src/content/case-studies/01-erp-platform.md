---
title: "Building a 20+ Module ERP from Scratch"
description: "How we architected a large-scale Angular SPA with real-time notifications, role-based access control, and a shared component library for a federal contracting firm."
date: "2025-01-01"
tags: ["Angular", "Node.js", "MongoDB", "Socket.IO", "Azure"]
featured: true
---

## Context

A US federal contracting firm needed a unified platform to manage its core operations — proposals, contracts, finance, HR, reporting, and team management. I led a development team over three years, working closely with management on architecture and tech choices, and shipping the platform the company uses daily.

## The Challenge

- 20+ distinct workspaces with different workflows per department
- Strict role-based access across dozens of roles
- Real-time updates across teams
- Data export (Excel, PDF, CSV) from any view
- Cloud deployment with no dedicated DevOps team

## How We Approached It

### Modular Frontend

We structured each workspace as a lazy-loaded module in an Angular SPA. Shared layout (sidebar, navbar, notifications) wraps all authenticated routes. Modules load on demand — keeps the app fast despite its size and lets developers work on different modules independently.

### Role-Based Access at Every Layer

I implemented access control at three levels:

- **Route guards** — block unauthorized navigation
- **Structural directives** — hide UI elements users can't act on
- **Service-level checks** — programmatic role/department verification

This three-layer approach means nothing slips through regardless of how users interact with the app.

### Shared Component Library

We built ~40 reusable components used across all workspaces: configurable data tables, filter bars, file management with inline preview, threaded comments, changelog viewer, and export buttons. This was the biggest productivity multiplier — new workspaces went from weeks to days.

### Real-Time Notifications

I built two layers: WebSocket connections for instant in-app updates, and service worker push notifications for when the app isn't in focus. Subscription lifecycle tied to login/logout.

### Finance Module

Role-gated accounting workspace with AP/AR management, batch processing, approval workflows, and reporting. Most sensitive part of the system — strictest access control.

## Tech Stack

Angular, TypeScript, Node.js, Express, MongoDB, Socket.IO, Azure (App Service + Blob Storage), D3 for org visualization, Nx workspace tooling.

## What I'd Do Differently

- Add centralized state management earlier — services + RxJS subjects worked but got complex at scale
- Invest more in component testing from day one
- Use a lighter date library instead of Moment.js

## Key Takeaways

1. **Shared components are the highest-leverage investment** in a large app. Build them well early.
2. **Role-based access needs three layers** — routes, UI, services. Design it in from day one.
3. **Real-time features change behavior.** Teams stopped checking dashboards manually once the system told them what needed attention.
4. **Lazy loading isn't optional at scale.** 20+ eager modules would have killed performance.
