FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install nginx
RUN apk add --no-cache nginx

# Copy built application to nginx
RUN cp -r build/* /var/www/localhost/htdocs/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 