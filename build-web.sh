#!/bin/bash

# Build script for SysMocap Web Version
# This script creates a production-ready web build

set -e

echo "🚀 Building SysMocap Web Version..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf web-build
rm -f SysMocap-Web-Build.tar.gz SysMocap-Web-Build.zip

# Create build directory
echo "📁 Creating build directory..."
mkdir -p web-build

# Copy application files
echo "📋 Copying application files..."
cp -r mainview web-build/
cp -r mocap web-build/
cp -r mocaprender web-build/
cp -r render web-build/
cp -r modelview web-build/
cp -r pdfviewer web-build/
cp -r utils web-build/
cp -r models web-build/
cp -r fonts web-build/
cp -r icons web-build/
cp -r pdfs web-build/
cp -r webserv web-build/
cp -r browser web-build/

# Copy node_modules (only needed packages)
echo "📦 Copying dependencies..."
mkdir -p web-build/node_modules
cp -r node_modules/@mediapipe web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/@pixiv web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/@material web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/three web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/kalidokit web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/mdui web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/vue web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/lil-gui web-build/node_modules/ 2>/dev/null || true
cp -r node_modules/socket.io web-build/node_modules/ 2>/dev/null || true

# Copy documentation
echo "📄 Copying documentation..."
cp README.md web-build/ 2>/dev/null || true
cp LICENSE web-build/ 2>/dev/null || true
cp BROWSER_MIGRATION.md web-build/ 2>/dev/null || true
cp BROWSER_DEV_GUIDE.md web-build/ 2>/dev/null || true
cp IMPLEMENTATION_SUMMARY.md web-build/ 2>/dev/null || true

# Create root index.html
echo "📝 Creating index.html..."
cat > web-build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="description" content="SysMocap - Video-based motion capture system for browsers and Android">
    <meta name="keywords" content="motion capture, mocap, VRM, 3D, animation, browser, Android">
    <title>SysMocap - Browser Edition</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
            transition: background 0.3s;
        }
        .button:hover {
            background: #5568d3;
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .feature {
            margin: 10px 0;
        }
        .feature::before {
            content: "✓ ";
            color: #667eea;
            font-weight: bold;
        }
    </style>
    <script>
        // Auto-redirect after 3 seconds
        setTimeout(function() {
            window.location.href = 'mainview/framework.html';
        }, 3000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🎭 SysMocap</h1>
        <p><strong>Browser Edition</strong></p>
        <p>Video-based motion capture system for web browsers and Android devices</p>
        
        <div class="features">
            <div class="feature">Real-time motion capture</div>
            <div class="feature">3D character animation</div>
            <div class="feature">Works on Android devices</div>
            <div class="feature">No installation required</div>
        </div>
        
        <a href="mainview/framework.html" class="button">Launch Application</a>
        
        <p style="margin-top: 30px; font-size: 14px;">
            Redirecting automatically in 3 seconds...<br>
            <a href="mainview/framework.html">Click here</a> if not redirected.
        </p>
    </div>
</body>
</html>
EOF

# Create deployment guide
echo "📖 Creating deployment guide..."
cat > web-build/DEPLOYMENT.md << 'EOF'
# SysMocap Web Version - Deployment Guide

## Quick Deploy

### Option 1: Simple HTTP Server (Testing)
```bash
cd web-build
python3 -m http.server 8000
# Open http://localhost:8000
```

### Option 2: Nginx (Production)
```bash
# Copy files
sudo cp -r web-build/* /var/www/sysmocap/

# Configure nginx (see nginx.conf.example)
sudo nano /etc/nginx/sites-available/sysmocap

# Enable site
sudo ln -s /etc/nginx/sites-available/sysmocap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Apache (Production)
```bash
# Copy files
sudo cp -r web-build/* /var/www/html/sysmocap/

# .htaccess is already included

# Enable required modules
sudo a2enmod headers deflate expires
sudo systemctl reload apache2
```

## Requirements

- **HTTPS required** for camera access in production
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Web server with static file serving

## HTTPS Setup

### Let's Encrypt (Free)
```bash
sudo certbot --nginx -d yourdomain.com
```

### Cloudflare (Free)
1. Add your domain to Cloudflare
2. Enable SSL/TLS (Full mode)
3. Point DNS to your server

## Troubleshooting

**Camera not working?**
- Ensure HTTPS is enabled
- Check browser permissions
- Allow camera access when prompted

**Files not loading?**
- Check file permissions (755 for directories, 644 for files)
- Verify CORS headers
- Check browser console for errors

## Support

See README.md for more information.
EOF

# Create version file
echo "🏷️  Creating version file..."
VERSION=$(git describe --tags 2>/dev/null || echo "dev-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')")
cat > web-build/VERSION.txt << EOF
SysMocap Web Version
====================
Version: $VERSION
Build Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
EOF

# Create archives
echo "📦 Creating archives..."
cd web-build
tar -czf ../SysMocap-Web-Build.tar.gz .
zip -r ../SysMocap-Web-Build.zip . >/dev/null 2>&1
cd ..

# Calculate sizes
TAR_SIZE=$(du -h SysMocap-Web-Build.tar.gz | cut -f1)
ZIP_SIZE=$(du -h SysMocap-Web-Build.zip | cut -f1)

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output files:"
echo "   - web-build/                     (Directory)"
echo "   - SysMocap-Web-Build.tar.gz     ($TAR_SIZE)"
echo "   - SysMocap-Web-Build.zip        ($ZIP_SIZE)"
echo ""
echo "📖 Next steps:"
echo "   1. Test locally: cd web-build && python3 -m http.server 8000"
echo "   2. Deploy to server: See web-build/DEPLOYMENT.md"
echo "   3. Enable HTTPS for camera access"
echo ""
echo "🎉 Ready for deployment!"
