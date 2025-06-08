# SongSnaps Deployment Guide for songsnaps.xyz

## 🚀 Production Deployment Instructions

### Prerequisites
- Digital Ocean server with Ubuntu 20.04+
- Domain songsnaps.xyz pointed to server IP
- Docker and Docker Compose installed
- Nginx installed
- SSL certificate (Let's Encrypt recommended)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y
```

### 2. Application Deployment

```bash
# Clone the repository
git clone <your-repo-url> /var/www/songsnaps
cd /var/www/songsnaps

# Set up environment variables
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Build and start services
docker-compose up -d --build

# Check if services are running
docker-compose ps
```

### 3. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/songsnaps.xyz
sudo ln -s /etc/nginx/sites-available/songsnaps.xyz /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d songsnaps.xyz -d www.songsnaps.xyz

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 5. Domain Configuration

**In Namecheap:**
1. Go to Domain Management
2. Set A Record: `@` → `Your_Server_IP`
3. Set A Record: `www` → `Your_Server_IP`
4. Wait for DNS propagation (up to 48 hours)

### 6. Environment Variables to Update

**Backend (.env):**
```env
MONGO_URL=mongodb://localhost:27017/songsnaps_production
WHATSAPP_NUMBER=+1234567890  # Replace with your actual number
ADMIN_PASSWORD=songsnaps2024  # Change for security
```

**When ready for Stripe:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 7. Monitoring & Maintenance

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull origin main
docker-compose up -d --build

# Backup database
docker exec songsnaps_mongodb mongodump --db songsnaps_production --out /backup
```

### 8. Testing

1. **Visit https://songsnaps.xyz** - Should load the landing page
2. **Test API:** https://songsnaps.xyz/api/health
3. **Test Admin:** Click "Login" → Enter password
4. **Test Payment Flow:** Use demo buttons
5. **Mobile Test:** Check on various devices

### 9. Post-Deployment Checklist

- [ ] Domain resolves to songsnaps.xyz
- [ ] SSL certificate is active (green lock icon)
- [ ] Landing page loads correctly
- [ ] API endpoints respond
- [ ] Admin dashboard accessible
- [ ] Payment simulation works
- [ ] Mobile responsive
- [ ] WhatsApp integration works

### 10. Production Optimizations

**Performance:**
- Enable Gzip compression in Nginx
- Set up CDN (Cloudflare recommended)
- Configure proper caching headers
- Monitor with Google PageSpeed Insights

**Security:**
- Change default admin password
- Set up firewall (UFW)
- Enable fail2ban
- Regular security updates
- Monitor logs for suspicious activity

**Backup:**
- Set up automated MongoDB backups
- Create server snapshots
- Document recovery procedures

## 🛠 Troubleshooting

**Common Issues:**

1. **502 Bad Gateway:** Backend service not running
   ```bash
   docker-compose restart backend
   ```

2. **Database Connection Error:** MongoDB not accessible
   ```bash
   docker-compose restart mongodb
   ```

3. **SSL Issues:** Certificate problems
   ```bash
   sudo certbot renew
   sudo systemctl restart nginx
   ```

4. **DNS Issues:** Domain not resolving
   - Check Namecheap DNS settings
   - Wait for propagation (up to 48 hours)
   - Use online DNS checker tools

## 📞 Support

If you encounter any issues during deployment, the logs will help diagnose problems:
```bash
# Backend logs
docker-compose logs backend

# Frontend logs  
docker-compose logs frontend

# Database logs
docker-compose logs mongodb

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🎉 Go Live!

Once deployed successfully:
1. Update Stripe URLs with real payment links
2. Replace WhatsApp number with your actual number
3. Start marketing your amazing SongSnaps service!

**Your MVP is ready to make money! 💰**