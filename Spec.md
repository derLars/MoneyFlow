# MoneyFlow
## Comprehensive Project Specification

---

## 1. High-Level Objective

MoneyFlow is a full-stack, containerized web application for digitizing, managing, and
analyzing purchase receipts within the context of **Projects** (e.g., trips, events, shared
living). It enables personal and collaborative expense tracking, allowing users to scan
receipts via Vision AI, map cryptic product names to "friendly names," assign shared costs
among project participants, and automatically calculate optimized debt settlements. The
application is deployable in a private, self-hosted environment via Docker or LXC containers.

---

## 2. Core Concepts & Terminology

* **Project**: A top-level grouping entity that contains purchases, payments, and
  participants. All expenses and money flow are scoped to a specific project.
* **Purchase**: A single transaction record, which contains metadata (name, date, creator,
  payer) and a list of associated items.
* **Item**: An individual product or service within a purchase, having the properties:
  original name, friendly name, price, quantity, discount, tax rate, categories, and
  contributors.
* **User**: Any registered user of the application.
* **Creator**: The user who originally created a specific purchase or project.
* **Payer**: The user that made the initial payment for a purchase.
* **Contributor**: Any user assigned to pay an equal part of an item's cost.
* **Project Participant**: A user who is an active member of a project, with full management
  rights over that project's data.
* **Friendly Name**: A user-friendly, standardized name for a product (e.g., "Milk") mapped
  from a more cryptic name found on a receipt (e.g., "FRSHMLK 1.5%").
* **Extracted Name**: The name of an item as extracted from the receipt by Vision AI.
* **Payment**: A direct money transfer recorded between two users, optionally within a
  project, to settle debts.
* **Money Flow**: The algorithmic calculation of the most efficient settlement plan (minimum
  transactions) between project participants.
* **Category Mapping**: A learned association between a friendly name and a 3-level
  category hierarchy, enabling auto-categorization on future purchases.
* **Saved Filter**: A named analytics filter configuration (time frame, categories, project)
  persisted per user.

---

## 3. Environment

The application is deployable on a Linux server via Docker Compose (production) or LXC
containers on Proxmox. This is a self-hosted environment that can be exposed to the
internet. Only configured users have access. The website is accessible from any common
browser, on desktop or mobile devices.

---

## 4. User Roles

### 4.1 User

A standard account. Can:
* Create and manage projects, becoming an active participant with full rights over them.
* Create purchases within their active projects (manual entry or receipt scan).
* View, edit, and delete purchases within projects they actively participate in.
* Record direct payments to settle debts with other project participants.
* View analytics filtered to their active projects only.
* Manage their profile (username, password, tax settings, saved filters).

### 4.2 Administrator

A privileged account. Has all the capabilities of a standard User, plus:
* Full read/write access to ALL users, projects, purchases, and data in the system.
* Access to an admin tools page for user management, project oversight, and purchase
  supervision.
* Ability to add, manage, and delete users (with password override).
* Ability to toggle administrator rights on any user.
* Ability to view and delete any project or purchase.

---

## 5. Pages

### 5.1 Login Page

The primary objective is to provide a clean, secure gateway to the application. The design
is minimal to focus attention on the single task of logging in.

#### 5.1.1 Visual Layout & Design

The application uses a dark theme throughout.

