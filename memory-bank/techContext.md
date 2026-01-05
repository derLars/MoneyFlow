# Technical Context: Moneyflow

## Development Environment
- **OS**: Linux (Target: LXC containers)
- **Language**: Python 3.x (Backend), JavaScript/JSX (Frontend)
- **Runtime**: Node.js (for Frontend build tools)

## Backend Stack
- **Framework**: FastAPI
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL (Primary) / SQLite (Fallback)
- **ORM**: SQLAlchemy
- **AI/OCR**: Mistral AI SDK (Pixtral Vision Model) - Direct Image-to-JSON
- **Configuration**: PyYAML (for `config.yaml`)

## Frontend Stack
- **Framework**: React (via Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (Stores: Auth, Project)
- **Charts**: Recharts (Scatter Plot, Sankey Diagram)
- **HTTP Client**: Axios

## External Dependencies & Tools
- **Mistral API**: Requires `MISTRAL_API_KEY` environment variable.
- **Proxmox/LXC**: Target deployment platform.

## Technical Constraints
- **Self-Hosted**: All components must be containerizable and easy to deploy in a private environment.
- **Security**: Sensitive data (passwords) must be hashed. Access to projects and purchases must be strictly enforced via participant lists.
- **Responsiveness**: UI must be mobile-friendly for scanning receipts on the go.
- **Storage Abstraction**: Must support local storage as well as cloud-based options.

## Project Structure
```text
Moneyflow/
├── backend/            # FastAPI source code
│   ├── api/        # Routes (projects.py, purchases.py, etc.)
│   ├── core/       # Security, Config, Storage
│   ├── database.py # DB connection & Session
│   ├── models.py   # SQLAlchemy Models
│   ├── services/   # OCR, Mapping
│   └── main.py
├── frontend/           # React source code (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/      # Zustand
│   │   └── assets/
│   ├── tailwind.config.js
│   └── package.json
└── docker/             # Containerization files
```
