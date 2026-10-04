#!/usr/bin/env bash
set -e

# Cloudflare Tunnel Share Runner for PM Automation
# Exposes local Vite frontend (:5173) and proxied FastAPI backend (:8000)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ensure cloudflared is installed
if ! command -v cloudflared &>/dev/null; then
  echo "cloudflared not found in PATH. Checking ~/.local/bin/cloudflared..."
  if [ -x "$HOME/.local/bin/cloudflared" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    echo "Installing cloudflared binary to ~/.local/bin..."
    mkdir -p "$HOME/.local/bin"
    curl -fsSL -o "$HOME/.local/bin/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x "$HOME/.local/bin/cloudflared"
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

# Check if Vite frontend is running
if ! curl -s --connect-timeout 1 http://localhost:5173 >/dev/null 2>&1; then
  echo "--------------------------------------------------------"
  echo "⚠️  Frontend does not appear to be running on port 5173."
  echo "   Make sure './run.sh' is running in another terminal!"
  echo "--------------------------------------------------------"
  read -p "Would you like to start the full stack now with sharing? [Y/n] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    exec ./run.sh --share
  else
    echo "Exiting. Please start the app with './run.sh' first."
    exit 1
  fi
fi

echo "=========================================================="
echo " 🌐 Starting Cloudflare Quick Tunnel for PM Automation"
echo "    Local Target: http://localhost:5173"
echo "    (Vite automatically proxies backend API requests)"
echo "=========================================================="
echo ""
echo "Starting tunnel... look for the *.trycloudflare.com link below:"
echo "----------------------------------------------------------"

exec cloudflared tunnel --url http://localhost:5173