* **Background**: Dark (#0B0E14).
* **Login Card**: Centered card on surface color (#151921) with rounded corners
  (`rounded-3xl`, 24px). Maximum width of 400px on desktop.
* **Header**: The application logo at the top; a heading "Log in to your account".
* **Form Fields**:
  * Username Input: Text field with floating label "Username".
  * Password Input: Password field with floating label "Password" and a visibility
    toggle icon.
* **Action Button**: "Log In" button in primary blue (#3B82F6), full width, white bold text.
* **Typography**: Poppins font family, weights 400/500/600/700.

#### 5.1.2 Responsiveness (Mobile View)

* The card expands to full screen width with minimal horizontal padding.
* Font sizes adjusted for optimal legibility on smaller screens.
* Buttons and inputs meet mobile accessibility tap target guidelines.

---

### 5.2 Main Page (Home)

The Main Page serves as the primary launchpad after login. It provides a quick overview of
the user's active projects, monthly spending summary, and global search.

#### 5.2.1 Visual Layout & Design

* **Persistent Header**: Sticky top bar with:
  * Centered "Moneyflow" logo/title (links to home).
  * Hamburger menu icon (left on mobile, top-right on desktop) opening a sidebar
    overlay with navigation links: Home, Purchases, Analytics, Money Flow, Settings.
    Administrators additionally see "Admin Tools".
  * User avatar (initial letter) on the right.
* **Global Search**: A prominent search bar at the top that performs full-text search across
  projects, purchases, and items. Results display with type-coded icons (folder for
  projects, shopping bag for purchases, package for items). Clicking navigates to the
  relevant detail page.
* **Monthly KPI Card**: Shows the current month's personal spending summary.
* **Projects Grid**: Cards for each active project displaying:
  * Project image (with placeholder if none).
  * Project name and description.
  * Participant avatar chips (max 3 shown + overflow count).
  * Creation date.
  * Empty state with CTA to create the first project.
* **Create Project Modal**: Triggered by "New Project" button. Form with image upload,
  project name, description, and multi-select participant picker.

#### 5.2.2 Responsiveness (Mobile View)

* Content organized into a single, scrollable column.
* Project cards expand to full width.
* Global search optimized for smaller viewport.

---

### 5.3 Scan Receipt Page

The objective is to provide a simple, step-by-step process for users to upload, prepare,
and submit their receipt images for automated data extraction via Vision AI.

#### 5.3.1 Visual Layout & Design

* **Header**: "Scan Your Receipt" heading.
* **Step 1 — Upload Area**: A large drag-and-drop zone with instructional text:
  "Drag & drop receipt images here, or click to browse". Accepts JPEG and PNG, up to
  5 images.
* **Step 2 — Image Staging & Preparation**: Once uploaded, images appear as thumbnails
  in a responsive grid. Each thumbnail features:
  * An 'X' icon to remove the image.
  * A "Crop & Rotate" button that opens an image editor modal (powered by
    `react-cropper`) with rotation slider (0-360 degrees, quick -90/+90 buttons) and
    zoom control.
* **Scan Button**: Below the grid, a primary "Scan Receipt" button (disabled until at
  least one image is present). On click, images are sent to the backend for Vision AI
  processing. On success, the user is redirected to the Purchase Editor pre-filled with
  extracted data.

---

### 5.4 Purchase Editor Page (Item Review & Editing)

This page serves as the central hub for managing the details of a single purchase. It has
two primary modes:
1. **Review Mode**: Entered after a receipt scan, pre-filled with AI-extracted data for
   verification and correction.
2. **Creation Mode**: Entered via "Create Manually", a blank canvas for building a purchase
   from scratch.

#### 5.4.1 Visual Layout & Design

The page uses a structured, three-section layout with a sticky bottom footer.

**Section 1: Purchase Metadata Card**
* Purchase Name: Text input for the purchase title.
* Purchase Date: Date picker, defaulting to the current date.
* Payer: Single-select dropdown of project participants. Defaults to the creator.
* Project: The project this purchase belongs to (auto-set when created from a project).
* Global Contributors: Multi-select dropdown with an "Apply to all items" button for bulk
  assignment.
* Tax/Discount Toggle Switches: Enable or disable tax rate and discount fields on all items.
* Receipt Images: If created from a scan, small clickable image previews.
* Summary: Real-time total price and per-contributor breakdown, calculated client-side.

**Section 2: Interactive Item List (Card View with Drag-and-Drop)**
* **List Controls**: "Add Item at Top" button plus inline "+" buttons between items on hover.
* **The Item Card** (powered by `@dnd-kit` for reordering):
  * **Drag Handle**: Six-dot grip icon on the left for reordering via mouse or touch.
  * **Top Row**: Editable friendly name input. Original extracted name shown below as
    non-editable text.
  * **Middle Rows**: Quantity, Price, Discount (if enabled), Tax Rate (if enabled).
  * **Category Row**: Three dependent `CreatableSelect` dropdowns (Category 1 → 2 → 3).
    Each allows selecting an existing category or typing a new one. Category 2 is only
    active if Category 1 is set; Category 3 only if Category 2 is set. Clearing a parent
    auto-clears children.
  * **Contributors Row**: Multi-select dropdown of project participants.
  * **Delete Action**: Trash icon in the top-right corner.
* **Visual Feedback**: Dragging a card lifts it with a subtle shadow for smooth repositioning.

**Section 3: Sticky Actions Footer**
* **Confirm Purchase**: Primary blue button to save all changes.
* **Delete Purchase**: Destructive red button (opens confirmation modal).
* **View Logs**: Secondary button that opens a modal with the purchase's audit log.
* Safe-area bottom padding for mobile browsers.

---

### 5.5 Purchase List Page (Archive)

A centralized, searchable, and sortable archive of all purchases across the user's active
projects.

#### 5.5.1 Visual Layout & Design

* **Filtering Controls**: Search bar (by purchase title, debounced 300ms) and sort dropdown
  (Newest, Oldest, Highest Price, Lowest Price).
* **Purchase Card Grid**: 3-column responsive grid. Each card shows:
  * Receipt icon.
  * Total cost (calculated from items, large bold display).
  * Purchase title.
  * Paperclip indicator for attached images.
  * Date and item count.
  * Payer name.
  * Clicking navigates to the Purchase Editor for that purchase.
* **Empty State**: Helpful message with link to scan or create a purchase.

#### 5.5.2 Responsiveness (Mobile View)

* Card grid collapses to a single vertical column.
* Filter and sort controls optimized for smaller viewports.

---

### 5.6 Project Details Page

The central hub for an individual project. Provides four tabs for managing all aspects of a
collaborative expense group.

#### 5.6.1 Visual Layout & Design

* **Hero Header**: Project image with gradient overlay, project name, description.
  Back navigation link and "Leave Project" button.
* **Tab Navigation**: Pill-style segmented control with four tabs:

**Purchases Tab**
* Quick-action buttons: "Scan Receipt" and "Add Manually".
* Search bar for filtering purchases within the project.
* Purchase card list with totals and links to the Purchase Editor.

**Money Flow Tab**
* Net balances grid: Shows who owes whom within the project.
* "Record Payment" button: Opens a modal to record a direct payment (sender, receiver,
  amount, date, note).
* Payment Tracker: History of all payments within the project with delete capability.

**Statistics Tab**
* Total project spending display.
* Per-user spending breakdown.

**Settings Tab**
* Edit project name, description, and image (inline form).
* Participants list: Add/remove participants.
* Delete project button (opens confirmation modal).

---

### 5.7 Analytics Page

Transforms raw purchase data into meaningful insights through interactive filtering and
data visualizations.

#### 5.7.1 Visual Layout & Design

* **Split Layout**: Collapsible filter sidebar (overlay on mobile, persistent on desktop) +
  main chart area.

**Filter Sidebar**
* **Project Filter**: Multi-select for scoping to specific projects.
* **Time Frame**: Segmented control (Period / Month / Year / All Time) with corresponding
  date picker. Defaults to current year.
* **Search Filters**: Text inputs for purchase title and item name.
* **Category Filters**: Three independent text inputs for Category 1, 2, and 3 (can select
  any level without parent).
* **Scope Toggle**: "My Share" (personal spending) vs "Total" (group spending).
* **Save/Load Filters**: Persist and recall named filter configurations per user.

**Main Chart Area**
* **KPI Cards**: Total Spending, Personal Spending, Number of Purchases, Average Cost.
* **View Type Selector**: Dropdown to choose visualization:
  * **Cumulative** (AreaChart): Running total of spending over time with gradient fill.
  * **Individual** (ScatterChart): Each purchase as a point; X = time, Y = cost.
    Hover reveals name, date, and exact cost.
  * **Flow** (Sankey diagram): Total amount flows through Category 1 → Category 2 →
    Category 3 → Items, showing spending distribution.

#### 5.7.2 Responsiveness (Mobile View)

* Two-column layout adapts to single column.
* Filter sidebar collapses behind a "Show Filters" button, sliding in as an overlay.
* Charts allow horizontal scrolling or pinch-to-zoom.

---

### 5.8 Money Flow Page

A global (cross-project) view of debts and payments between users.

#### 5.8.1 Visual Layout & Design

* **Net Balances Section**: Shows optimized settlement balances from the greedy
  money-flow algorithm, indicating who owes whom and how much.
* **Payment Tracker Section**: History of all direct payments. For payments where the
  current user is involved, a delete option is available.

---

### 5.9 Settings Page

Centralized location for managing profile information, security settings, and preferences.

#### 5.9.1 Visual Layout & Design

* **Account Section**: Display and update username. Changing username triggers re-login.
* **Tax Configuration Section**: Set default tax rate and manage common tax rates
  (add/remove pill-shaped tags).
* **Saved Filters Section**: List of saved analytics filters with delete capability.
* **Security Section**: Change Password form with three fields:
  * Current Password
  * New Password
  * Confirm New Password
  * Password visibility toggles on all fields.
  * Validation: 10-30 characters. Button disabled until all fields are filled and new
    passwords match.

#### 5.9.2 Responsiveness (Mobile View)

* Single column layout. Each settings section is a full-width card stacked vertically.

---

### 5.10 Admin Tools Page

Exclusively for administrators. Provides system-wide management of users, projects, and
purchases.

#### 5.10.1 Visual Layout & Design

* **3-Tab Interface**: Users, Projects, Purchases.

**Users Tab**
* Grid of user cards with Admin/Legacy badges.
* "Manage User" modal for each user:
  * Toggle administrator rights.
  * Override password.
  * Delete (or anonymize) user.
* "Add User" modal: Create new user with username and password.
* "Cleanup" button: Remove unreferenced deleted/dummy users.

**Projects Tab**
* Grid of all projects with View (navigate to project) and Delete buttons.

**Purchases Tab**
* List of all purchases with Edit (navigates to Purchase Editor in admin mode) and
  Delete buttons.
* Client-side search across current tab's dataset.

---

## 6. Workflows

### 6.1 Login

1. Non-authenticated user arrives at the login page.
2. Frontend provides username input, password input, and "Log In" button.
3. User enters credentials and clicks "Log In".
4. Frontend sends credentials to `POST /api/auth/token` (OAuth2 password flow).
5. Backend verifies credentials; returns JWT access token (30-minute expiry) on success
   or 401 on failure.
6. Frontend stores token in localStorage, fetches user profile from `GET /api/auth/me`,
   and redirects to the main page.

### 6.2 Logout

1. User clicks "Logout" in the navigation menu.
2. Frontend removes the JWT token from localStorage and resets application state.
3. Frontend redirects the user to the Login page.
   (Logout is client-side only; JWTs are stateless.)

### 6.3 Create a Purchase from a Receipt

1. User navigates to the Scan Receipt page.
2. User uploads up to 5 receipt images (JPEG/PNG).
3. User optionally crops and rotates each image using the image editor.
4. User clicks "Scan Receipt".
5. Frontend sends images as `multipart/form-data` to `POST /api/ocr/upload`.
6. Backend encodes images as base64 data URIs and sends them to the Mistral Pixtral
   Vision model for direct image-to-structured-data extraction.
7. Backend applies friendly name mapping logic to all extracted items.
8. Backend applies category mapping to auto-fill categories where possible.
9. Backend returns the structured item list with friendly names and categories.
10. Frontend navigates to the Purchase Editor pre-filled with extracted data, passing
    image blobs via React Router location state.
11. User verifies, corrects, and finalizes the purchase, then clicks "Confirm Purchase".
12. Frontend validates all fields, auto-creates any new category names, and sends the
    complete purchase payload to `POST /api/purchases`.
13. Backend stores the purchase, items, contributors, images, and logs in the database.
14. Backend applies the friendly name storing logic for future mapping improvements.

### 6.4 Manually Create a Purchase

1. User navigates to the Purchase Editor (from a project or directly).
2. User fills in purchase metadata (name, date, payer, project).
3. User adds items via the "Add Item" button.
4. For each item, user sets: name, quantity, price, optional tax/discount, categories,
   and contributors.
5. Category dropdowns follow hierarchical constraints (Cat 2 requires Cat 1, etc.) but
   support creating new categories inline.
6. Items can be reordered via drag-and-drop.
7. User clicks "Confirm Purchase".
8. Same validation and submission flow as Step 11-14 in Section 6.3.

### 6.5 Delete a Purchase

1. User opens a purchase in the Purchase Editor and clicks "Delete Purchase".
2. Frontend displays a confirmation modal.
3. On confirmation, frontend sends `DELETE /api/purchases/{purchase_id}`.
4. Backend verifies the user is an active participant in the purchase's project (or is an
   administrator).
5. Backend deletes the purchase and all associated items, contributors, images, and logs.
6. Frontend redirects to the main page or project page.

### 6.6 Project Lifecycle

1. User creates a project (name, description, optional image, participant list).
2. Creator is automatically added as an active participant.
3. All active participants have equal rights to manage the project: add/remove
   participants, edit project details, create/delete purchases and payments.
4. When a participant leaves a project, they are soft-removed (`is_active = False`).
   Their historical contributions are preserved but they can no longer see the project
   or its data.
5. When the last active participant leaves, the project is automatically deleted.

### 6.7 Money Flow Settlement

1. For a given project, the system calculates net balances by summing all purchases
   (who paid vs. who contributed) and all direct payments.
2. A greedy settlement algorithm optimizes the debt chain to minimize the number of
   transactions needed to fully settle all debts.
3. Users can view the optimized settlement plan and record direct payments to execute it.
4. The global Money Flow page aggregates settlement data across all of the user's
   active projects.

### 6.8 Administrator Rights

1. Administrator navigates to Admin Tools.
2. Selects a user and opens the "Manage User" modal.
3. Can toggle administrator rights (revoke or grant). The affected user's subsequent
   requests will reflect the new role immediately (JWT contains the username; the
   backend checks the `administrator` flag on each protected request).
4. Can override a user's password.
5. Can delete or anonymize a user (anonymization preserves historical data).

### 6.9 Display Analytics

1. User navigates to the Analytics page.
2. User applies filters in the sidebar (time frame, projects, categories, search terms).
3. User selects visualization type (Cumulative, Individual, Flow).
4. User toggles scope between "My Share" and "Total".
5. Frontend sends filter parameters to `GET /api/purchases/stats/analytics`.
6. Backend queries purchases across the user's active projects, applies filters,
   computes aggregations, and returns chart data + KPI summaries.
7. Frontend renders the selected chart and KPI cards.
8. User can save the current filter configuration for later recall.

---

## 7. Permissions & Access Control

* A standard **User** can view, edit, and delete purchases and payments in projects
  where they are an **active participant** (`is_active = True`).
* A standard User can only see projects they are actively participating in.
* Analytics, search, and purchase lists are scoped to the user's active projects.
* An **Administrator** bypasses these checks and has universal access to all users,
  projects, purchases, and payments. Admin actions on others' data are logged with the
  admin's identity.
* When a user leaves a project (soft-deactivated), they lose visibility of the project and
  all its data. Their historical contributions remain in the database for integrity but they
  are displayed as "(removed)" in the UI where applicable.

---

## 8. Contributors & Payment System

### 8.1 Contributor Assignment

* When assigning contributors to an item, the UI shows a dropdown of **active project
  participants** (not all registered users).
* Distribution is always equal among contributors (Section 10.1).
* A "Global Contributors" field on the purchase allows bulk-assigning contributors to
  all items.

### 8.2 Payment System

* Users can record direct payments between project participants to settle debts.
* Each payment has: sender, receiver, amount, date, and optional note.
* Payments are factored into the money flow settlement calculation.

---

## 9. Backend Processing & Logic

### 9.1 Friendly Name Mapping Logic

```
FUNCTION get_friendly_name(original_name, user_id):
    substrings = generate_all_substrings(original_name.lower())
    // "Milk Frsh Alpine" → [milk, frsh, alpine, milk frsh, milk frsh alpine, frsh alpine]

    // Step 1: Check user-specific mappings
    user_mappings = find_mappings_for(substrings, created_by=user_id)
    IF user_mappings is not empty:
        winner = find_most_common_friendly_name(user_mappings)
        IF winner is not a tie:
            RETURN winner

    // Step 2: Check global mappings
    global_mappings = find_mappings_for(substrings, created_by=ANY_USER)
    IF global_mappings is not empty:
        winner = find_most_common_friendly_name(global_mappings)
        IF winner is not a tie:
            RETURN winner

    // Step 3: Default to original
    RETURN original_name
```

### 9.2 Friendly Name Storing Logic

```
FUNCTION set_friendly_name(original_name, friendly_name, user_id):
    substrings = generate_all_substrings(original_name.lower())
    for each substring in substrings:
        insert_or_update_database(user_id, substring, friendly_name)
```

Typos and wrong extractions are not automatically corrected. Instead, they are
incorporated into the mapping for potential future partial matches. Mappings accumulate
over time; user-specific mappings take precedence over mappings from other users.

### 9.3 Receipt Extraction (Vision AI)

Receipt extraction uses the **Mistral Pixtral Vision model** for direct image-to-JSON
analysis. There is no intermediate OCR (Tesseract) or OpenCV preprocessing step in the
production pipeline.

1. User uploads up to 5 receipt images (JPEG/PNG).
2. Backend encodes each image as a base64 data URI.
3. Images are sent to the Mistral Pixtral-12B-2409 vision model with a system prompt
   instructing it to extract purchased items, quantities, and prices in structured JSON
   format.
4. The Vision AI returns a structured list of items with extracted names, quantities,
   and prices.
5. Extracted names are run through the friendly name mapping service to resolve
   human-readable names.
6. Resolved friendly names are run through the category mapping service to auto-fill
   any previously learned category assignments.
7. Results are returned to the frontend for user review in the Purchase Editor.

The Mistral API call is executed in a thread pool via FastAPI's `run_in_threadpool` to
avoid blocking the async event loop.

### 9.4 Category Mapping Service

Categories are learned per user. When a user assigns categories to an item in the
Purchase Editor, the mapping is stored:

```
category_mappings:
    mapping_id (PK), user_id (FK), friendly_name, category_level_1, category_level_2,
    category_level_3
```

On future purchases, when the same friendly name appears, the stored category mapping
is automatically applied. User-specific mappings take precedence; if none exist, mappings
from other users serve as a global fallback.

### 9.5 Money Flow Settlement Algorithm

The settlement engine is a **greedy algorithm** that:
1. Computes net balances for each project participant by netting all purchases (who paid
   vs. who contributed) and all direct payments.
2. Sorts participants by net balance (largest creditor first, largest debtor last).
3. Pairs the largest creditor with the largest debtor and settles the smaller of the two
   amounts.
4. Repeats until all balances are zero.
5. Returns the minimal set of suggested payments.

### 9.6 Repository Layer (Data Access)

Database access is encapsulated in repository modules:

**User Repository** (`repositories/user_repo.py`)
* `create_user(name, password, administrator=False, ...)` — Creates a new user.
* `get_user_by_name(name)` — Full user data by username.
* `get_user_by_id(user_id)` — Full user data by ID.
* `get_all_users()` — List of all registered users.
* `set_administrator_rights(user_id, is_admin)` — Grant/revoke admin.
* `update_user_password(user_id, new_password_hash)` — Change password.
* `update_user_name(user_id, new_name)` — Change username.
* `update_user_tax_settings(user_id, default_tax_rate, common_tax_rates)` — Tax prefs.
* `delete_user(user_id)` — Delete or anonymize (preserves history if user has dependencies).
* `cleanup_unreferenced_dummy_users()` — Remove orphaned dummy accounts.

**Purchase Repository** (`repositories/purchase_repo.py`)
* `create_purchase(...)` — Create with items, contributors, and images in one transaction.
* `get_purchase_by_id(purchase_id)` — Full purchase with all related data.
* `update_purchase(purchase_id, ...)` — Modify purchase metadata and items.
* `delete_purchase(purchase_id)` — Cascade-deletes items, contributors, images, logs.
* `get_recent_purchases(user_id, limit=5)` — Recent purchases across user's projects.
* `get_purchases_for_user(user_id, filters, sort_by)` — Filtered/sorted results.
* `get_analytics_data(user_id, time_frame, categories, project_ids, scope)` — Aggregated data.
* `create_receipt_image(purchase_id, file_path, filename)` — Link image to purchase.
* `create_purchase_log(purchase_id, user_id, message)` — Audit log entry.
* `get_logs_for_purchase(purchase_id)` — Retrieve all log entries.

**Project Repository** (`repositories/project_repo.py`)
* `create_project(name, description, creator_id, participant_ids, image_path)` — Create new project.
* `get_user_projects(user_id)` — Active projects for a user.
* `get_project_by_id(project_id)` — Full project with participants.
* `update_project(project_id, name, description, image_path)` — Edit project.
* `add_participant(project_id, user_id)` — Add active participant.
* `remove_participant(project_id, user_id)` — Soft-deactivate participant.
* `delete_project(project_id)` — Cascade-deletes project and all related data.
* `get_project_stats(project_id)` — Total and per-user spending.

**Payment Repository** (`repositories/payment_repo.py`)
* `create_payment(...)` — Record a direct payment.
* `get_payments_for_user(user_id, project_id)` — Filtered payment history.
* `delete_payment(payment_id)` — Remove a payment record.
* `get_money_flow_balances(project_id)` — Compute optimized settlement plan.

**Category Repository** (`repositories/category_repo.py`)
* `create_category(user_id, category_name, level)` — Register a new category.
* `get_all_categories()` — All distinct category names.
* `get_categories_by_user_and_level(user_id, level)` — Per-user, per-level lookup.

**Item Repository** (`repositories/item_repo.py`)
* `add_item_to_purchase(purchase_id, ...)` — Add item to a purchase.
* `update_item(item_id, ...)` — Modify item details.
* `delete_item(item_id)` — Remove item and its contributors.
* `add_contributor_to_item(item_id, user_id)` — Assign contributor.

---

## 10. Front-End Logic

### 10.1 Contribution Splitting

When multiple contributors are selected for an item, the distribution is always equal.
For an item costing 1.00 EUR:
* 3 Contributors: each pays 0.34 EUR (or 0.33/0.33/0.34 to match the total).
* 4 Contributors: each pays 0.25 EUR.
* 5 Contributors: each pays 0.20 EUR.

Costs are calculated client-side in the Purchase Editor and displayed per-contributor.

### 10.2 Category Assignment

At item creation, categories must be set in order (Category 1 → Category 2 → Category 3).
* Category 2 is disabled until Category 1 is set.
* Category 3 is disabled until Category 2 is set.
* Clearing Category 1 automatically clears Category 2 and 3.
* Categories can be selected from existing options or typed as new values inline
  (CreatableSelect component).
* A user can choose 0 to 3 categories per item but must respect the hierarchy.

When filtering in the Analytics page, categories are independently selectable (a Category 3
can be selected without a Category 2 or 1) for flexible drill-down.

### 10.3 State Management (Zustand)

**authStore** (`store/authStore.js`)
* `user` — Current user object from `/auth/me`.
* `token` — JWT from localStorage.
* `isAuthenticated` — Derived from token presence.
* Actions: `login(username, password)`, `logout()`, `checkAuth()`.

**projectStore** (`store/projectStore.js`)
* `projects` — List of user's active projects.
* `currentProject` — Currently viewed project detail.
* Actions: `fetchProjects()`, `fetchProjectDetails(projectId)`, `createProject(FormData)`,
  `deleteProject(projectId)`, `addParticipant()`, `removeParticipant()`, `updateProject()`.

### 10.4 API Client (`api/axios.js`)

* Base URL from `VITE_API_URL` environment variable or fallback to
  `http://{hostname}:8002/api`.
* Request interceptor auto-attaches `Authorization: Bearer {token}` header.
* Named export functions for `getCategoriesByLevel(level)` and `createCategory()`.

### 10.5 UI Component Library

Custom dark-themed components used throughout:

| Component | Purpose |
|-----------|---------|
| **FloatingInput** | Text/number/date input with animated floating label |
| **ModernSelect** | Styled `<select>` with chevron icon |
| **CreatableSelect** | Toggles between select dropdown and free-text input |
| **TaxRateInput** | Tax rate selector with predefined + custom options |
| **MultiSelect** | Multi-value checkbox dropdown |
| **Switch** | Accessible toggle switch with animated knob |
| **GlobalSearch** | Debounced full-text search with type-coded results |

### 10.6 Routing (React Router v7)

| Path | Page | Access |
|------|------|--------|
| `/login` | LoginPage | Public |
| `/` | MainPage (Home) | Authenticated |
| `/projects/:projectId` | ProjectDetailsPage | Authenticated, participant |
| `/scan` | ScanReceiptPage | Authenticated |
| `/purchases` | PurchaseList | Authenticated |
| `/create-purchase` | PurchaseEditor (new) | Authenticated |
| `/edit-purchase/:id` | PurchaseEditor (edit) | Authenticated, participant |
| `/dashboard` | AnalyticsPage | Authenticated |
| `/moneyflow` | MoneyFlowPage | Authenticated |
| `/settings` | SettingsPage | Authenticated |
| `/admin` | AdminTools | Administrator only |

---

## 11. Database Structure (PostgreSQL/SQLite)

### 11.1 Core Tables (from original specification)

**users**
* `user_id` (SERIAL PRIMARY KEY)
* `name` (VARCHAR(30), UNIQUE)
* `password_hash` (VARCHAR(255))
* `administrator` (BOOLEAN)
* `is_dummy` (BOOLEAN) — For anonymized/deleted users
* `default_tax_rate` (DECIMAL(5, 2))
* `common_tax_rates` (TEXT) — JSON-encoded list of frequently used rates

**purchases**
* `purchase_id` (SERIAL PRIMARY KEY)
* `project_id` (INTEGER, FOREIGN KEY to projects.project_id, nullable)
* `creator_user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `payer_user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `purchase_name` (VARCHAR(255))
* `purchase_date` (DATE)
* `tax_is_added` (BOOLEAN)
* `discount_is_applied` (BOOLEAN)
* `position` (INTEGER) — Ordinal position of this purchase in the project

**items**
* `item_id` (SERIAL PRIMARY KEY)
* `purchase_id` (INTEGER, FOREIGN KEY to purchases.purchase_id)
* `original_name` (TEXT)
* `friendly_name` (TEXT)
* `quantity` (INTEGER)
* `price` (DECIMAL(10, 2))
* `discount` (DECIMAL(10, 2))
* `tax_rate` (DECIMAL(5, 2))
* `category_level_1` (TEXT)
* `category_level_2` (TEXT)
* `category_level_3` (TEXT)
* `position` (INTEGER) — Ordinal position in the item list

**contributors**
* `contributor_id` (SERIAL PRIMARY KEY)
* `item_id` (INTEGER, FOREIGN KEY to items.item_id)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)

**categories**
* `category_id` (SERIAL PRIMARY KEY)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `category_name` (VARCHAR(30))
* `level` (INTEGER) — 1, 2, or 3

**purchase_logs**
* `log_id` (SERIAL PRIMARY KEY)
* `purchase_id` (INTEGER, FOREIGN KEY to purchases.purchase_id)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `timestamp` (TIMESTAMP)
* `log_message` (TEXT)

**friendly_names**
* `friendly_name_id` (SERIAL PRIMARY KEY)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `substring` (TEXT)
* `friendly_name` (TEXT)

**password_reset_tokens**
* `token_id` (SERIAL PRIMARY KEY)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id, ON DELETE CASCADE)
* `token_hash` (VARCHAR(255), UNIQUE, NOT NULL)
* `expires_at` (TIMESTAMP, NOT NULL)

