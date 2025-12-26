#!/usr/bin/env bash

# Moneyflow Proxmox Installation Script
# This script creates an LXC container and sets up Moneyflow.

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper for logging
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check if running on Proxmox
if [ ! -f /usr/bin/pveversion ]; then
    error "This script must be run on a Proxmox VE host."
fi

echo -e "${GREEN}"
echo "  __  __                       __ _                 "
echo " |  \/  |                     / _| |                "
echo " | \  / | ___  _ __   ___ _ _| |_| | _____      __ "
echo " | |\/| |/ _ \| '_ \ / _ \ | |  _| |/ _ \ \ /\ / / "
echo " | |  | | (_) | | | |  __/ |_| | | | (_) \ V  V /  "
echo " |_|  |_|\___/|_| |_|\___|\__, |_| |_|\___/ \_/\_/   "
echo "                           __/ |                    "
echo "                          |___/                     "
echo -e "${NC}"
echo "Moneyflow Proxmox Installation Script"
echo "--------------------------------------"

# --- Configuration Gathering ---

# 1. Container ID
NEXT_ID=$(pvesh get /cluster/nextid)
read -p "Enter Container ID (Default: $NEXT_ID): " CT_ID
CT_ID=${CT_ID:-$NEXT_ID}

# 2. Hostname
read -p "Enter Hostname (Default: moneyflow): " CT_NAME
CT_NAME=${CT_NAME:-moneyflow}

# 3. Privileged or Unprivileged
read -p "Create unprivileged container? (y/n, Default: y): " UNPRIV
UNPRIV=${UNPRIV:-y}
if [ "$UNPRIV" == "y" ]; then
    UNPRIV_FLAG="--unprivileged 1"
    info "Using unprivileged container (nesting will be enabled for Docker)."
else
    UNPRIV_FLAG="--unprivileged 0"
    warn "Using privileged container."
fi

# 4. Resources
read -p "CPU Cores (Default: 2): " CORES
CORES=${CORES:-2}

read -p "RAM in MB (Default: 2048): " RAM
RAM=${RAM:-2048}

read -p "Storage Space in GB (Default: 16): " DISK
DISK=${DISK:-16}

# 5. Network
read -p "Network Bridge (Default: vmbr0): " BRIDGE
BRIDGE=${BRIDGE:-vmbr0}

read -p "Use DHCP? (y/n, Default: y): " USE_DHCP
USE_DHCP=${USE_DHCP:-y}

if [ "$USE_DHCP" == "y" ]; then
    IP_CONFIG="ip=dhcp"
else
    read -p "Enter Static IP with CIDR (e.g., 192.168.1.100/24): " STATIC_IP
    read -p "Enter Gateway (e.g., 192.168.1.1): " GATEWAY
    IP_CONFIG="ip=$STATIC_IP,gw=$GATEWAY"
fi

read -p "Enter DNS Server (Optional, e.g., 1.1.1.1): " DNS_SERVER
DNS_FLAG=""
if [ -n "$DNS_SERVER" ]; then
    DNS_FLAG="--nameserver $DNS_SERVER"
fi

read -p "Enter HTTP Proxy (Optional, e.g., http://proxy:3128): " PROXY
PROXY_FLAG=""
if [ -n "$PROXY" ]; then
    PROXY_FLAG="--http-proxy $PROXY"
fi

read -p "Enable IPv6? (y/n, Default: n): " USE_IPV6
USE_IPV6=${USE_IPV6:-n}
if [ "$USE_IPV6" == "y" ]; then
    IP_CONFIG="$IP_CONFIG,ip6=auto"
else
    IP_CONFIG="$IP_CONFIG,ip6=manual"
fi

# 6. Moneyflow Config
read -s -p "Set Moneyflow Admin Password: " ADMIN_PASS
echo ""
read -p "Enter Mistral API Key (Optional): " MISTRAL_KEY

# Generate random secret key
APP_SECRET_KEY=$(openssl rand -hex 32)

# --- Execution ---

# Get storage for template
STORAGE_LIST=$(pvesm status -content rootdir | awk 'NR>1 {print $1}')
read -p "Select storage for LXC (Available: $STORAGE_LIST, Default: local-lvm): " STORAGE
STORAGE=${STORAGE:-local-lvm}

