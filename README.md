# Network Tools

A powerful SSH tunnel manager with SSL certificate generation and server management capabilities, featuring a modern web interface with real-time monitoring.

## Features

- **SSH Tunnel Management**: Create and manage SSH tunnels with local port forwarding
- **SSL Server Profiles**: Save and reuse SSH server configurations
- **SSL Certificate Generation**: Create self-signed certificates for development
- **Reverse Proxy**: Dynamic reverse proxy with support for API and streaming routes
- **SSH Terminal**: Interactive SSH terminal in the browser
- **Real-Time Monitoring**: Live logs via WebSocket connection
- **Modern Web Interface**: Responsive design with intuitive controls

## Quick Start

### Installation

#### Global Installation (Recommended)

```bash
# Install from npm
npm install -g network-tools

# Or install from a .tgz file
npm install -g network-tools-1.0.1.tgz
```

#### Verify Installation

```bash
network-tools --version
```

### Usage

Start the application:

```bash
network-tools
```

Then open your browser at: **http://localhost:3001**

### Configuration

You can customize the application using environment variables:

```bash
# Change the port
PORT=8080 network-tools

# Set custom SSH key path
SSH_KEY_PATH=~/.ssh/custom_key network-tools
```

Or create a `.env` file:

```env
PORT=3001
CLIENT_URL=http://localhost:3000
SSH_KEY_PATH=~/.ssh/id_rsa
```

## Using the Application

### 1. Creating an SSH Tunnel

1. Open http://localhost:3001
2. Click **"New Tunnel"**
3. Fill in the tunnel configuration:
   - **Name**: Descriptive name for your tunnel
   - **SSH Host**: Your SSH server address
   - **SSH Port**: SSH port (default: 22)
   - **SSH User**: Your username
   - **Authentication**: Password or SSH key path
   - **Local Port**: Port on your machine
   - **Remote Host**: Target host (e.g., localhost, database.internal)
   - **Remote Port**: Target port
4. Click **"Create Tunnel"**

**Example**: Access a remote web server locally
```
Name: Remote Web Server
SSH Host: server.example.com
Local Port: 8080
Remote Host: localhost
Remote Port: 80
```
Access via: `http://localhost:8080`

### 2. Managing SSL Server Profiles

Save frequently used SSH servers for quick tunnel creation:

1. Go to the **"SSL Servers"** tab
2. Click **"New Server"**
3. Configure:
   - **Server Name**: e.g., "Production Server"
   - **Host**: IP or domain
   - **Port**: 22 (default)
   - **User**: SSH username
   - **Authentication**: Password or SSH key
   - **Description**: Optional notes
4. Click **"Add Server"**

When creating tunnels, you can now select a saved server and all SSH fields will auto-fill!

### 3. Generating SSL Certificates

Create self-signed certificates for development:

1. Go to **"SSL Certificates"** tab
2. Click **"Generate Certificate"**
3. Configure:
   - **Common Name**: Domain or hostname (e.g., localhost, myapp.local)
   - **Country, State, City**: Location information
   - **Organization**: Your company/team name
   - **Validity**: Days until expiration
4. Click **"Generate Certificate"**
5. Download the certificate and private key

**Use Cases**:
- Local HTTPS servers
- Development environments
- Testing SSL/TLS functionality

### 4. Reverse Proxy Routes

Configure dynamic reverse proxy routes to backend services:

1. Go to **"Reverse Proxy Manager"** module from home
2. Click **"New Route"**
3. Configure:
   - **Path**: Route path (e.g., `/api-auth`)
   - **Target**: Backend URL (e.g., `http://backend.example.com`)
   - **Type**:
     - `API` for REST APIs (uses Axios)
     - `Stream` for file downloads, WebSocket, streaming (uses http-proxy-middleware)
   - **Proxy**: Optional proxy server (e.g., `http://proxy:3128`)
   - **Headers**: Custom HTTP headers
4. Click **"Create"**
5. Copy the Internal URL (e.g., `http://localhost:3001/api-auth`)
6. Use it in your applications!

**Features**:
- Dynamic route creation without restart
- Support for proxy servers
- Custom headers per route
- Enable/disable routes on the fly
- Test connectivity before creation
- Copy internal URL with one click

