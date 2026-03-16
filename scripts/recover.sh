#!/bin/bash

# LFG Places Production Recovery Script
# This script restores the application after a server reboot or crash.

set -e # Exit on error

echo "--- Starting Production Recovery ---"

# 1. Setup Environment
echo "Setting up environment..."
export PATH=$PATH:/opt/bitnami/node/bin
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    echo "NVM loaded."
fi

# 2. Cleanup rogue files
if [ -f "/home/bitnami/package-lock.json" ]; then
    echo "Removing rogue lockfile in home directory..."
    rm /home/bitnami/package-lock.json
fi

# 3. Project Directory
cd "$(dirname "$0")/.."
echo "Working directory: $(pwd)"

# 4. Resource Check
echo "Checking available memory..."
free -m
if [ $(free -m | grep Swap: | awk '{print $2}') -eq 0 ]; then
    echo "--------------------------------------------------------"
    echo "WARNING: NO SWAP MEMORY DETECTED!"
    echo "Next.js builds require significant RAM. If the build hangs,"
    echo "you likely need to enable swap. Run this to add 1GB swap:"
    echo "  sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    echo "--------------------------------------------------------"
fi

# 5. Install & Build
echo "Ensuring fresh build..."
# Limit memory to prevent OOM on small instances. 
# 450MB is safe for a 1GB instance with other processes running.
NODE_OPTIONS='--max-old-space-size=450' npm run build

# 5. Process Management (PM2)
echo "Restarting application via PM2..."
if pm2 list | grep -q "lfg-places"; then
    pm2 restart lfg-places
else
    pm2 start npm --name "lfg-places" -- start
fi
pm2 save

# 6. Web Server (Apache)
echo "Restarting Apache proxy..."
if [ -f "/opt/bitnami/ctlscript.sh" ]; then
    sudo /opt/bitnami/ctlscript.sh restart apache
else
    sudo systemctl restart bitnami.apache || echo "Warning: Could not restart Apache"
fi

# 7. Health Check
echo "--- Verification ---"
pm2 status lfg-places
echo "Testing localhost:3000..."
curl -I http://localhost:3000 || echo "Error: Application not responding on 3000"

echo "--- Recovery Complete! ---"
echo "If you still see 'Service Unavailable', check pm2 logs: pm2 logs lfg-places"
