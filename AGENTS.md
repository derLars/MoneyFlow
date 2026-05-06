# MoneyFlow - Agents Guide

## Quick start
```bash
# Dev (hot-reload backend + frontend)
docker compose -f docker-compose.dev.yml up -d
# Frontend at http://localhost:5173, API at http://localhost:8002

# Production
docker compose up -d --build
# App at http://localhost:80, API at http://localhost:8002

# Create/reset admin user
docker exec moneyflow-backend python3 create_admin_user.py

# Run migrations (auto-run on container start, but can run manually)
docker exec moneyflow-backend python3 migrate.py
```

## Setup
- `.env` file required with `SECRET_KEY` (random hex) and `MISTRAL_API_KEY`
- Config via `config.yaml` with env var overrides: `DATABASE_TYPE`, `DATABASE_URL`
- Database: PostgreSQL (default) or SQLite (`database.type` in config.yaml)

## Architecture
- **Backend**: FastAPI on port 8002, JWT auth (bcrypt), SQLAlchemy ORM
- **Frontend**: React 19 + Vite + Tailwind CSS 3 + Zustand state management
- **AI**: Mistral Pixtral Vision API for receipt OCR (requires `MISTRAL_API_KEY`)
- **Deploy**: Docker Compose or Proxmox LXC (via `moneyflow.sh`)

## Structure
```
MoneyFlow/
  backend/           # FastAPI app
    main.py          # Entrypoint, mounts routers at /api
    routers/         # auth, purchases, ocr, payments, categories, mapping, projects, search, analytics
    repositories/    # Data access layer (user_repo, project_repo, purchase_repo, etc.)
    services/        # Business logic (ocr_service, mapping_service)
    models.py        # SQLAlchemy models
    database.py      # DB engine + session
    migrate.py       # Table creation
  frontend/          # React + Vite SPA
    src/
      api/axios.js   # Axios instance (JWT interceptor, baseURL from VITE_API_URL)
      store/         # Zustand (authStore, projectStore)
      pages/         # 10 page components
      components/    # Layout, GlobalSearch, CreateProjectModal, ui/
    nginx.conf       # Proxies /api -> backend:8002 in production
    tailwind.config.js  # Custom theme (dark: #0B0E14 bg, #151921 surface, Poppins font)
```

## Testing
- Backend tests are standalone Python scripts in `backend/` (test_auth.py, test_db_crud.py, etc.)
- Test fixtures (receipt images) in `tests/fixtures/`
- No test runner configured — run scripts directly: `docker exec moneyflow-backend python3 test_auth.py`

## Frontend commands
```bash
npm run lint      # ESLint (js/jsx files, config in eslint.config.js)
npm run build     # Vite production build
```

## Important quirks
- **Wide-open CORS**: `allow_origins=["*"]` everywhere + explicit OPTIONS handler
- **Migrations run on every container start** in docker-compose `command`
- **Backend Dockerfile uses python:3.10-slim** with `tesseract-ocr` and `libgl1` installed
- **Frontend dev container** runs `npm install && npm run dev` (node_modules kept container-internal)
- **Production frontend** serves via Nginx on port 80, reverse-proxying `/api` to backend
- **VITE_API_URL** must be set to the API base URL (no `/api` suffix needed — axios adds it)
- **Soft participant removal**: `is_active = False` instead of delete; shown as "(removed)" in UI
- **Projects auto-delete** when last active participant leaves

## UI component library (`components/ui/`)
| Component | Usage |
|---|---|
| `CompactInput` | Dense input (label above in 10px, `py-1.5 rounded-lg`). Use for mobile forms. |
| `BottomSheet` | Slide-up panel with backdrop, swipe-to-dismiss, drag handle. For detail editing on mobile. |
| `CompactCard` | Thin card (`p-2.5 rounded-xl`). Alternative to `rounded-3xl p-6` cards. |
| `ChipSelect` | Tag/chip multi-select. Compact alternative to MultiSelect dropdown. |
| `FloatingInput` | Original floating-label input (bulkier, use sparingly on mobile). |
| `ModernSelect` / `CreatableSelect` / `TaxRateInput` / `MultiSelect` / `Switch` | Existing components. |

## Mobile density conventions
- **Prefer** `rounded-xl` over `rounded-3xl`, `p-2`/`p-3` over `p-4`/`p-5`/`p-6`, `gap-1.5`/`gap-2` over `gap-4`/`gap-6`
- **Use** `CompactInput` instead of `FloatingInput` for dense mobile forms
- **Use** `BottomSheet` for detail editing instead of inline expandable sections
- **Use** `CompactCard` instead of `rounded-3xl p-6` cards for list items
- **Use** `ChipSelect` instead of `MultiSelect` when space is tight
- **Use** `max-md:` responsive prefixes for mobile-only compact styles
- **Bottom sheets should be swipeable** between related items (e.g. items in a purchase)
- **Long-press** or dedicated "Reorder" button for drag-to-reorder (not always-visible drag handles)
- **Form fields**: label in `text-[10px] font-semibold uppercase tracking-wider text-secondary` above the field, not floating
- **Inputs**: `px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-sm`

## Existing instruction files
- `.clinerules` — UI development guidelines (mobile-first, design system compliance, visual verification)
- `memory-bank/` — Structured context: systemPatterns.md, techContext.md, activeContext.md, etc.
- `design_system.md` — Colors, typography, spacing, component spec (Poppins font, dark theme)