### 11.2 Project & Collaboration Tables

**projects**
* `project_id` (SERIAL PRIMARY KEY)
* `name` (VARCHAR(255))
* `description` (TEXT)
* `image_path` (TEXT, nullable) — Path to project cover image
* `created_at` (TIMESTAMP)
* `created_by_user_id` (INTEGER, FOREIGN KEY to users.user_id)

**project_participants**
* `participant_id` (SERIAL PRIMARY KEY)
* `project_id` (INTEGER, FOREIGN KEY to projects.project_id)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `joined_at` (TIMESTAMP)
* `is_active` (BOOLEAN) — Soft-removal flag

**payments**
* `payment_id` (SERIAL PRIMARY KEY)
* `project_id` (INTEGER, FOREIGN KEY to projects.project_id, nullable)
* `creator_user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `payer_user_id` (INTEGER, FOREIGN KEY to users.user_id) — Sender
* `receiver_user_id` (INTEGER, FOREIGN KEY to users.user_id) — Receiver
* `amount` (DECIMAL(10, 2))
* `payment_date` (DATE)
* `note` (TEXT)

**receipt_images**
* `image_id` (SERIAL PRIMARY KEY)
* `purchase_id` (INTEGER, FOREIGN KEY to purchases.purchase_id)
* `file_path` (TEXT)
* `original_filename` (TEXT)
* `uploaded_at` (TIMESTAMP)

**category_mappings**
* `mapping_id` (SERIAL PRIMARY KEY)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `friendly_name` (TEXT, INDEXED)
* `category_level_1` (TEXT)
* `category_level_2` (TEXT)
* `category_level_3` (TEXT)

**saved_filters**
* `filter_id` (SERIAL PRIMARY KEY)
* `user_id` (INTEGER, FOREIGN KEY to users.user_id)
* `name` (VARCHAR(255))
* `configuration` (TEXT) — JSON-encoded filter parameters
* `created_at` (TIMESTAMP)

---

## 12. Technology Stack & Architecture

* **Architecture**: Containerized, API-driven SPA with RESTful backend.
* **Backend**: Python 3.10+ / FastAPI / SQLAlchemy ORM / PyYAML
  * Authentication: JWT (python-jose) + bcrypt (passlib)
  * Server: Uvicorn with proxy headers support
* **Frontend**: React 19 / Vite / Tailwind CSS / Zustand / React Router v7
  * Charts: Recharts (AreaChart, ScatterChart, Sankey)
  * Drag-and-Drop: @dnd-kit (core + sortable)
  * Image Editing: react-cropper (Cropper.js)
  * HTTP Client: Axios with auth interceptor
  * Icons: Lucide React
  * Typography: Poppins (Fontsource, weights 400/500/600/700)
* **AI / OCR**: Mistral AI SDK — Pixtral-12B-2409 Vision model for direct image-to-JSON
  receipt extraction
* **Database**: PostgreSQL 15 (production) or SQLite (development/fallback)
* **Containerization**: Docker & Docker Compose (dual-config: dev + prod)
* **Deployment**: Proxmox LXC (via `moneyflow.sh` installer) or generic Linux Docker host

---

## 13. Configuration & Deployment

### 13.1 Configuration File (`config.yaml`)

```yaml
# System Configuration
database:
  type: 'sqlite'                     # 'sqlite' or 'postgresql'
  path: './data/database.db'         # SQLite file path
  url: 'postgresql://user:password@db:5432/receiptdb'  # PostgreSQL connection

