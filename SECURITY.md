# 🔒 Security Guide for Liminal Ebook Manager

## 🚨 **IMPORTANT: Never Commit Secrets to Git**

This repository is **public**, so any secrets committed to git will be visible to everyone on the internet.

## ✅ **Proper Secret Management**

### 1. **Environment Variables**
- ✅ **DO**: Use `.env` files locally (already in `.gitignore`)
- ✅ **DO**: Use Portainer environment variables for deployment
- ❌ **DON'T**: Commit `.env` files to git
- ❌ **DON'T**: Hardcode passwords in code

### 2. **Generate Strong Secrets**

**For PostgreSQL Password:**
```bash
# Generate a strong password
openssl rand -base64 32
# or use a password manager
```

**For Secret Key:**
```bash
# Generate a strong secret key
openssl rand -hex 32
```

### 3. **Portainer Deployment Security**

When setting up in Portainer:

1. **Use Portainer's Environment Variables** (not .env files)
2. **Generate unique secrets** for each deployment
3. **Never use the example values** from env.example

### 4. **Example Secure Setup**

**In Portainer Environment Variables:**
```
POSTGRES_PASSWORD=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SECRET_KEY=f7e6d5c4b3a298765432109876543210fedcba9876543210abcdef1234567890
```

## 🔧 **Local Development Security**

### 1. **Create Local .env File**
```bash
# Copy the example (never commit this file)
cp env.example .env

# Edit with your local secrets
nano .env
```

### 2. **Use Different Secrets for Each Environment**
- **Development**: `dev-` prefix
- **Staging**: `staging-` prefix  
- **Production**: `prod-` prefix

## 🛡️ **Additional Security Measures**

### 1. **Database Security**
- Use strong, unique passwords
- Limit database access to application only
- Consider using connection pooling

### 2. **API Security**
- Use HTTPS in production
- Implement rate limiting
- Add authentication for sensitive operations

### 3. **File Upload Security**
- Validate file types
- Limit file sizes
- Scan for malware (future enhancement)

## 🚀 **Quick Security Checklist**

Before deploying:

- [ ] Generated strong PostgreSQL password
- [ ] Generated strong secret key
- [ ] Using Portainer environment variables
- [ ] No secrets in git repository
- [ ] HTTPS enabled (for production)
- [ ] Firewall configured
- [ ] Database access restricted

## 🔍 **Security Monitoring**

Consider adding:
- Log monitoring
- Failed login attempts tracking
- File upload monitoring
- Database access logging

## 📞 **If You Accidentally Commit Secrets**

1. **Immediately change the secrets**
2. **Check git history** for exposed secrets
3. **Consider the repository compromised**
4. **Generate new secrets** for all environments
5. **Review access logs** for unauthorized access

---

**Remember**: Security is an ongoing process. Regularly review and update your security practices! 