# Template logic
TEMPLATE_STORAGE=$(pvesm status -content iso | awk 'NR>1 {print $1}' | head -n 1)
TEMPLATE_STORAGE=${TEMPLATE_STORAGE:-local}

info "Updating Proxmox template list..."
pveam update > /dev/null

# Get the latest Debian 12 standard template
TEMPLATE=$(pveam available | grep "debian-12-standard" | sort -r | head -n 1 | awk '{print $2}')

if [ -z "$TEMPLATE" ]; then
    error "Could not find a Debian 12 standard template in Proxmox available list."
fi

TEMPLATE_FILENAME=$(basename "$TEMPLATE")
TEMPLATE_PATH="$TEMPLATE_STORAGE:vztmpl/$TEMPLATE_FILENAME"

info "Checking for template $TEMPLATE_FILENAME in $TEMPLATE_STORAGE..."
if ! pveam list $TEMPLATE_STORAGE | grep -q "$TEMPLATE_FILENAME"; then
    info "Downloading template: $TEMPLATE"
    pveam download $TEMPLATE_STORAGE "$TEMPLATE"
fi
>>>>+++ REPLACE


info "Creating LXC container $CT_ID ($CT_NAME)..."
pct create $CT_ID "$TEMPLATE_PATH" \
    --hostname "$CT_NAME" \
    --cores "$CORES" \
    --memory "$RAM" \
    --net0 name=eth0,bridge="$BRIDGE",$IP_CONFIG \
    --rootfs "$STORAGE:$DISK" \
    --onboot 1 \
    --ostype debian \
    $UNPRIV_FLAG \
    $DNS_FLAG \
    $PROXY_FLAG \
    --features nesting=1 \
    --description "Moneyflow - Expense Tracker"

info "Starting container..."
pct start $CT_ID

# Wait for network
info "Waiting for network..."
sleep 5

# Setup inside container
info "Running setup inside container..."

# Create a setup script to run inside
cat <<EOF > /tmp/mf_setup.sh
#!/bin/bash
set -e
apt-get update
apt-get install -y curl git gnupg lsb-release

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Clone Moneyflow
cd /root
git clone https://github.com/derlars/MoneyFlow.git moneyflow
cd moneyflow

# Setup Environment
cat <<EOT > .env
SECRET_KEY=$APP_SECRET_KEY
MISTRAL_API_KEY=$MISTRAL_KEY
EOT

# Create admin user
# Note: We need to wait for containers to be up to run the script
docker compose up -d

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
until curl -s http://localhost:8002/ > /dev/null; do
  sleep 2
done

# Run create admin user script
docker exec moneyflow-backend python3 create_admin_user.py --username admin --password "$ADMIN_PASS" || true

# Setup MOTD (Message of the Day)
cat <<'MOTD' > /etc/motd

  __  __                       __ _                 
 |  \/  |                     / _| |                
 | \  / | ___  _ __   ___ _ _| |_| | _____      __ 
 | |\/| |/ _ \| '_ \ / _ \ | |  _| |/ _ \ \ /\ / / 
 | |  | | (_) | | | |  __/ |_| | | | (_) \ V  V /  
 |_|  |_|\___/|_| |_|\___|\__, |_| |_|\___/ \_/\_/   
                           __/ |                    
                          |___/                     

Welcome to Moneyflow LXC Container!
-----------------------------------
- Web Interface: http://\$(hostname -I | awk '{print \$1}')
- Application Directory: /root/moneyflow

Maintenance Commands:
- Reset Admin Password:
  cd /root/moneyflow && docker exec -it moneyflow-backend python3 create_admin_user.py --username admin --password NEW_PASSWORD
- Change Mistral API Key:
  Edit /root/moneyflow/.env and run: cd /root/moneyflow && docker compose up -d
- View Logs:
  cd /root/moneyflow && docker compose logs -f

MOTD

echo "Setup Complete!"
EOF

pct push $CT_ID /tmp/mf_setup.sh /root/mf_setup.sh
pct exec $CT_ID -- bash /root/mf_setup.sh

info "Installation finished!"
info "Moneyflow is running at: http://$STATIC_IP (or your DHCP assigned IP)"
info "Admin user: admin"
info "Admin pass: (as provided)"
