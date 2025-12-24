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
- **Image Processing**: OpenCV, Pytesseract (OCR)
- **AI**: Mistral AI SDK
- **Configuration**: PyYAML (for `config.yaml`)

## Frontend Stack
- **Framework**: React (via Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts (Scatter Plot, Sankey Diagram)
- **HTTP Client**: Axios or Fetch API

## External Dependencies & Tools
- **Pytesseract**: Requires `tesseract-ocr` engine installed on the system.
- **OpenCV**: `opencv-python` for image manipulation.
- **Mistral API**: Requires `MISTRAL_API_KEY` environment variable.
- **Proxmox/LXC**: Target deployment platform.

## Technical Constraints
- **Self-Hosted**: All components must be containerizable and easy to deploy in a private environment.
- **Security**: Sensitive data (passwords) must be hashed. Access to purchases must be strictly enforced via user IDs and contributor lists.
- **Responsiveness**: UI must be mobile-friendly for scanning receipts on the go.
- **Storage Abstraction**: Must support local storage as well as cloud-based options.

## Project Structure (Planned)
```text
Moneyflow/
├── backend/            # FastAPI source code
│   ├── app/
│   │   ├── api/        # Routes
│   │   ├── core/       # Security, Config, Storage
│   │   ├── db/         # database.py, models
│   │   ├── services/   # OCR, AI processing
│   │   └── main.py
│   └── config.yaml
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
