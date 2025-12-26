# 💸 Moneyflow

**Moneyflow** is a powerful, self-hosted web application designed to simplify receipt digitization, expense management, and collaborative cost-sharing. Using AI-driven analysis, Moneyflow transforms your paper receipts into structured, actionable financial data.

---

## ✨ Key Features

*   **Smart Receipt Digitization**: Upload images and let AI extract items, prices, and quantities automatically.
*   **Collaborative Tracking**: Easily split costs among multiple contributors and track who paid for what.
*   **Deep Analytics**: Visualize your spending habits with interactive dashboards, scatter plots, and Sankey diagrams for category flows.
*   **Privacy-First & Self-Hosted**: Designed for private deployment (LXC/Docker), ensuring your financial data stays under your control.

---

## 🛠️ Dependencies

*   **Docker & Docker Compose**: For containerized deployment.
*   **Mistral AI API Key**: For advanced receipt analysis and item extraction.

---

## 🚀 Installation

### Option 1: Proxmox LXC (Recommended for PVE users)
The easiest way to get Moneyflow running on Proxmox. This automated script creates a dedicated Debian-based LXC container and sets up everything for you.

Run this command on your Proxmox host:
```bash
bash -c "$(wget -qLO - https://github.com/derlars/MoneyFlow/raw/main/moneyflow.sh)"
```

### Option 2: Docker Compose (Generic Linux/Any OS)
If you prefer running Moneyflow as a standard Docker stack:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/derlars/MoneyFlow.git
    cd MoneyFlow
    ```
2.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    SECRET_KEY=your_random_secret_hex
    MISTRAL_API_KEY=your_mistral_key
    ```
    *(Note: `SECRET_KEY` is required for secure authentication. You can generate one using `openssl rand -hex 32`)*.

3.  **Launch**:
    ```bash
    docker compose up -d --build
    ```
4.  **Create Admin User**:
    ```bash
    docker exec -it moneyflow-backend python3 create_admin_user.py --username admin --password yourpassword
    ```

---

## 🖥️ Usage

Once installed, access the web interface at:
`http://<your-server-ip>`

*   **Default Admin**: `admin` / (password you set during installation)
*   **Network Ports**: The application is served on port **80** (mapped to 8080 inside the container for compatibility with unprivileged environments). The backend API runs on port **8002**.

---

## 👨‍💻 Development

Contributions are welcome!
- **Backend**: FastAPI (Python 3.10)
- **Frontend**: React (Vite + Tailwind CSS)
- **Database**: PostgreSQL (Production) / SQLite (Dev)

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Made with ❤️ for better expense tracking.*
