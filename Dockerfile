# Multi-stage build: compile frontend, then serve with backend

# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + serve built frontend
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose ports
EXPOSE 3000 8000

# Start the backend (serves both API and static frontend)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
