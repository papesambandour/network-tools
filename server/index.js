require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const tunnelRoutes = require('./routes/tunnels');
const sslRoutes = require('./routes/ssl');
const sslServerRoutes = require('./routes/sslServers');
const TunnelManager = require('./services/TunnelManager');
const SSHTerminalManager = require('./services/SSHTerminalManager');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for SSH terminals FIRST (before WebSocket Server)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Debug middleware
io.engine.on("connection_error", (err) => {
  console.log('[Socket.IO] Connection error:', err.req ? err.req.url : 'no request');
  console.log('[Socket.IO] Error code:', err.code);
  console.log('[Socket.IO] Error message:', err.message);
  console.log('[Socket.IO] Error context:', err.context);
});

// WebSocket Server for tunnels (configured to NOT intercept Socket.IO paths)
const wss = new WebSocketServer({
  noServer: true // Don't attach to server automatically
});

// Manual upgrade handling to separate Socket.IO and regular WebSocket
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, 'ws://localhost');
  const pathname = url.pathname;

  console.log('[Server] WebSocket upgrade request for path:', pathname);
  console.log('[Server] Full URL:', request.url);

  // Let Socket.IO handle its own paths (both /socket.io/ and namespaces like /ssh-terminal)
  if (pathname.startsWith('/socket.io/') || request.url.includes('/socket.io/')) {
    console.log('[Server] Socket.IO upgrade - letting Socket.IO handle it');
    // Socket.IO will handle this automatically, don't interfere
    return;
  }

  // Handle regular WebSocket connections for tunnels
  console.log('[Server] Regular WebSocket upgrade - handling with wss');
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Tunnel Manager
const tunnelManager = new TunnelManager(wss);

// Initialize SSH Terminal Manager (this sets up Socket.IO connection handlers)
const sshTerminalManager = new SSHTerminalManager(io);

// Make tunnelManager available to routes
app.use((req, res, next) => {
  req.tunnelManager = tunnelManager;
  next();
});

// Routes
app.use('/api/tunnels', tunnelRoutes);
app.use('/api/ssl', sslRoutes);
app.use('/api/ssl-servers', sslServerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve static files from React build in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));

  // Handle React routing - send all other requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to SSH Tunnel Manager',
    timestamp: new Date()
  }));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, async () => {
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://127.0.0.1:${PORT}`;

  console.log('\n🚀 Network Tools Server Started Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server URL:        ${localUrl}`);
  console.log(`🌐 Network URL:       ${networkUrl}`);
  console.log(`🔌 WebSocket:         ws://localhost:${PORT}`);
  console.log(`🖥️  Socket.IO:        ${localUrl}/socket.io/`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n💡 Open your browser and navigate to: ${localUrl}\n`);

  // Load tunnels from database (without auto-connecting)
  try {
    const loadedCount = await tunnelManager.loadTunnelsFromDb();
    if (loadedCount > 0) {
      console.log(`✅ Successfully loaded ${loadedCount} tunnel(s) from database`);
      console.log('⚠️  Tunnels are disconnected by default. Use the Start button to connect.\n');
    }
  } catch (err) {
    console.error('❌ Error loading tunnels:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  tunnelManager.closeAll();
  sshTerminalManager.closeAll();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});