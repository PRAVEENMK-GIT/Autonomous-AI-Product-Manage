# Free Tier Deployment Guide

This guide explains how to deploy the **Autonomous AI Product Manager (PM Automation)** completely free of charge ($0/mo), with no credit card required for standard free tiers.

---

## 🏗️ Architecture & Free Tier Blueprint

```text
┌────────────────────────────────┐         ┌────────────────────────────────┐
│   Frontend (React + Vite)      │  Fetch  │    Backend (FastAPI)           │
│   Hosted on: Vercel / Netlify  ├────────►│    Hosted on: Render / Koyeb   │
│   Cost: $0/month (Free Edge)   │  CORS   │    Cost: $0/month (Free Tier)  │
└────────────────────────────────┘         └───────────────┬────────────────┘
                                                           │
                                        ┌──────────────────┴─────────────────┐
                                        │                                    │
                                 ┌──────▼──────┐                     ┌───────▼──────┐
                                 │ MongoDB M0  │                     │ NVIDIA NIM / │
                                 │ Atlas Free  │                     │ Stub Mode    │
                                 │ (512MB)     │                     │ ($0 Free)    │
                                 └─────────────┘                     └──────────────┘
```

| Component | Recommended Service | Free Tier Limits | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** or **Cloudflare Pages** | Unlimited static hosting, 100GB bandwidth/mo, SSL included | **$0** |
| **Backend** | **Render** (Web Service) | 750 free instance hours/month (spins down after 15 min idle) | **$0** |
| **Database** | **MongoDB Atlas** (M0 Cluster) | 512 MB storage, shared RAM, no credit card required | **$0** |
| **LLM Provider** | **NVIDIA NIM** or **Groq** | Free developer credits / free daily token tiers (or Stub Mode) | **$0** |

---

## 🚀 Step 1: Setup Free Database (MongoDB Atlas)

> *Note: If you skip this step, the app automatically falls back to in-memory `mongomock`! However, mongomock resets when the backend restarts.*

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create Deployment** → select **M0 (Free)**.
3. Choose any cloud provider (AWS/GCP) and the region closest to you.
4. Under **Security Quickstart**:
   - **Username & Password**: Create a database user (e.g. `pm_user` and a strong password). Save these!
   - **IP Access List**: Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so cloud servers like Render can connect.
5. Go to **Database** → click **Connect** → choose **Drivers** (Python).
6. Copy the connection string. It will look like:
   ```text
   mongodb+srv://pm_user:<password>@cluster0.abcde.mongodb.net/pm_automation?retryWrites=true&w=majority
   ```
   *(Remember to replace `<password>` with your real password!)*

---

## 🚀 Step 2: Deploy Backend to Render (Free Web Service)

1. Sign up or log in at [Render.com](https://render.com/).
2. Click **New +** → select **Web Service**.
3. Connect your GitHub repository: `PRAVEENMK-GIT/Autonomous-AI-Product-Manage`.
4. Configure the service settings:
   - **Name**: `pm-automation-backend`
   - **Region**: Choose the region closest to your MongoDB Atlas region (e.g., Oregon or Frankfurt).
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. Add the **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.12.0` | Python version |
   | `MONGO_URL` | `mongodb+srv://...` | MongoDB Atlas URI from Step 1 |
   | `NVIDIA_API_KEY` | `nvapi-...` | Your NVIDIA API key (or leave blank to use Stub mode) |
   | `NVIDIA_MODEL` | `meta/llama-3.3-70b-instruct` | LLM model name |
   | `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Base URL |
6. Click **Deploy Web Service**.
7. Once deployed, Render will provide a public URL like:
   `https://pm-automation-backend.onrender.com`
8. Verify it works by opening:
   `https://pm-automation-backend.onrender.com/health` (should return `{"status":"ok","mongo":true}`)
   `https://pm-automation-backend.onrender.com/docs` (interactive Swagger UI)

---

## 🚀 Step 3: Deploy Frontend to Vercel (Free Edge Hosting)

1. Sign up or log in at [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `PRAVEENMK-GIT/Autonomous-AI-Product-Manage`.
4. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://pm-automation-backend.onrender.com` *(your Render backend URL without trailing slash)* |
6. Click **Deploy**.
7. In ~30 seconds, Vercel gives you a global production URL:
   `https://pm-automation-xxxx.vercel.app`

---

## 🐳 Alternative: All-in-One Single Docker Service

If you prefer **one single URL** without separate frontend and backend hosting, you can use the multi-stage `Dockerfile` included in the root of this repo.

### On Render (Docker Web Service):
1. Create a **New Web Service** on Render.
2. Select your repository.
3. Choose **Docker** as the Environment.
4. Render automatically detects the `Dockerfile`, builds the React frontend, and starts FastAPI.
5. The frontend UI will be served directly at `/` and API at `/health`, `/documents`, etc.!

### On Hugging Face Spaces (100% Free Docker Container):
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** as the SDK.
3. Push or link this repository.
4. Set Repository Secrets (`MONGO_URL`, `NVIDIA_API_KEY`).
5. Hugging Face provides a 2-core CPU, 16GB RAM container completely free.

---

## ⚙️ How Free Tier Cold Starts Work (Keep-Alive Tip)

Free web services on Render spin down after **15 minutes** of inactivity to conserve resources:
- The first visit after inactivity takes **30–50 seconds** to wake up.
- To keep your backend warm 24/7 for demos, you can set up a free monitor at [UptimeRobot](https://uptimerobot.com/) or [Cron-job.org](https://cron-job.org/) that pings `https://your-backend.onrender.com/health` every **10 minutes**.

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created with network access `0.0.0.0/0`
- [ ] Backend `/health` returns `{"status":"ok","mongo":true}`
- [ ] Backend Swagger docs accessible at `/docs`
- [ ] Frontend connected to backend via `VITE_API_URL`
- [ ] "Load Sample Data" works in the Documents tab
- [ ] "Analyze" works (either using NVIDIA API or Stub mode toggle in UI)
