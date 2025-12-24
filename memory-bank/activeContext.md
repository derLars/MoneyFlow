# Active Context: Moneyflow

## Current Status
We have completed the initial requirement analysis and established the development strategy based on `Spec.pdf`, `Roadmap.pdf`, and `Verification.pdf`. The project is now moving into Phase 1: Project Initialization & Infrastructure.

## Current Focus
- **Phase 7: Deployment & Dockerization**
- Finalizing the containerization strategy for easy self-hosting.

## Recent Decisions
- **Port Change**: Backend now runs on port `8002` to avoid conflicts.
- **OCR Thresholds**: Set to `t1=125` and `t2=400` for better accuracy with current receipts.
- **Debug Trace**: Filtered OCR images are saved to `tests/outputs/filtered.png` during development.
- **Development Strategy**: "Vertical Slices with a Strong Foundation."
- **Verification Rule**: "The Golden Rule" - Every task must be verified with tests/curl/server checks before proceeding.
- **Project Structure**: Root containing `backend/`, `frontend/`, `deployment/`, and `config.yaml`.
- **UI Architecture**: Tailwind config will strictly follow the color palette from Section 15.1 of the spec.

## Next Steps
1. **Step 22: Dockerization** - Create Dockerfile and docker-compose.yml for the full stack.

## Recent Changes
- Renamed "Dashboard" to "Analytics" throughout the application for better clarity.
- Implemented a Sankey Diagram in the Analytics view to visualize spending flow across category levels down to individual items.
- Enhanced backend `/stats/analytics` endpoint to aggregate hierarchical data for Sankey visualization.

## Active Considerations
- **V&V Gates**: Each step has specific validation prompts that must be followed.
- **Friendly Name Logic**: Complex substring mapping needs careful implementation in `mapping_service.py`.
- **Mistral AI**: Integration requires robust error handling as per the V&V guide.
- **Admin Access**: Role-based access control (RBAC) needs to be strictly tested.
