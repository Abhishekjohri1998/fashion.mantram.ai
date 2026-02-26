# Deployment Guide: AWS EC2 (Amazon Linux 2023)

This guide will help you deploy your MERN stack application on your EC2 instance (`fashion.ai`) and point it to `fashion.mantram.ai`.

## Step 1: DNS Configuration
Go to your DNS provider (BigRock) and add a new record:
- **Type**: `A Record`
- **Host**: `fashion`
- **Points to**: `[Your EC2 Public IP]`
- **TTL**: `3600` (or default)

---

## Step 2: EC2 Security Group Rules
Ensure your EC2 Security Group allows the following inbound traffic:
- **Port 80 (HTTP)**: From Anywhere (0.0.0.0/0)
- **Port 443 (HTTPS)**: From Anywhere (0.0.0.0/0)
- **Port 22 (SSH)**: From your IP (Recommended)

---

## Step 3: Server Setup (SSH into EC2)
Connect to your instance: `ssh -i your-key.pem ec2-user@your-ec2-ip`

```bash
# Update system
sudo dnf update -y

# Install Node.js (Amazon Linux 2023 uses DNF)
sudo dnf install -y nodejs

# Install Git
sudo dnf install -y git

# Install Nginx
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 (Process Manager for Node.js)
sudo npm install -g pm2
```

---

## Step 4: Application Deployment
Clone your code (we assume you've pushed it to a GitHub repository):
```bash
git clone https://github.com/Abhishekjohri1998/fashion.mantram.ai.git app
cd app
```

### Backend Setup
```bash
cd backend
npm install
# Create production .env
nano .env
# Paste your MONGODB_URI, JWT_SECRET, PORT=5000, etc.
# Start with PM2
pm2 start src/server.ts --name backend --interpreter ts-node
```

### Frontend Setup
```bash
cd ../frontend
npm install
# Ensure .env has VITE_API_URL=https://fashion.mantram.ai/api
nano .env
# Build production files
npm run build
```

---

## Step 5: Nginx Reverse Proxy Configuration
Create a configuration for your domain:
```bash
sudo nano /etc/nginx/conf.d/fashion.ai.conf
```
Paste this configuration (adjust paths as necessary):
```nginx
server {
    listen 80;
    server_name fashion.mantram.ai;

    # Frontend
    location / {
        root /home/ec2-user/app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 6: SSL with Certbot
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d fashion.mantram.ai
```

---

## Final Verification
Visit `https://fashion.mantram.ai` to see your live application!
