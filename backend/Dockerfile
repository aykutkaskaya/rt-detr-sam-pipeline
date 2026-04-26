FROM python:3.10-slim
# Using slim image for multi-platform support (AMD64/ARM64)

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV YOLO_CONFIG_DIR /tmp/ultralytics_config

# Install system dependencies for OpenCV and Medical imaging
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install requirements
# Note: torch will install the appropriate version for the architecture
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