storage:
  max_upload_size_mb: 25
  local:
    image_path: './images'           # Local image storage directory

receipt_extract:
  threshold1: 100                    # (legacy; not used in Vision AI pipeline)
  threshold2: 200                    # (legacy; not used in Vision AI pipeline)
```

### 13.2 Environment Variables (`.env`)

```env
SECRET_KEY=<random_hex_secret>       # Required: JWT signing key
MISTRAL_API_KEY=<api_key>            # Required: Mistral AI API key
DATABASE_TYPE=postgresql             # Optional: overrides config.yaml
DATABASE_URL=<connection_string>     # Optional: overrides config.yaml
```

### 13.3 Deployment

**Development Mode** (`docker compose -f docker-compose.dev.yml up -d`)
* Backend: Source-mounted for hot-reload (uvicorn `--reload`), port 8002.
* Frontend: Vite dev server with HMR on port 5173.
* Database: PostgreSQL on port 5432 (exposed for debugging).

**Production Mode** (`docker compose up -d --build`)
* Backend: Baked image, port 8002.
* Frontend: Nginx serving built static files on port 80, proxying `/api` to backend.
* Database: PostgreSQL (internal only).

**Proxmox LXC** (`moneyflow.sh`)
* Automated script that creates a Debian-based LXC container, installs Docker,
  clones the repository, configures environment, and launches the production stack.

**CI/CD**: GitHub Actions workflow deploys to dev server on push to `main` via SSH +
Docker Compose rebuild.

---

## 14. Platform & Future-Proofing

* **Web First**: The primary application is a responsive web app accessible on desktop
  and mobile browsers.
* **Android and iOS App**: The application is designed so it can be embedded in a web view
  to be installed as an Android or iOS App without re-development.

---

## 15. Design System

The core philosophy is **"Clarity in Focus."** The application manages detailed financial
data, so the design must prioritize legibility, intuitive navigation, and efficiency. The
aesthetic is clean, modern, and data-centric, avoiding unnecessary clutter. The application
uses a **dark-only theme** to reduce eye strain during prolonged use.

### 15.1 Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#0B0E14` | Page background |
| **Surface** | `#151921` | Cards, modals, panels |
| **Primary** | `#3B82F6` | Primary buttons, active tabs, links, focus rings |
| **Secondary** | `#9CA3AF` | Muted text, secondary buttons |
| **Tertiary** | `#6B7280` | Borders, dividers |
| **Success** | `#22C55E` | Positive amounts, success confirmations |
| **Error** | `#EF4444` | Delete actions, negative amounts, validation errors |
| **Info** | `#60A5FA` | Informational elements |

