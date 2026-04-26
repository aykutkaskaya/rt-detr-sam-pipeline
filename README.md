# 🧠 RT-DETR+SAM Brain MRI Tumor Detection Pipeline

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![NVIDIA](https://img.shields.io/badge/NVIDIA-%2376B900.svg?style=for-the-badge&logo=nvidia&logoColor=white)](https://www.nvidia.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
---

## 🇺🇸 English Version

### Project Overview
The **RT-DETR+SAM Brain MRI Tumor Detection Pipeline** is an advanced medical imaging analysis platform designed for real-time anomaly detection and surgical-grade segmentation. It combines the speed of **RT-DETR** (Real-Time DEtection TRansformer) with the universal segmentation power of **Meta SAM (Segment Anything Model)** into a single, high-performance inference pipeline.

### ✨ Key Features
*   **🔍 Real-Time Detection:** Rapid identification of anomalies/tumors using the state-of-the-art RT-DETR model.
*   **🎭 Precision Segmentation:** Pixel-perfect, anatomically accurate masking via Meta SAM.
*   **🕹️ Interactive Mode:** Define specific regions manually using Point Prompting (Multi-point support).
*   **🖥️ GPU Optimized:** Full CUDA support with mixed precision (FP16/FP32) for stable and fast inference.
*   **📦 Medical Format Support:** Native support for standard images (JPG/PNG) as well as medical volumes (DICOM, NIfTI).
*   **🧪 Advanced Inspection Tools:** Integrated Slider (Comparison), Magnifier, and Interactive Crosshair tools.

### 🚀 Quick Start (Docker)
1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/aykutkaskaya/rt-detr-sam-pipeline.git
    cd rt-detr-sam-pipeline
    ```
2.  **Launch Containers:**
    ```bash
    docker-compose up --build -d
    ```
    *   **Backend API:** [http://localhost:8000](http://localhost:8000)
    
> [!TIP]
> **🍎 macOS & Non-NVIDIA Users:** The default Docker setup is optimized for NVIDIA/CUDA. If you are on macOS or a CPU-only system, change the base image in `backend/Dockerfile` to `python:3.10-slim` and comment out the `deploy` section in `docker-compose.yml`.

### 💻 Manual Installation
If you prefer not to use Docker, follow these steps:

#### 1. Backend Setup
*Requires Python 3.10 or higher*
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

---

## 🇹🇷 Türkçe Versiyon

### Proje Hakkında
**RT-DETR+SAM Brain MRI Tumor Detection Pipeline**, tıbbi görüntüleme (MRI, CT) analizleri için geliştirilmiş, gerçek zamanlı anomali tespiti ve cerrahi hassasiyette segmentasyon sunan ileri düzey bir yapay zeka platformudur. Sistem, **RT-DETR**'in hızını ve **Meta SAM (Segment Anything)** modelinin evrensel segmentasyon gücünü tek bir yüksek performanslı boru hattında birleştirir.

### ✨ Ana Özellikler
*   **🔍 Gerçek Zamanlı Tespit:** RT-DETR modeli ile saniyeler içinde anomali/tümör tespiti.
*   **🎭 Hassas Segmentasyon:** Meta SAM ile piksel seviyesinde, pürüzsüz ve anatomik olarak doğru maskeleme.
*   **🕹️ İnteraktif Mod:** Nokta atışı (Point Prompting) ile manuel segmentasyon ve çoklu bölge tanımlama.
*   **🖥️ GPU Optimizasyonu:** CUDA desteği ve Mixed Precision (FP16/FP32) ile yüksek performanslı çıkarım.
*   **📦 Tıbbi Format Desteği:** JPG/PNG taramalarının yanı sıra ham tıbbi veri (DICOM, NIfTI) desteği.
*   **🧪 Gelişmiş Araçlar:** Slider (Karşılaştırma), Magnifier (Büyüteç) ve İnteraktif Crosshair araçları.

### 🚀 Hızlı Başlangıç (Docker ile)
1.  **Repoyu Klonlayın:**
    ```bash
    git clone https://github.com/aykutkaskaya/rt-detr-sam-pipeline.git
    cd rt-detr-sam-pipeline
    ```
2.  **Konteynırları Başlatın:**
    ```bash
    docker-compose up --build -d
    ```
    *   **Backend API:** [http://localhost:8000](http://localhost:8000)

> [!TIP]
> **🍎 macOS ve NVIDIA Olmayan Sistemler:** Varsayılan Docker kurulumu NVIDIA/CUDA için optimize edilmiştir. Eğer macOS veya sadece CPU kullanan bir sistemdeyseniz, `backend/Dockerfile` içindeki temel imajı `python:3.10-slim` olarak değiştirin ve `docker-compose.yml` içindeki `deploy` bölümünü yorum satırına alın.

### 💻 Manuel Kurulum
Docker kullanmak istemiyorsanız aşağıdaki adımları takip edin:

#### 1. Backend Kurulumu
*Python 3.10 veya üzeri gereklidir*
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 2. Frontend Kurulumu
```bash
# Ana dizinde
npm install
npm run dev
```

---

## 🛠️ Technology Stack / Teknoloji Yığını

### Backend
*   **FastAPI**: Asynchronous high-performance API.
*   **PyTorch**: Model management and GPU acceleration.
*   **OpenCV**: Image processing and format conversion.
*   **RT-DETR & SAM**: Core AI models.

### Frontend
*   **React & TypeScript**: Modern UI architecture.
*   **Vite**: Next-generation frontend tooling.
*   **Tailwind CSS**: Premium responsive design.
*   **Lucide Icons**: Medical icon set.

---

## 👨‍💻 Author & Developer / Yazar ve Geliştirici

**AYKUT KAŞKAYA**
*   📧 **Email:** [aykut@kaskaya.com](mailto:aykut@kaskaya.com)
*   🌐 **Website:** [www.aykutkaskaya.com](https://www.aykutkaskaya.com)
*   🔗 **LinkedIn:** [Aykut KAŞKAYA](https://tr.linkedin.com/in/aykutkaskaya)

---

## 📄 License / Lisans
This project is developed for educational and research purposes. It should not be used as a standalone diagnostic tool for medical purposes.  
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
