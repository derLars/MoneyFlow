# Active Context: Moneyflow

## Current Status
The project is now in a stable, feature-complete state. All development phases (1-7) from the `Roadmap.pdf` have been implemented and verified. The application is containerized and ready for both development and production deployment.

## Current Focus
- **Project Handover & Maintenance**
- Ready for official server launch and user onboarding.

## Recent Decisions
- **Personalized KPIs**: Home page now strictly shows individual monthly spending, accounting for cost-splitting.
- **Docker Automation**: Containers now automatically handle `npm install` and database migrations on startup.
- **Port Change**: Backend now runs on port `8002` to avoid conflicts.
- **OCR Thresholds**: Set to `t1=125` and `t2=400` for better accuracy with current receipts.
- **Debug Trace**: Filtered OCR images are saved to `tests/outputs/filtered.png` during development.
- **Development Strategy**: "Vertical Slices with a Strong Foundation."
- **Verification Rule**: "The Golden Rule" - Every task must be verified with tests/curl/server checks before proceeding.
- **Project Structure**: Root containing `backend/`, `frontend/`, `deployment/`, and `config.yaml`.
- **UI Architecture**: Tailwind config will strictly follow the color palette from Section 15.1 of the spec.

## Next Steps
1. **Official Server Launch**: Deploy via `docker compose up --build -d`.
2. **User Creation**: Generate initial admin accounts using `create_admin_user.py`.

## Recent Changes
- **Cropping & Rotation**: Reworked the image editor in `ScanReceiptPage` to use `react-cropper`. Now supports drawing a crop box, with rotation and zoom restricted to sliders only (no gestures).
- **Bug Fix (Purchase Saving)**: Fixed an issue where saving an existing purchase failed because `original_name` was missing from the item payload.
- **Archive Payer Display**: Updated the purchase archive to show usernames instead of IDs, with fallback for deleted accounts.
- **Item Reordering**: Added drag-and-drop item reordering in the Purchase Editor for mobile and desktop.
- **KPI Refinement**: Simplified the main page to focus on individual monthly spending.
- **Docker Production Finalization**: Configured optimized Nginx frontend and automatic backend migrations.

## Active Considerations
- **V&V Gates**: Each step has specific validation prompts that must be followed.
- **Friendly Name Logic**: Complex substring mapping needs careful implementation in `mapping_service.py`.
- **Mistral AI**: Integration requires robust error handling as per the V&V guide.
- **Admin Access**: Role-based access control (RBAC) needs to be strictly tested.
