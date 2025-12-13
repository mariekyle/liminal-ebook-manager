FROM python:3.11-slim

WORKDIR /app

# Install git and docker CLI
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && curl -fsSL https://get.docker.com | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy webhook code
COPY main.py .
COPY deploy-internal.sh .
RUN chmod +x deploy-internal.sh

EXPOSE 9000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