### 15.2 Typography

* **Font Family**: Poppins (sans-serif), weights 400 (regular), 500 (medium), 600
  (semibold), 700 (bold).
* **Headings**: Semibold (600) to establish clear visual hierarchy.
  * Hero headings: 32px bold.
  * Section headers: 12px semibold uppercase with letter-spacing.
  * Value displays: 36px bold for key metrics.
* **Body Text**: Regular (400) at 14-16px.
* **Labels**: Medium (500) with floating label animation on inputs.

### 15.3 Layout and Structure

* **Cards**: Surface background (`#151921`), `rounded-3xl` (24px) border radius,
  24px internal padding.
* **Buttons**: `rounded-xl` (12px). Primary: solid blue background with white text.
  Destructive: solid red background. Minimum touch target: 44px.
* **Inputs**: `rounded-lg`, floating labels that shrink to top-left on focus or when filled.
  Blue focus ring.
* **Modals**: Fixed overlay (`bg-black/50 backdrop-blur-sm`) with centered surface card
  and fade-in/zoom-in animation.
* **Navigation**: Sticky top header with hamburger menu opening a sidebar overlay.
  Active tab highlighted with primary color.
* **Responsive**: Mobile-first. Cards stack vertically, grids collapse to single columns,
  sidebars become overlays. Safe-area bottom padding on sticky footers for mobile
  browsers.

