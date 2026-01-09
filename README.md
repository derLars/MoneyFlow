# 💸 Moneyflow

**Moneyflow** is a powerful, self-hosted web application designed to simplify receipt digitization, expense management, and collaborative cost-sharing. Using AI-driven analysis, Moneyflow transforms your paper receipts into structured, actionable financial data.

> [!IMPORTANT]
> **This application was purely developed using Agentic Coding.** Every line of code, from the backend architecture to the frontend interface, was generated and refined through autonomous AI software engineering.

---

## ✨ Key Features

*   **Project-Based Organization**: Group expenses into distinct projects (e.g., "Summer Trip 2025" or "Shared House") for perfect isolation.
*   **AI Receipt Scanning**: Multi-image upload with advanced Vision AI (Mistral/Pixtral) to automatically extract items, prices, and quantities.
*   **Collaborative Tracking**: Real-time group management. Add participants and split costs equally across specific items.
*   **Optimized Settlement**: Built-in greedy algorithm calculates the most efficient "money flow" to settle debts with the fewest possible transactions.
*   **Intelligent Mapping**: Learnable friendly-name mapping that translates cryptic receipt text into readable product names.
*   **Deep Analytics**: Visualize spending habits with interactive dashboards, scatter plots, and multi-level Sankey diagrams.
*   **Privacy-First & Self-Hosted**: Designed for private deployment (LXC/Docker) on Proxmox or standard Linux environments.

---

## 🛠️ Dependencies

*   **Docker & Docker Compose**: For containerized deployment.
*   **Mistral AI API Key**: Required for the Vision LLM receipt analysis.

---

## 🚀 Installation

### Option 1: Proxmox LXC (Recommended)
The easiest way to get Moneyflow running on Proxmox. This automated script creates a dedicated Debian-based LXC container and sets up the entire stack.

Run this command on your Proxmox host:
```bash
bash -c "$(wget -qLO - https://github.com/derlars/MoneyFlow/raw/main/moneyflow.sh)"
```

### Option 2: Docker Compose (Generic Linux)
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/derLars/MoneyFlow.git
    cd MoneyFlow
    ```
2.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    SECRET_KEY=your_random_secret_hex
    MISTRAL_API_KEY=your_mistral_key
    ```
3.  **Launch**:
    ```bash
    docker compose up -d --build
    ```
4.  **Initial Setup & Password Reset**:
    To securely create or reset the admin user:
    ```bash
    docker exec -it moneyflow-backend python3 create_admin_user.py
    ```

---

## 🖥️ Usage

Access the interface at: `http://<your-server-ip>`

*   **Default Admin**: `admin`
*   **Administrative APIs**: Administrators have access to **Admin Tools** for global management of all users, projects, and purchases.
*   **Database Migrations**: If upgrading, run:
    ```bash
    docker exec -it moneyflow-backend python3 migrate_v2.py
    docker exec -it moneyflow-backend python3 migrate_v3.py
    ```

---

## 👨‍💻 Tech Stack

- **Backend**: FastAPI (Python 3.10) with SQLAlchemy (PostgreSQL/SQLite)
- **Frontend**: React (Vite) + Tailwind CSS + Zustand
- **AI**: Mistral AI SDK (Pixtral Vision model)
- **Deployment**: Docker / Proxmox LXC

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Developed autonomously with ❤️ via Agentic Coding.*
