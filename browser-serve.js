/**
 * Simple HTTP server for browser version of SysMocap
 * 
 * Run with: node browser-serve.js
 * Then open: http://localhost:3000/browser/
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(__dirname));

// Serve node_modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Add CORS headers for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Start server
app.listen(PORT, () => {
    console.log(`SysMocap Browser Edition server running at:`);
    console.log(`  http://localhost:${PORT}/browser/`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});
