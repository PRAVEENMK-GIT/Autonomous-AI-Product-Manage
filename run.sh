#!/usr/bin/env bash
set -e

# PM Automation Unified Runner
# Starts FastAPI backend (port 8000) and Vite frontend (port 5173)
# Optional flag: --share (creates public Cloudflare Tunnel)

SHARE_MODE=false
for arg in "$@"; do
  if [ "$arg" == "--share" ] || [ "$arg" == "-s" ]; then
    SHARE_MODE=true
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ -d "$HOME/.local/bin" ]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

TUNNEL_LOG=""
cleanup() {
  echo ""
  echo "Shutting down servers and tunnels..."
  if [ -n "$TUNNEL_LOG" ] && [ -f "$TUNNEL_LOG" ]; then
    rm -f "$TUNNEL_LOG"
  fi
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "=================================================="
echo " Starting Autonomous AI Product Manager (MVP)"
if [ "$SHARE_MODE" = true ]; then
  echo " Mode: Local + Cloudflare Public Sharing"
else
  echo " Mode: Local Only (Use --share to expose publicly)"
fi
echo "=================================================="

# Check and activate Python virtual environment
if [ ! -d ".venv" ]; then
  echo "Virtual environment not found. Setting up .venv..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

# Start FastAPI backend
echo "Starting FastAPI Backend on http://localhost:8000 ..."
python -m uvicorn app.main:app --port 8000 --reload &

# Allow backend 1.5s to start
sleep 1.5

# Check Node modules
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start Vite frontend
echo "Starting Vite Frontend on http://localhost:5173 ..."
cd frontend
npm run dev &
cd ..

PUBLIC_URL=""
if [ "$SHARE_MODE" = true ]; then
  if ! command -v cloudflared &>/dev/null; then
    echo "cloudflared not found. Downloading..."
    mkdir -p "$HOME/.local/bin"
    curl -fsSL -o "$HOME/.local/bin/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x "$HOME/.local/bin/cloudflared"
  fi

  echo "Starting Cloudflare Tunnel for port 5173..."
  TUNNEL_LOG=$(mktemp)
  cloudflared tunnel --url http://localhost:5173 >/dev/null 2> "$TUNNEL_LOG" &

  # Wait up to 10 seconds for Cloudflare tunnel URL to be provisioned
  for i in {1..20}; do
    PUBLIC_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)
    if [ -n "$PUBLIC_URL" ]; then
      break
    fi
    sleep 0.5
  done
fi

echo ""
echo "=================================================="
echo " App Ready!"
echo "   Frontend Web UI:   http://localhost:5173"
echo "   API Docs:          http://localhost:8000/docs"
echo "   Health Check:      http://localhost:8000/health"
if [ -n "$PUBLIC_URL" ]; then
  echo ""
  echo " 🌐 PUBLIC CLOUDFLARE SHARE LINK:"
  echo "   $PUBLIC_URL"
  echo "   (Share this link with your external viewers)"
elif [ "$SHARE_MODE" = true ]; then
  echo ""
  echo " ⚠️  Cloudflare tunnel started. Check logs for link or run ./share.sh"
fi
echo ""
echo " Press [Ctrl+C] to stop all services."
echo "=================================================="

wait

