# Development Setup Guide

## Overview

Moneyflow supports two Docker configurations:
- **Development Mode** (`docker-compose.dev.yml`) - Hot-reload, instant code changes
- **Production Mode** (`docker-compose.yml`) - Baked images, immutable deployments

## Development Mode (Recommended for Active Development)

### Features
✅ **Source code mounted as volumes** - Changes reflect instantly  
✅ **Hot-reload enabled** - Backend (uvicorn --reload) & Frontend (Vite)  
✅ **No rebuild needed** - Just save your file and refresh browser  
✅ **Faster iteration** - Fix bugs and test immediately  

### Quick Start

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker compose -f docker-compose.dev.yml down
```

### Access Points
- **Frontend**: http://localhost:5173 (Vite dev server with HMR)
- **Backend API**: http://localhost:8002
- **Database**: localhost:5432 (for debugging tools)

### Making Changes

**Backend Changes:**
1. Edit any Python file in `backend/`
2. Save the file
3. Uvicorn automatically reloads
4. API is updated instantly ✨

**Frontend Changes:**
1. Edit any file in `frontend/src/`
2. Save the file  
3. Vite Hot Module Replacement updates browser
4. See changes without refresh ✨

**Configuration Changes:**
- `config.yaml` changes: Restart backend container
- `package.json` changes: Rebuild frontend container

### Troubleshooting

**Changes not appearing?**
```bash
# Restart specific service
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml restart frontend

# Or rebuild if dependencies changed
docker compose -f docker-compose.dev.yml up -d --build
```

**Port conflicts?**
```bash
# Check what's using ports
sudo lsof -i :5173  # Frontend dev server
sudo lsof -i :8002  # Backend API
sudo lsof -i :5432  # PostgreSQL
```

---

## Production Mode

### Features
✅ **Immutable deployments** - Same image everywhere  
✅ **Optimized builds** - Minified frontend, compiled code  
✅ **No host dependencies** - Everything in containers  
✅ **Production ready** - Designed for LXC deployment  

### Quick Start

```bash
# Build and start production environment
docker compose up -d --build

# View logs
docker compose logs -f

# Stop production environment
docker compose down
```

### Access Points
- **Application**: http://localhost (port 80)
- **Backend API**: http://localhost:8002

### Making Changes

**Requires rebuild for any code changes:**
```bash
# After editing code
docker compose up -d --build backend  # Backend changes
docker compose up -d --build frontend # Frontend changes
docker compose up -d --build          # All changes
```

---

## Comparison

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| **Code Changes** | Instant (hot-reload) | Requires rebuild |
| **Startup Time** | Fast | Slower (build step) |
| **Frontend** | Vite dev server (5173) | Nginx (80) |
| **Backend** | uvicorn --reload | uvicorn |
| **Source Mounting** | Yes (volumes) | No (baked in) |
| **Best For** | Active development | Deployment, testing final build |

---

## Switching Between Modes

```bash
# Stop current mode
docker compose down  # or docker compose -f docker-compose.dev.yml down

# Start other mode
docker compose up -d                          # Production
docker compose -f docker-compose.dev.yml up -d # Development
```

**Note:** Both modes share the same database volume, so your data persists across mode switches.

---

## Tips for Efficient Development

### Use Development Mode for:
- Fixing bugs
- Adding new features
- Testing changes quickly
- Rapid iteration

### Use Production Mode for:
- Final testing before deployment
- Verifying build process
- Testing production optimizations
- Creating deployment images

### Best Practice Workflow:
1. **Develop** in dev mode (instant feedback)
2. **Test** occasionally in production mode (verify build)
3. **Deploy** using production docker-compose.yml

---

## Common Commands Cheat Sheet

```bash
# DEVELOPMENT MODE
docker compose -f docker-compose.dev.yml up -d           # Start
docker compose -f docker-compose.dev.yml down            # Stop
docker compose -f docker-compose.dev.yml logs -f backend # Follow backend logs
docker compose -f docker-compose.dev.yml restart backend # Restart backend only

# PRODUCTION MODE  
docker compose up -d --build                    # Build and start
docker compose down                             # Stop
docker compose logs -f                          # Follow all logs
docker compose up -d --build --no-cache backend # Force rebuild backend

# BOTH MODES
docker ps                        # List running containers
docker logs moneyflow-backend    # View backend logs
docker exec -it moneyflow-backend bash  # Shell into backend
```

---

## Environment Variables

Create a `.env` file in the project root:
```env
MISTRAL_API_KEY=your_api_key_here
```

This file is used by both development and production modes.

---

## Next Steps

1. **Start development mode:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Open your browser** to http://localhost:5173

3. **Make changes** to code and see them instantly!

4. **When ready for deployment**, switch to production mode and test the final build.

Happy coding! 🚀
