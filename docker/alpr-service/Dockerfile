FROM debian:bullseye-slim

# Install Python 3.9 and system dependencies
RUN apt-get update && apt-get install -y \
    python3.9 \
    python3.9-dev \
    python3-pip \
    gcc \
    g++ \
    cmake \
    git \
    wget \
    pkg-config \
    libopencv-dev \
    libtesseract-dev \
    tesseract-ocr \
    libleptonica-dev \
    liblog4cplus-dev \
    libcurl4-openssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set python3.9 as default python
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.9 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1

# Set working directory
WORKDIR /app

# Install OpenALPR with proper Tesseract and Leptonica detection
RUN git clone https://github.com/openalpr/openalpr.git /tmp/openalpr && \
    cd /tmp/openalpr/src && \
    mkdir build && cd build && \
    cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr \
          -DCMAKE_INSTALL_SYSCONFDIR:PATH=/etc \
          -DTesseract_INCLUDE_BASEAPI_DIR=/usr/include \
          -DTesseract_INCLUDE_CCSTRUCT_DIR=/usr/include/tesseract \
          -DTesseract_INCLUDE_CCMAIN_DIR=/usr/include/tesseract \
          -DTesseract_INCLUDE_CCUTIL_DIR=/usr/include/tesseract \
          -DLeptonica_LIB=/usr/lib/x86_64-linux-gnu/liblept.so \
          .. && \
    make -j2 && \
    make install && \
    ldconfig && \
    rm -rf /tmp/openalpr

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create image storage directory
RUN mkdir -p /var/alpr-system/images

# Run application
CMD ["python", "src/main.py"]
