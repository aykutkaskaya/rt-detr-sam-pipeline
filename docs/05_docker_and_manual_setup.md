# Deployment and Setup Guide

This document explains how to set up and run the **RT-DETR+SAM Pipeline** using either Docker or manual installation.

## 1. Prerequisites
- **For Docker:** Docker and Docker Compose installed.
- **For Manual:** 
  - Python 3.10+
  - Node.js 20+
  - NVIDIA GPU with CUDA (optional, but highly recommended for SAM)

---

## 2. Option A: Using Docker (Recommended)
This is the fastest way to get the system running with all dependencies pre-configured.

### Step 1: Clone and Build
Navigate to the project root and run:
```bash
docker-compose up --build
```

### Step 2: Automatic Weights Download
Upon the first startup, the backend container will detect missing weights. It will prompt you in the terminal (via `docker logs -f rtdetr-sam-backend`) to confirm the download from Hugging Face. Once confirmed, it will download the ~2.6 GB of weights and start the API.

### Step 3: Access the App
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 3. Option B: Manual Installation

### Step 1: Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python main.py
   ```
   *(The system will prompt to download weights if they are missing from the `models/` folder.)*

### Step 2: Frontend Setup
1. Navigate to the project root:
   ```bash
   cd ..
   ```
2. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
3. Access the app at [http://localhost:3000](http://localhost:3000).

---

## 4. Hardware Acceleration
By default, the application will attempt to use **CUDA** if an NVIDIA GPU and drivers are detected inside the environment. 
- In Docker, you may need to install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) and add `deploy: resources: reservations: devices: - driver: nvidia` to the `docker-compose.yml` if you wish to use GPU acceleration inside the container.
- If no GPU is found, the system will gracefully fall back to **CPU inference** (significantly slower for SAM).
