# 🐳 Portainer Deployment Guide

## 📋 **Prerequisites**

1. **Git Repository**: Push your improved code to a Git repository (GitHub, GitLab, etc.)
2. **Portainer Access**: Ensure you have admin access to Portainer
3. **Network Access**: Your Beelink should be accessible from your development machine

## 🚀 **Step-by-Step Deployment**

### **Step 1: Prepare Your Git Repository**

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit with improvements"
   ```

2. **Create GitHub/GitLab Repository**:
   - Go to GitHub.com or GitLab.com
   - Create a new repository named `liminal-ebook-manager`
   - Make it public (for easier Portainer access)

3. **Push Your Code**:
   ```bash
   git remote add origin https://github.com/yourusername/liminal-ebook-manager.git
   git branch -M main
   git push -u origin main
   ```

### **Step 2: Portainer Setup**

#### **Option A: Using Portainer's Git Integration**

1. **Access Portainer**:
   - Open your browser and go to `http://your-beelink-ip:9000`
   - Login to Portainer

2. **Create New Stack**:
   - Click "Stacks" in the left sidebar
   - Click "Add stack"
   - Name: `ebook-manager`
   - Build method: Select "Repository"

3. **Repository Configuration**:
   - Repository URL: `https://github.com/yourusername/liminal-ebook-manager.git`
   - Repository reference: `main`
   - Repository authentication: Leave unchecked (for public repos)
   - Compose path: `docker-compose.yml`

4. **Environment Variables**:
   - Click "Environment variables"
   - Add the following variables:
   ```
   POSTGRES_PASSWORD=your_secure_password_here
   SECRET_KEY=your_super_secret_key_here_minimum_32_characters
   ALLOWED_ORIGINS=http://localhost:3000,http://your-beelink-ip:3000
   REACT_APP_API_URL=http://your-beelink-ip:8000
   UPLOAD_MAX_SIZE=100MB
   LOG_LEVEL=info
   ```

5. **Deploy Stack**:
   - Click "Deploy the stack"
   - Wait for all services to start (this may take 5-10 minutes on first build)

#### **Option B: Manual File Upload**

If Git integration doesn't work, you can manually upload files:

1. **Create Stack Manually**:
   - Click "Stacks" → "Add stack"
   - Name: `ebook-manager`
   - Build method: Select "Web editor"

2. **Copy Docker Compose**:
   - Copy the contents of the improved `docker-compose.yml`
   - Paste into the web editor

3. **Upload Files via Portainer**:
   - Go to "Containers" → Select your backend container
   - Click "Console" → "Connect"
   - Use the file upload feature to upload backend files

### **Step 3: Verify Deployment**

1. **Check Stack Status**:
   - Go to "Stacks" → "ebook-manager"
   - All services should show "Running" status

2. **Test Health Checks**:
   - Click on the backend container
   - Check logs for any errors
   - Visit `http://your-beelink-ip:8000/health`

3. **Access Application**:
   - Frontend: `http://your-beelink-ip:3000`
   - API Docs: `http://your-beelink-ip:8000/docs`
   - Health Check: `http://your-beelink-ip:8000/health`

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Build Failures**
```
Error: failed to build backend
```
**Solution**:
- Check that all backend files are in the repository
- Verify `backend/Dockerfile` exists
- Check `backend/requirements.txt` syntax

#### **2. Database Connection Issues**
```
Error: connection to database failed
```
**Solution**:
- Verify `POSTGRES_PASSWORD` environment variable is set
- Check that postgres container is running
- Wait for postgres health check to pass

#### **3. Frontend Build Issues**
```
Error: npm install failed
```
**Solution**:
- Check `frontend/package.json` syntax
- Verify all dependencies are available
- Increase build timeout in Portainer settings

#### **4. Volume Mount Issues**
```
Error: volume not found
```
**Solution**:
- Create volumes manually in Portainer:
  - Go to "Volumes" → "Add volume"
  - Create: `ebook-manager_postgres_data`
  - Create: `ebook-manager_ebook_storage`

## 📊 **Monitoring in Portainer**

### **Resource Monitoring**:
1. **Container Stats**:
   - Go to "Containers" → Select container → "Stats"
   - Monitor CPU, Memory, Network usage

2. **Logs**:
   - Go to "Containers" → Select container → "Logs"
   - Check for errors and warnings

3. **Health Status**:
   - Green = Healthy
   - Yellow = Starting/Unhealthy
   - Red = Failed

### **Backup Strategy**:
1. **Database Backup**:
   - Go to "Containers" → `ebook-postgres` → "Console"
   - Run: `pg_dump -U ebook_user ebooks > /tmp/backup.sql`
   - Download via Portainer file browser

2. **File Backup**:
   - Go to "Volumes" → `ebook-manager_ebook_storage`
   - Use Portainer's volume backup feature

## 🔄 **Update Process**

### **For Future Updates**:

1. **Update Code Locally**:
   ```bash
   # Make your changes in Cursor
   git add .
   git commit -m "Update description"
   git push origin main
   ```

2. **Update in Portainer**:
   - Go to "Stacks" → "ebook-manager"
   - Click "Editor"
   - Click "Pull and redeploy"
   - This will pull latest code and rebuild containers

### **Rollback Strategy**:
1. **Previous Version**:
   - Go to "Stacks" → "ebook-manager"
   - Click "Rollback" to previous deployment

2. **Manual Rollback**:
   - Edit stack to use previous Git commit
   - Redeploy with specific commit hash

## 🛡️ **Security Considerations**

### **Environment Variables**:
- Never commit `.env` files to Git
- Use Portainer's environment variable feature
- Rotate passwords regularly

### **Network Security**:
- Consider using Portainer's built-in SSL
- Restrict access to specific IP ranges
- Use strong passwords for all services

### **Backup Security**:
- Encrypt backup files
- Store backups off-site
- Test restore procedures regularly

## 📞 **Support Commands**

### **Useful Portainer Commands**:

1. **Check Container Logs**:
   - Container → Logs → "Follow logs"

2. **Execute Commands**:
   - Container → Console → "Connect"

3. **File Management**:
   - Container → Console → File browser

4. **Resource Usage**:
   - Container → Stats → Real-time monitoring

## 🎯 **Next Steps After Deployment**

1. **Test All Features**:
   - Upload an EPUB file
   - Search for books
   - Edit book metadata
   - Download books

2. **Performance Monitoring**:
   - Monitor resource usage
   - Check response times
   - Verify health checks

3. **Security Hardening**:
   - Enable SSL/TLS
   - Set up firewall rules
   - Configure regular backups

This deployment method allows you to maintain your code in Cursor while easily deploying updates through Portainer's user-friendly interface! 