### 15.4 Component Design

* **Buttons**:
  * Primary: Solid blue background, white text, full-width on mobile.
  * Secondary: Outline or subtle background.
  * Destructive: Solid red background for delete/irreversible actions.
* **Forms and Inputs**:
  * Floating labels animate from placeholder position to top on focus/filled state.
  * Select-or-type pattern (`CreatableSelect`, `TaxRateInput`): toggles between
    a `<select>` and a free-text `<input>`.
  * Validation errors: red text directly below the field.
* **Modals**:
  * Semi-transparent backdrop blur overlay.
  * Used for confirmations (delete), multi-field forms (create project, add payment),
    and detail views (image viewer, audit logs).
  * Always contain clear "Confirm" and "Cancel" actions.
* **Notifications**:
  * Inline success/error banners with colored backgrounds and icons, placed within
    the relevant page section.
* **Loading States**:
  * Skeleton placeholders (`animate-pulse`) for card grids.
  * `Loader2` spinning icon inside buttons during async operations.
* **Empty States**:
  * Dashed border cards with centered icon, message, and CTA button.
* **Tabs**:
  * Pill-style segmented controls with `bg-surface p-1` container and `bg-primary
    text-white` for active tab.

---

## Appendix A: API Endpoint Reference

All endpoints are mounted under `/api`.

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/token` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Current user profile |
| GET | `/auth/users` | Admin | List all users |
| POST | `/auth/users` | Admin | Create user |
| PATCH | `/auth/users/{id}/role` | Admin | Toggle admin rights |
| DELETE | `/auth/users/{id}` | Admin | Delete/anonymize user |
| POST | `/auth/users/cleanup` | Admin | Remove unreferenced users |
| POST | `/auth/users/{id}/password-override` | Admin | Set user's password |
| POST | `/auth/change-password` | Yes | Change own password |
| POST | `/auth/update-name` | Yes | Change own username |
| POST | `/auth/tax-settings` | Yes | Update tax preferences |

### Purchases (`/api/purchases`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/purchases` | Yes | List purchases (search, sort, filter) |
| POST | `/purchases` | Yes | Create purchase (multipart: JSON + images) |
| GET | `/purchases/recent` | Yes | Recent purchases |
| GET | `/purchases/summary` | Yes | Current month personal spending |
| GET | `/purchases/stats/analytics` | Yes | Full analytics data |
| GET | `/purchases/admin/all` | Admin | All purchases |
| GET | `/purchases/{id}` | Yes | Single purchase |
| PUT | `/purchases/{id}` | Yes | Update purchase |
| DELETE | `/purchases/{id}` | Yes | Delete purchase |
| GET | `/purchases/{id}/logs` | Yes | Purchase audit logs |
| POST | `/purchases/{id}/logs` | Yes | Add log entry |
| GET | `/purchases/users/all` | Yes | All users (for dropdowns) |

