# Project Brief: Moneyflow

## Overview
Moneyflow is a full-stack, containerized web application designed for digitizing, managing, and analyzing purchase receipts. It enables personal and collaborative expense tracking, allowing users to scan receipts, map cryptic product names to "friendly names," and split costs among contributors.

## Core Goals
1. **Receipt Digitization**: Automate the extraction of items from receipt images using OCR (Pytesseract) and AI (Mistral).
2. **Purchase Management**: Provide a structured way to record, edit, and organize purchases and their individual items.
3. **Collaborative Tracking**: Enable cost-sharing by assigning contributors and payers to specific items.
4. **Data Insights**: Transform raw purchase data into meaningful analytics via dashboards, scatter plots, and Sankey diagrams.
5. **Self-Hosted Security**: Design for deployment in private environments (LXC containers) with robust user/admin role management.

## Key Features
- **OCR/AI Scanning**: Multi-image upload with rotation/cropping and automated item extraction.
- **Friendly Name Mapping**: Intelligent logic to map extracted text (e.g., "FRSHMLK") to user-friendly names (e.g., "Milk") globally or per user.
- **Dynamic Purchase Editing**: Card-based interface for managing items, categories (3 levels), and contributors.
- **Admin Dashboard**: Comprehensive user management and access control.
- **Analytics**: Interactive visualizations of spending habits over time and by category, including cumulative spending, individual distributions, and Sankey diagrams for category flows.
