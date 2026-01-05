# System Patterns: Moneyflow

## Architecture Overview
Moneyflow follows a containerized, API-driven architecture.

- **Frontend**: Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
- **Backend**: RESTful API built with Python and FastAPI.
- **Database**: Relational database (PostgreSQL for production, SQLite supported).
- **Storage**: Abstracted storage layer for images (Local/Cloud).

## Key Technical Decisions
1. **Project-Based Architecture**: Top-level entity "Project" encapsulates purchases, participants, and money flow.
2. **API-First Design**: Separation of concerns between the frontend UI and backend business logic.
3. **Containerization**: Deployable via LXC containers for self-hosted isolation.
4. **OCR & AI Pipeline**:
   - **Pixtral (Vision LLM)**: Direct image-to-JSON extraction of receipt items, replacing complex OpenCV pipelines.
5. **Friendly Name Mapping**: Two-tier logic (User-specific then Global) based on substring matching.
6. **Project Visibility**: When a user leaves a project, they are marked as an inactive participant (`is_active = False`). They can no longer see the project or its data. However, their historical involvement (as payer/contributor) is preserved, and they remain selectable in the project context, clearly marked as "(removed)".
7. **Optimized Money Flow**: Debt calculation uses a settlement algorithm to minimize and simplify transactions within a project group.

## Design Patterns
- **Repository Pattern (simplified)**: Data access is encapsulated in repository modules (e.g., `purchase_repo.py`).
- **Dependency Injection**: Used in FastAPI for managing database sessions and authentication.
- **State Management**: Zustand on the frontend for global application state (Auth, Projects).
- **Component-Based UI**: Atomic and molecular components in React for reuse.

## Database Schema (Summary)
- `users`: Credentials and roles.
- `projects`: Metadata (Name, Image, CreatedBy).
- `project_participants`: Link table (User <-> Project).
- `purchases`: Metadata (Name, Date, ProjectFK).
- `items`: Individual products (Original name, Friendly name, Price, Quantity, Categories).
- `contributors`: Linking users to items for cost-sharing.
- `saved_filters`: Analytics configurations (UserFK, Name, JSON).
- `categories`: User-defined classification hierarchy.
- `friendly_names`: Mapping substrings to standardized names.
- `purchase_logs`: Audit trail for actions.

## User Roles & Permissions
- **User**: Manage own profile, participate in projects. Full management rights over projects they are a participant in.
- **Administrator**: Universal access, user management, and auditing.