### Projects (`/api/projects`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects` | Yes | User's active projects |
| POST | `/projects` | Yes | Create project (multipart) |
| GET | `/projects/admin/all` | Admin | All projects |
| GET | `/projects/{id}` | Yes | Project detail + participants |
| PUT | `/projects/{id}` | Yes | Update project |
| DELETE | `/projects/{id}` | Admin | Delete project |
| POST | `/projects/{id}/participants` | Yes | Add participant |
| DELETE | `/projects/{id}/participants/{userId}` | Yes | Remove participant |
| GET | `/projects/{id}/moneyflow` | Yes | Settlement balances |
| GET | `/projects/{id}/stats` | Yes | Project spending stats |

### Payments (`/api/payments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments` | Yes | Create payment |
| GET | `/payments` | Yes | List payments |
| DELETE | `/payments/{id}` | Yes | Delete payment |
| GET | `/payments/balances` | Yes | Global settlement balances |

### OCR (`/api/ocr`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ocr/upload` | Yes | Upload receipt images for AI analysis (max 5) |

### Categories (`/api/categories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/categories` | Yes | Create category (deduplicates) |
| GET | `/categories` | Yes | All distinct category names |
| GET | `/categories/{level}` | Yes | Categories by level for user |

### Mapping (`/api/mapping`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/mapping/set` | Yes | Store original→friendly name mapping |
| POST | `/mapping/get` | Yes | Look up friendly name |

### Search (`/api/search`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=` | Yes | Full-text search across projects, purchases, items |

### Analytics (`/api/analytics`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/filters` | Yes | User's saved filters |
| POST | `/analytics/filters` | Yes | Create saved filter |
| DELETE | `/analytics/filters/{id}` | Yes | Delete saved filter |
