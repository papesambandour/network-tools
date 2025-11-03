# Network Tools - SSH Tunnel Manager

A powerful SSH tunnel manager with SSL certificate generation and server management, featuring a modern web interface with real-time monitoring via WebSocket.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Architecture](#architecture)
6. [API Documentation](#api-documentation)
7. [Examples](#examples)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Development](#development)

---

## Quick Start

### Installation in 3 Steps

#### 1. Install Dependencies

```bash
# Quick install
npm run install-all

# Or manually
npm install
cd client && npm install && cd ..
```

#### 2. Configuration (Optional)

Default `.env` configuration:
```env
PORT=3001
CLIENT_URL=http://localhost:3000
SSH_KEY_PATH=~/.ssh/id_rsa
```

#### 3. Start the Application

```bash
# Option A - Automatic script
./start.sh

# Option B - npm
npm run dev

# Option C - Separately
npm run server  # Terminal 1
npm run client  # Terminal 2
```

**Access:** http://localhost:3001

---

## Features

### 1. SSH Tunnel Management

Create and manage SSH tunnels with local port forwarding to remote destinations.

**Capabilities:**
- Create tunnels with complete configuration
- Password or SSH key authentication
- Port forwarding: `localhost:local_port → remote_host:remote_port`
- Real-time status: connecting, connected, error, disconnected
- Detailed logs for each operation
- Auto-reconnect support (configurable attempts and intervals)
- Health monitoring with periodic checks
- Clean tunnel shutdown
- Automatic configuration saving

**Example:**
```bash
ssh -L 8888:dl.flathub.org:443 user@server.com
```
Becomes a simple form in the interface!

---

### 2. SSL Server Management

Save reusable SSH server profiles to create tunnels faster.

**Capabilities:**
- **Full CRUD**: Create, Read, Update, Delete
- **Connection Testing**: Verify accessibility before use
- **Auto-completion**: Select a server → fields auto-filled
- **Multiple Authentication**: Support for password AND SSH key
- **Descriptions**: Add notes for each server
- **Seamless Integration**: Usable directly from tunnel form

**Workflow:**
1. Create a server profile (Production, Dev, Staging, etc.)
2. When creating a tunnel, select the server
3. SSH info is auto-filled
4. Add only port forwarding info
5. Create the tunnel in seconds!

**Database:**
- Storage in NeDB (`server/data/ssl_servers.db`)
- Automatic persistence
- No external configuration needed

---

### 3. SSL Certificate Generation

Create self-signed SSL certificates for development servers.

**Capabilities:**
- Generation via node-forge
- Complete configuration: CN, Country, State, City, Organization
- Customizable validity period (days)
- Separate download: certificate + private key
- Automatic detection of expired certificates
- Management and deletion
- SAN (Subject Alternative Names) support

**Use Cases:**
- Local HTTPS servers
- SSL/TLS development
- Secure application testing
- Local Docker/Kubernetes environments

---

### 4. Real-Time Interface

Track activity live with WebSocket.

**Capabilities:**
- Bidirectional WebSocket connection
- Live logs color-coded by type:
  - 🔵 INFO: General information
  - 🟢 SUCCESS: Successful operations
  - 🟡 WARNING: Warnings
  - 🔴 ERROR: Errors
- Auto-scroll to new logs
- WebSocket connection indicator with pulse animation
- Automatic reconnection (5s)
- Broadcast updates to all clients
- History of last 100 logs

**WebSocket Events:**
- `connected`: Connection established
- `log`: New log received
- `tunnel_update`: Tunnel state modified
- `tunnel_removed`: Tunnel closed

---

### 5. Modern User Interface

Fluid, responsive, and professional design.

**Design:**
- Purple gradients (`#667eea` → `#764ba2`)
- Glassmorphism with backdrop-filter
- Smooth animations throughout
- Hover effects on all cards
- Advanced CSS3 transitions
- Animated status badges with pulse

**Navigation:**
- 4 main tabs:
  1. **SSH Tunnels**: Tunnel management
  2. **SSL Servers**: Server management
  3. **SSL Certificates**: Certificate generation
  4. **Logs**: Real-time console

**Responsive:**
- Desktop: Multi-column grids
- Tablet: Automatic adaptation
- Mobile: Optimized vertical layout

---

## Installation

### Prerequisites

- **Node.js** >= 14.x
- **npm** >= 6.x
- OS: Linux, macOS, or Windows
- SSH access to servers you want to manage

### Global Installation (Recommended)

This method allows you to use the `network-tools` command from anywhere on your system.

#### From npm (after publication)

```bash
npm install -g network-tools
```

#### From a .tgz file (without npm publication)

```bash
# 1. In the project directory, create the package
cd /path/to/network-tools
npm pack

# 2. Install globally the created .tgz file
npm install -g network-tools-1.0.1.tgz

# 3. Verify installation
which network-tools
network-tools --version
```

#### With npm link (for development)

```bash
# 1. In the project directory
cd /path/to/network-tools

# 2. Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# 3. Create global link
npm link

# 4. The network-tools command is now available
network-tools
```

### Local Installation

For local installation without global command:

```bash
# 1. Clone or extract the project
cd /path/to/network-tools

# 2. Install all dependencies
npm run install-all

# 3. Build the React client
npm run build

# 4. Start the application
npm start
```

---

## Usage

### Creating Your First Tunnel

1. Open http://localhost:3001
2. Click on "New Tunnel"
3. Fill in the form:
   - **Name**: `Test Tunnel`
   - **SSH Host**: Your SSH server
   - **SSH User**: Your username
   - **SSH Password** or **SSH Key Path**: Authentication
   - **Local Port**: `8888`
   - **Remote Host**: `localhost` (or other)
   - **Remote Port**: `80` (or other)
4. Click "Create Tunnel"
5. Check real-time logs in the "Logs" tab

### Using SSL Servers

#### 1. Create an SSL Server

1. Go to the **"SSL Servers"** tab
2. Click **"New Server"**
3. Fill in the form:
   - **Server Name**: Descriptive name (e.g., "Production Server")
   - **Host**: IP or domain name (e.g., xxx.xxx.xxx.xxx)
   - **Port**: SSH port (default: 22)
   - **User**: SSH username
   - **Password** or **SSH Key Path**: Authentication method
   - **Description**: Optional note
4. Click **"Add Server"**

#### 2. Use an SSL Server

When creating a tunnel:

1. Go to the **"SSH Tunnels"** tab
2. Click **"New Tunnel"**
3. In "SSH Server Configuration" section:
   - Select a server from **"Use Saved SSL Server"** dropdown
   - SSH Host, Port, User and Key Path fields are auto-filled
   - You can still modify these values if needed
4. Complete the rest of the form (Local Port, Remote Host, etc.)
5. Create the tunnel

### Generating Your First SSL Certificate

1. Go to the "SSL Certificates" tab
2. Click "Generate Certificate"
3. Fill in:
   - **Common Name**: `localhost`
   - Leave other fields as default
4. Click "Generate Certificate"
5. Download the certificate and key

---

## Architecture

### Backend - Node.js/Express

```
server/
├── index.js                    # Express Server + WebSocket
├── services/
│   ├── TunnelManager.js       # SSH tunnel management (ssh2)
│   ├── SSLManager.js          # SSL certificate generation (node-forge)
│   └── SSLServerManager.js    # SSL server CRUD (NeDB)
├── routes/
│   ├── tunnels.js             # Tunnel REST API
│   ├── ssl.js                 # SSL certificate REST API
│   └── sslServers.js          # SSL server REST API
└── data/
    ├── tunnels.db             # Tunnel configurations
    └── ssl_servers.db         # Saved SSL servers
```

**Technologies:**
- Express (HTTP server)
- ws (WebSocket server)
- ssh2 (SSH client)
- node-forge (SSL/TLS generation)
- NeDB (embedded NoSQL database)
- dotenv (environment config)

### Frontend - React

```
client/src/
├── App.js                      # Main app + tabs
├── components/
│   ├── TunnelManager.js       # Tunnel interface
│   ├── SSLServerManager.js    # SSL server interface
│   ├── SSLManager.js          # Certificate interface
│   └── LogViewer.js           # Real-time log console
└── services/
    ├── api.js                 # HTTP client (axios)
    └── websocket.js           # WebSocket client
```

**Technologies:**
- React 18
- Axios (HTTP client)
- Native WebSocket
- React Icons (1000+ icons)
- Modern CSS3

---

## API Documentation

### Tunnels API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tunnels` | List active tunnels |
| POST | `/api/tunnels` | Create tunnel |
| GET | `/api/tunnels/:id` | Tunnel details |
| DELETE | `/api/tunnels/:id` | Close tunnel |
| GET | `/api/tunnels/saved` | Saved configurations |
| DELETE | `/api/tunnels/saved/:id` | Delete saved config |

### SSL Servers API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ssl-servers` | List servers |
| POST | `/api/ssl-servers` | Create server |
| GET | `/api/ssl-servers/:id` | Server details |
| PUT | `/api/ssl-servers/:id` | Update server |
| DELETE | `/api/ssl-servers/:id` | Delete server |
| POST | `/api/ssl-servers/:id/test` | Test connection |

### SSL Certificates API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ssl/generate` | Generate certificate |
| GET | `/api/ssl` | List certificates |
| GET | `/api/ssl/:file` | Certificate details |
| GET | `/api/ssl/:file/download` | Download cert |
| GET | `/api/ssl/:file/download-key` | Download key |
| DELETE | `/api/ssl/:file` | Delete certificate |

### WebSocket Events

**Server → Client:**

```javascript
{
  type: 'log',
  data: {
    tunnelId: 'uuid',
    type: 'info|success|warning|error',
    message: 'Log message',
    timestamp: '2025-01-01T00:00:00.000Z'
  }
}

{
  type: 'tunnel_update',
  data: { /* tunnel info */ }
}

{
  type: 'tunnel_removed',
  data: { id: 'uuid' }
}
```

---

## Examples

### SSH Tunnel Examples

#### 1. Tunnel to Remote Web Server

**SSH Command:**
```bash
ssh -L 8080:localhost:80 user@remote-server.com
```

**App Configuration:**
- Tunnel Name: `Remote Web Server`
- SSH Host: `remote-server.com`
- SSH Port: `22`
- SSH User: `user`
- Local Port: `8080`
- Remote Host: `localhost`
- Remote Port: `80`

**Usage:** Access web server via `http://localhost:8080`

---

#### 2. Tunnel to MySQL Database

**SSH Command:**
```bash
ssh -L 3306:db-server:3306 user@jump-server.com
```

**App Configuration:**
- Tunnel Name: `MySQL Database`
- SSH Host: `jump-server.com`
- Local Port: `3306`
- Remote Host: `db-server`
- Remote Port: `3306`

**Usage:** Connect your MySQL client to `localhost:3306`

---

#### 3. Tunnel to PostgreSQL

**SSH Command:**
```bash
ssh -L 5432:postgres.internal:5432 admin@bastion.company.com
```

**App Configuration:**
- Tunnel Name: `PostgreSQL Production`
- SSH Host: `bastion.company.com`
- SSH User: `admin`
- Local Port: `5432`
- Remote Host: `postgres.internal`
- Remote Port: `5432`

---

#### 4. Tunnel to HTTPS Service

**SSH Command:**
```bash
ssh -L 8888:dl.flathub.org:443 user@server
```

**App Configuration:**
- Tunnel Name: `Flathub Download`
- SSH Host: `xxx.xxx.xxx.xxx`
- Local Port: `8888`
- Remote Host: `dl.flathub.org`
- Remote Port: `443`

**Usage:** Access via `https://localhost:8888`

---

### SSL Certificate Examples

#### 1. Certificate for Local Development

**Configuration:**
- Common Name: `localhost`
- Country: `US`
- State: `California`
- City: `San Francisco`
- Organization: `Dev Team`
- Validity: `365` days

**Usage:** For local HTTPS server

---

#### 2. Certificate for Custom Domain

**Configuration:**
- Common Name: `myapp.local`
- Country: `FR`
- State: `Ile-de-France`
- City: `Paris`
- Organization: `My Company`
- Validity: `730` days (2 years)

**Note:** Add `myapp.local` to your `/etc/hosts` file:
```
127.0.0.1 myapp.local
```

---

### Advanced Use Cases

#### SSH Key Authentication

1. Generate a key if needed:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/my_key
   ```

2. Copy public key to server:
   ```bash
   ssh-copy-id -i ~/.ssh/my_key.pub user@server.com
   ```

3. In the app, configure:
   - SSH Password: (leave empty)
   - SSH Key Path: `~/.ssh/my_key`

#### Using Generated Certificates

**Nginx:**
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

**Node.js:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

---

## Security

### Implemented Security

- ✅ SSH private key support
- ✅ No clear text password storage (outside local DB)
- ✅ Server-side validation
- ✅ .gitignore for secrets
- ✅ Output sanitization (passwords → ********)

### Recommendations

- ⚠️ Self-signed certificates = development only
- ⚠️ For production: Let's Encrypt / official CA
- ⚠️ Never commit SSH keys
- ⚠️ SSH key permissions: `chmod 600`
- ⚠️ Passwords in NeDB are not encrypted (future improvement)

### Best Practices

1. **Use SSH keys** instead of passwords
2. **Limit permissions** of SSH keys (600)
3. **Use descriptions** to easily identify servers
4. **Test connections** after creation/modification
5. **Delete unused servers**
6. **Backup** your database `server/data/ssl_servers.db`

---

## Troubleshooting

### Port Already in Use

```bash
# Find the process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port
PORT=8080 network-tools
```

### Command `network-tools` Not Found

```bash
# Check if npm global bin is in PATH
npm config get prefix

# Add to PATH if needed (Linux/macOS)
export PATH="$(npm config get prefix)/bin:$PATH"

# Windows
set PATH=%PATH%;%APPDATA%\npm
```

### Missing Dependencies Error

```bash
# Reinstall dependencies
npm install
cd client && npm install && cd ..

# Rebuild client
npm run build
```

### Tunnel Doesn't Connect

1. **Check SSH credentials:**
   ```bash
   # Test SSH connection manually
   ssh user@host -p port
   ```

2. **Check SSH key:**
   ```bash
   # Verify key exists
   ls -la ~/.ssh/id_rsa

   # Verify permissions (should be 600)
   chmod 600 ~/.ssh/id_rsa
   ```

3. **Check logs in the interface:**
   - Open tunnel details
   - Check real-time logs
   - Look for error messages

### Tunnel Disconnects Frequently

1. **Enable auto-reconnect:**
   - Edit the tunnel
   - Check "Auto-Reconnect"
   - 100 attempts with 3s interval

2. **Check network connection:**
   - Test internet connection stability
   - Check firewall rules

### WebSocket Doesn't Connect

1. **Check proxy/firewall:**
   - WebSockets may be blocked by some proxies
   - Try disabling VPN/proxy temporarily

2. **Check browser console:**
   - Open DevTools (F12)
   - Console tab
   - Look for WebSocket errors

---

## Development

### Useful Commands

```bash
# Development
npm run dev              # Backend + Frontend in parallel
npm run server           # Backend only
npm run client           # Frontend only

# Production
npm run build            # Build frontend
npm start               # Start production server

# Installation
npm run install-all      # Install everything
./start.sh              # Start with script

# Utilities
npm audit               # Check vulnerabilities
npm update              # Update dependencies
```

### Project Structure

```
network-tools/
├── server/
│   ├── index.js                 # Entry point
│   ├── services/
│   │   ├── TunnelManager.js     # SSH tunnel management
│   │   ├── SSLManager.js        # SSL generation
│   │   └── SSLServerManager.js  # SSL server management
│   ├── routes/
│   │   ├── tunnels.js           # Tunnel API routes
│   │   ├── ssl.js               # SSL API routes
│   │   └── sslServers.js        # SSL server API routes
│   ├── data/                    # NeDB database
│   └── certs/                   # Generated certificates
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TunnelManager.js  # Tunnel component
│   │   │   ├── SSLServerManager.js # Server component
│   │   │   ├── SSLManager.js     # SSL component
│   │   │   └── LogViewer.js      # Log component
│   │   ├── services/
│   │   │   ├── api.js            # API client
│   │   │   └── websocket.js      # WebSocket client
│   │   └── App.js                # Main component
│   └── public/
├── bin/
│   └── network-tools.js         # CLI entry point
└── package.json
```

### Adding Features

1. Backend: Modify `server/services/TunnelManager.js`
2. API: Add routes in `server/routes/`
3. Frontend: Create/modify components in `client/src/components/`
4. API Client: Update `client/src/services/api.js`

---

## Project Statistics

### Lines of Code (approximate)

- **Backend**: ~800 lines
  - TunnelManager: ~250 lines
  - SSLManager: ~150 lines
  - SSLServerManager: ~150 lines
  - Routes: ~250 lines

- **Frontend**: ~1200 lines
  - TunnelManager: ~350 lines
  - SSLServerManager: ~300 lines
  - SSLManager: ~250 lines
  - LogViewer: ~80 lines
  - App: ~80 lines
  - Services: ~140 lines

- **CSS**: ~600 lines

**Total**: ~2600 lines of code

### Dependencies

- Backend: 11 packages
- Frontend: 7 packages
- Dev: 2 packages

**Total**: 20 packages

---

## License

MIT

## Author

Pape Samba Ndour

---


---

## Support

For issues and questions:
- Check the logs in real-time interface
- Review examples above
- Check API documentation

---

**Ready to use! Start managing your SSH tunnels with ease! 🚀**
