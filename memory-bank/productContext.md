# Product Context: Moneyflow

## Why this project exists
Managing personal and shared expenses often involves manual data entry from physical receipts, which is tedious and error-prone. Moneyflow solves this by automating the extraction of data and providing a collaborative platform for tracking shared costs.

## Problems it Solves
- **Manual Data Entry**: Automates receipt reading using OCR and AI.
- **Cryptic Receipt Names**: Maps confusing abbreviations on receipts to human-readable "friendly names."
- **Shared Expenses**: Simplifies splitting item costs among multiple contributors and tracking who paid.
- **Data Fragmentation**: Centralizes all purchase history and provides visual insights into spending patterns.
- **Privacy Concerns**: Designed for self-hosting, ensuring users have full control over their financial data.

## How it Works
1. **Login**: Users access their account via a secure portal.
2. **Input**: Users upload images of receipts or create purchases manually.
3. **Processing**: If a receipt is uploaded, the system preprocesses the image, extracts text via OCR, and uses AI to identify items and prices.
4. **Refining**: Users verify extracted data, map items to friendly names, assign categories (3 levels), and select contributors.
5. **Storage**: Data is saved to a PostgreSQL/SQLite database; images are stored in a configurable storage layer (local or cloud).
6. **Analysis**: Users view their spending habits through interactive dashboards and detailed purchase archives.

## User Experience Goals
- **Clarity in Focus**: Minimalist design that prioritizes legibility and reduces cognitive load.
- **Responsiveness**: Seamless experience across desktop and mobile devices.
- **Efficiency**: Quick workflows for common tasks like scanning and confirming purchases.
- **Transparency**: Clear visual cues for cost distribution and activity logs.
