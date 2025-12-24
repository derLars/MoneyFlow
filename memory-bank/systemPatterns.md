# System Patterns: Moneyflow

## Architecture Overview
Moneyflow follows a containerized, API-driven architecture.

- **Frontend**: Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
- **Backend**: RESTful API built with Python and FastAPI.
- **Database**: Relational database (PostgreSQL for production, SQLite supported).
- **Storage**: Abstracted storage layer for images (Local/Cloud).

## Key Technical Decisions
1. **API-First Design**: Separation of concerns between the frontend UI and backend business logic.
2. **Containerization**: Deployable via LXC containers for self-hosted isolation.
3. **OCR & AI Pipeline**:
   - Image Preprocessing: OpenCV (grayscale, blur, thresholding, contour detection).
   - OCR: Pytesseract for text extraction.
   - Analysis: Mistral AI (Small model) for structured item extraction from text.
4. **Friendly Name Mapping**: Two-tier logic (User-specific then Global) based on substring matching.
5. **Cost Splitting**: Equal distribution among contributors for simplicity.
6. **Abstract Storage**: `StorageInterface` class to support multiple providers (Local, Cloud).
7. **Database Encapsulation**: `database.py` module to isolate SQL logic from API routes.

## Design Patterns
- **Repository Pattern (simplified)**: `database.py` acts as a central repository for all data access.
- **Dependency Injection**: Used in FastAPI for managing database sessions and authentication.
- **Interface Segregation**: `StorageInterface` defines clear contracts for storage operations.
- **State Management**: Zustand on the frontend for global application state.
- **Component-Based UI**: Atomic and molecular components in React for reuse.

## Database Schema (Summary)
- `users`: Credentials and roles (Admin/User).
- `purchases`: Metadata (Creator, Payer, Name, Date).
- `items`: Individual products (Original name, Friendly name, Price, Quantity, Categories).
- `contributors`: Linking users to items for cost-sharing.
- `categories`: User-defined classification hierarchy.
- `friendly_names`: Mapping substrings to standardized names.
- `purchase_logs`: Audit trail for actions.

## User Roles & Permissions
- **User**: Manage own purchases and those where they are a contributor.
- **Administrator**: Universal access, user management, and auditing.
