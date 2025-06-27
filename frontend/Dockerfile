# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Add this ARG to accept the variable at build time
ARG REACT_APP_API_URL
# Add this ENV to set it for the build command
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application with additional flags for better error reporting
RUN npm run build || (echo "Build failed. Checking for errors..." && exit 1)

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 