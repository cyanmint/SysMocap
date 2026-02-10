# SysMocap Web Version Deployment Guide

## Quick Start

The `web-build` directory contains everything needed to deploy SysMocap to a web server.

## Requirements

- Web server (Apache, Nginx, or any static file server)
- HTTPS certificate (required for camera access)
- Modern browser support (Chrome 90+, Firefox 88+, Safari 14+)

## Deployment Methods

### Method 1: Static File Server

Simply upload the contents of this directory to your web server:

```bash
# Upload to server
rsync -avz web-build/ user@server:/var/www/sysmocap/
```

### Method 2: Nginx

1. Copy files to server:
```bash
sudo cp -r web-build/* /var/www/sysmocap/
```

2. Use the provided nginx.conf.example as a template:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/sysmocap
sudo ln -s /etc/nginx/sites-available/sysmocap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Method 3: Apache

1. Copy files to server:
```bash
sudo cp -r web-build/* /var/www/html/sysmocap/
```

2. The .htaccess file is already configured.

3. Enable required modules:
```bash
sudo a2enmod headers deflate expires
sudo systemctl reload apache2
```

### Method 4: GitHub Pages

1. Push the web-build directory to a gh-pages branch
2. Enable GitHub Pages in repository settings
3. Access via https://username.github.io/repository-name/

Note: Camera access may be limited on GitHub Pages.

### Method 5: Netlify/Vercel

1. Create a new site
2. Upload the web-build directory
3. Configure custom domain with HTTPS

## Testing Locally

Use any simple HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then open http://localhost:8000

## HTTPS Configuration

HTTPS is **required** for camera access in production. Options:

1. **Let's Encrypt** (Free):
```bash
sudo certbot --nginx -d sysmocap.example.com
```

2. **Cloudflare** (Free): Use Cloudflare's free SSL

3. **Self-signed** (Development only):
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is enabled
- Check browser permissions
- Verify CORS headers

### Files Not Loading
- Check file permissions
- Verify MIME types
- Check browser console for errors

### Performance Issues
- Enable gzip compression
- Add cache headers
- Use CDN for node_modules

## Support

See:
- README.md - Main documentation
- BROWSER_MIGRATION.md - Technical details
- BROWSER_DEV_GUIDE.md - Developer guide