**Documentation**: See [Reverse Proxy Module](#reverse-proxy-module) section in ARCHITECTURE.md for detailed information

### 5. SSH Terminal

Interactive SSH terminal directly in your browser:

1. Go to **"SSH Terminal"** tab
2. Connect to any SSH server
3. Execute commands in real-time
4. Multiple terminal sessions support

### 6. Real-Time Logs

Monitor all tunnel activity in the **"Logs"** tab:
- Connection status updates
- Error messages
- Configuration changes
- Auto-scroll to newest logs

## Common Use Cases

### Database Access Through Jump Server

```
SSH Host: jump-server.com
SSH User: admin
Local Port: 5432
Remote Host: postgres.internal
Remote Port: 5432
```

Connect your database client to `localhost:5432`

### Accessing Internal Web Services

```
SSH Host: bastion.company.com
Local Port: 8080
Remote Host: internal-app.local
Remote Port: 80
```

Access internal app via `http://localhost:8080`

### Secure HTTPS Tunnel

```
SSH Host: gateway.example.com
Local Port: 8888
Remote Host: secure-api.internal
Remote Port: 443
```

Access API via `https://localhost:8888`

### Reverse Proxy Use Case

```
Path: /github-api
Target: https://api.github.com
Type: API
Proxy: http://corporate-proxy:8080
Headers: Authorization: token ghp_xxxxx
```

Access GitHub API via `http://localhost:3001/github-api/users/octocat`

**Benefits**:
- Bypass CORS restrictions
- Centralize authentication
- Route through corporate proxy
- Add custom headers automatically

## Authentication Methods

### Using SSH Keys (Recommended)

1. Generate a key if needed:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/my_key
   ```

2. Copy to server:
   ```bash
   ssh-copy-id -i ~/.ssh/my_key.pub user@server.com
   ```

3. In the app, set:
   - **SSH Key Path**: `~/.ssh/my_key`
   - **SSH Password**: (leave empty)

### Using Password

Simply enter your SSH password in the **SSH Password** field.

## Troubleshooting

### Command Not Found

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (Linux/macOS)
export PATH="$(npm config get prefix)/bin:$PATH"

# Windows
set PATH=%PATH%;%APPDATA%\npm
```

### Port Already in Use

```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8080 network-tools
```

### Tunnel Connection Issues

1. **Verify SSH access**:
   ```bash
   ssh user@host -p port
   ```

2. **Check SSH key permissions**:
   ```bash
   chmod 600 ~/.ssh/id_rsa
   ```

3. **Review logs** in the application's Logs tab

### WebSocket Connection Issues

- Check if proxies/firewalls are blocking WebSocket connections
- Try disabling VPN temporarily
- Check browser console (F12) for errors

## CLI Options

```bash
# Start with custom port
PORT=8080 network-tools

# Specify SSH key path
SSH_KEY_PATH=~/.ssh/custom_key network-tools

# Show version
network-tools --version

# Show help
network-tools --help
```

## Requirements

- Node.js >= 14.x
- npm >= 6.x
- SSH access to target servers
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Security Best Practices

1. **Use SSH keys** instead of passwords when possible
2. **Set correct permissions** on SSH keys: `chmod 600 ~/.ssh/id_rsa`
3. **Never commit** SSH keys or passwords to version control
4. **Use self-signed certificates** for development only
5. **Regularly update** the package: `npm update -g network-tools`

## Documentation

### Main Documentation
- **[README.md](./README.md)**: This file - Getting started guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Complete technical architecture and detailed documentation

### Reverse Proxy Module
All reverse proxy documentation is now consolidated in **[ARCHITECTURE.md](./ARCHITECTURE.md)** under the [Reverse Proxy Module](#reverse-proxy-module) section:
- Complete reverse proxy documentation
- Usage guide with examples (curl, JavaScript, Python)
- Visual examples and workflow
- Feature summary and changelog
- Quick start guide (30-second setup)
- Use cases and best practices
- Troubleshooting guide

### Testing
- **[test-reverse-proxy.sh](./test-reverse-proxy.sh)**: Automated test script for reverse proxy

## Support

- **Documentation**: See documentation files above for detailed information
- **Issues**: Report bugs or request features via your package repository
- **Logs**: Check the real-time logs in the application for debugging

## License

MIT

## Author

Pape Samba Ndour

---

**Ready to manage your SSH tunnels with ease!**