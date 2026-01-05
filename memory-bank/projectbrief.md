# Project Brief: Moneyflow

## Overview
Moneyflow is a full-stack, containerized web application designed for digitizing, managing, and analyzing purchase receipts within the context of specific **Projects** (e.g., trips, events, shared living). It enables personal and collaborative expense tracking, allowing users to scan receipts, map cryptic product names to "friendly names," and automatically calculate optimized debts between project participants.

## Core Goals
1. **Project-Based Organization**: Group purchases into distinct projects with defined participants to isolate financial contexts.
2. **Receipt Digitization**: Automate the extraction of items from receipt images using advanced Vision AI (Pixtral/Mistral).
3. **Collaborative Tracking**: Enable cost-sharing by assigning contributors and payers to specific items within a project.
4. **Optimized Money Flow**: Dynamically calculate an efficient settlement plan for each project, minimizing transactions.
5. **Data Insights**: Transform raw purchase data into meaningful analytics via dashboards, filterable by project.
6. **Self-Hosted Security**: Design for deployment in private environments (LXC containers) with robust user/admin role management.

## Key Features
- **Project Management**: Collaborative creation and management of projects. Users see only projects they are currently participating in.
- **Unified Search**: Instantly find Projects, Purchases, or Items from a central search bar, with project context provided.
- **OCR/AI Scanning**: Multi-image upload with automated item extraction using Vision LLMs.
- **Friendly Name Mapping**: Intelligent logic to map extracted text to user-friendly names.
- **Dynamic Purchase Editing**: Card-based interface for managing items, categories, and contributors.
- **Admin Dashboard**: Comprehensive user management and access control.
- **Analytics**: Interactive visualizations of spending habits, with support for **Saved Filters** and project-specific views.
