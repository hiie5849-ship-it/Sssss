# ZappKart Deployment Guide

This guide covers deploying the full-stack ZappKart marketplace to production environments.

---

## Architecture Overview

ZappKart is built with a unified full-stack architecture:
- **Backend API**: Express running on Node.js v22 with transaction-safe persistent database storage, cryptographic signature verification, and RBAC authentication.
- **Frontend SPA**: React 19 + TypeScript + Tailwind CSS, served through high-performance static caching in production.
- **Port**: Serves both API (`/api/*`) and client on port `3000` (or `PORT` environment variable).

---

## 1. Google Cloud Run Deployment (Containerized)

Cloud Run offers automatic scaling and managed HTTPS.

### `Dockerfile`
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000
CMD ["npm", "start"]
```

### Build & Deploy Command
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/zappkart
gcloud run deploy zappkart \
  --image gcr.io/YOUR_PROJECT_ID/zappkart \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production,PORT=3000
```

---

## 2. VPS / DigitalOcean / AWS EC2 Deployment with PM2

```bash
# Clone and build
git clone https://github.com/your-org/zappkart.git
cd zappkart
npm install
npm run build

# Start with PM2 process manager
npm install -g pm2
pm2 start "npm start" --name "zappkart-marketplace"
pm2 save
pm2 startup
```

---

## 3. Nginx Reverse Proxy with SSL (Certbot)

```nginx
server {
    server_name zappkart.com www.zappkart.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Obtain SSL certificate:
```bash
sudo certbot --nginx -d zappkart.com -d www.zappkart.com
```
