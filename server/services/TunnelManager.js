const { Client } = require('ssh2');
const { v4: uuidv4 } = require('uuid');
const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const net = require('net');

class TunnelManager {
  constructor(wss) {
    this.wss = wss;
    this.tunnels = new Map();
    this.db = new Datastore({
      filename: path.join(__dirname, '../data/tunnels.db'),
      autoload: true
    });

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Start periodic health check every 5 seconds
    this.startHealthCheckMonitoring();
  }

  startHealthCheckMonitoring() {
    // Check tunnel health every 5 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 5000);

    console.log('Health check monitoring started (5 second interval)');
  }

  async performHealthChecks() {
    for (const [tunnelId, tunnel] of this.tunnels) {
      // Only check connected tunnels
      if (tunnel.status === 'connected') {
        try {
          await this.checkTunnelHealth(tunnelId);
        } catch (err) {
          console.error(`Health check failed for tunnel ${tunnelId}:`, err.message);
        }
      }
    }
  }

  async checkTunnelHealth(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel || tunnel.status !== 'connected') {
      return;
    }

    let isHealthy = true;
    let healthIssues = [];

    // Check 1: SSH connection object exists and socket is not destroyed
    if (!tunnel.connection) {
      isHealthy = false;
      healthIssues.push('SSH connection object missing');
    } else if (tunnel.connection._sock?.destroyed) {
      isHealthy = false;
      healthIssues.push('SSH socket destroyed');
    } else if (!tunnel.connection._sock?.writable) {
      isHealthy = false;
      healthIssues.push('SSH socket not writable');
    } else if (!tunnel.connection._sock?.readable) {
      isHealthy = false;
      healthIssues.push('SSH socket not readable');
    }

    // Check 2: Local server is still listening
    if (!tunnel.server || !tunnel.server.listening) {
      isHealthy = false;
      healthIssues.push('Local port not listening');
    }

    // Check 3: Test end-to-end connectivity through the tunnel (only if SSH seems ok)
    if (isHealthy) {
      try {
        const canConnectToRemote = await this.testRemoteConnection(tunnel);
        if (!canConnectToRemote) {
          isHealthy = false;
          healthIssues.push('Remote endpoint unreachable');
        }
      } catch (err) {
        isHealthy = false;
        healthIssues.push(`Remote test failed: ${err.message}`);
      }
    }

    // If unhealthy, mark as error and log
    if (!isHealthy) {
      tunnel.status = 'error';
      tunnel.error = healthIssues.join(', ');
      this.logMessage(tunnelId, 'error', `Health check failed: ${tunnel.error}`);
      this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(tunnelId) });

      // Close the broken connections
      if (tunnel.server) {
        try {
          tunnel.server.close();
        } catch (e) {}
      }
      if (tunnel.connection) {
        try {
          tunnel.connection.end();
        } catch (e) {}
      }

      // Trigger reconnection if auto-reconnect is enabled
      if (tunnel.autoReconnect && tunnel.reconnectAttempts < tunnel.maxReconnectAttempts) {
        tunnel.reconnectAttempts++;
        const delay = tunnel.reconnectDelay || 3000; // Fixed 3 second delay
        this.logMessage(tunnelId, 'warning', `Auto-reconnect triggered (${tunnel.reconnectAttempts}/${tunnel.maxReconnectAttempts}) - retrying in ${delay/1000}s`);

        setTimeout(() => {
          this.reconnectTunnel(tunnelId);
        }, delay);
      }
    }
  }

  async testRemoteConnection(tunnel) {
    return new Promise((resolve) => {
      const { localPort, remoteHost, remotePort } = tunnel.config;

      // Create a test connection to localhost:localPort
      // which should forward to remoteHost:remotePort through the tunnel
      const testSocket = new net.Socket();
      const timeout = 5000; // 5 second timeout before marking as lost

      const timeoutHandle = setTimeout(() => {
        testSocket.destroy();
        resolve(false);
      }, timeout);

      testSocket.on('connect', () => {
        clearTimeout(timeoutHandle);
        testSocket.destroy();
        resolve(true);
      });

      testSocket.on('error', (err) => {
        clearTimeout(timeoutHandle);
        resolve(false);
      });

      // Connect to the local port, which should tunnel to remote
      testSocket.connect(localPort, '127.0.0.1');
    });
  }

  broadcast(message) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(payload);
      }
    });
  }

  logMessage(tunnelId, type, message) {
    const logEntry = {
      tunnelId,
      type,
      message,
      timestamp: new Date().toISOString()
    };

    // Store log in tunnel logs (keep last 50)
    const tunnel = this.tunnels.get(tunnelId);
    if (tunnel) {
      if (!tunnel.logs) tunnel.logs = [];
      tunnel.logs.push(logEntry);
      if (tunnel.logs.length > 50) {
        tunnel.logs = tunnel.logs.slice(-50);
      }
    }

    this.broadcast({
      type: 'log',
      data: logEntry
    });
  }

  async createTunnel(config, tunnelId = null) {
    return new Promise((resolve, reject) => {
      const id = tunnelId || config.id || uuidv4();
      const {
        name,
        sshHost,
        sshPort,
        sshUser,
        sshPassword,
        sshKeyPath,
        localPort,
        remoteHost,
        remotePort,
        autoReconnect = false
      } = config;

      // Check if tunnel already exists (for reconnection)
      const existingTunnel = this.tunnels.get(id);
      const isReconnecting = existingTunnel !== undefined;

      const tunnel = {
        id,
        name: name || existingTunnel?.name || 'Unnamed Tunnel',
        config: {
          sshHost,
          sshPort: sshPort || 22,
          sshUser,
          sshPassword,
          sshKeyPath,
          localPort,
          remoteHost,
          remotePort,
          autoReconnect
        },
        status: 'connecting',
        createdAt: existingTunnel?.createdAt || new Date(),
        logs: existingTunnel?.logs || [],
        autoReconnect: existingTunnel?.autoReconnect !== undefined ? existingTunnel.autoReconnect : autoReconnect,
        reconnectAttempts: existingTunnel?.reconnectAttempts || 0,
        maxReconnectAttempts: 100,
        reconnectDelay: 3000, // 3 seconds between retries
        persistent: true // Mark as persistent
      };

      this.tunnels.set(id, tunnel);

      if (isReconnecting) {
        this.logMessage(id, 'info', `Reconnecting tunnel: ${name}`);
      } else {
        this.logMessage(id, 'info', `Creating tunnel: ${name}`);
      }

      // Save to database immediately
      this.saveTunnelToDb(id);

      const conn = new Client();
      tunnel.connection = conn;

      conn.on('ready', () => {
        this.logMessage(id, 'success', `SSH connection established to ${sshHost}`);

        // Create local TCP server for port forwarding
        const server = net.createServer((clientSocket) => {
          // Check if this is a health check connection (identified by immediate close)
          let isHealthCheck = false;
          const healthCheckTimeout = setTimeout(() => {
            // If connection stays open longer than 100ms, it's a real connection
            if (!isHealthCheck) {
              this.logMessage(id, 'info', `New connection to localhost:${localPort}`);
            }
          }, 100);

          clientSocket.once('close', () => {
            clearTimeout(healthCheckTimeout);
          });

          conn.forwardOut(
            clientSocket.remoteAddress,
            clientSocket.remotePort,
            remoteHost,
            remotePort,
            (err, stream) => {
              if (err) {
                clearTimeout(healthCheckTimeout);
                // Only log real forwarding errors, not health check failures
                const isTimeout = err.message && err.message.includes('Timed out');
                if (!isTimeout) {
                  this.logMessage(id, 'error', `Forwarding failed: ${err.message}`);
                }
                clientSocket.end();
                return;
              }

              // If we got here quickly and close immediately, it's a health check
              const checkStart = Date.now();

              // Pipe data between client and SSH stream
              clientSocket.pipe(stream).pipe(clientSocket);

              clientSocket.on('error', (clientErr) => {
                clearTimeout(healthCheckTimeout);
                const duration = Date.now() - checkStart;
                if (duration > 100) {
                  this.logMessage(id, 'warning', `Client error: ${clientErr.message}`);
                }
                stream.end();
              });

              stream.on('error', (streamErr) => {
                clearTimeout(healthCheckTimeout);
                const duration = Date.now() - checkStart;
                if (duration > 100) {
                  this.logMessage(id, 'warning', `Stream error: ${streamErr.message}`);
                }
                clientSocket.end();
              });

              clientSocket.on('close', () => {
                const duration = Date.now() - checkStart;
                if (duration < 100) {
                  isHealthCheck = true;
                }
                stream.end();
              });

              stream.on('close', () => {
                clientSocket.end();
              });
            }
          );
        });

        server.on('error', (serverErr) => {
          this.logMessage(id, 'error', `Server error: ${serverErr.message}`);
          tunnel.status = 'error';
          tunnel.error = serverErr.message;
          this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(id) });
          reject(serverErr);
        });

        server.listen(localPort, '127.0.0.1', () => {
          tunnel.status = 'connected';
          tunnel.server = server;
          tunnel.reconnectAttempts = 0; // Reset reconnect counter on successful connection
          tunnel.error = null; // Clear any previous errors
          this.logMessage(id, 'success', `Tunnel active: localhost:${localPort} -> ${remoteHost}:${remotePort}`);

          // Update database with connected status
          this.saveTunnelToDb(id);

          this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(id) });
          resolve(this.getTunnelInfo(id));
        });
      });

      conn.on('error', (err) => {
        this.logMessage(id, 'error', `SSH connection error: ${err.message}`);
        tunnel.status = 'error';
        tunnel.error = err.message;
        this.saveTunnelToDb(id);
        this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(id) });
        reject(err);
      });

      conn.on('close', (hadError) => {
        // Check if this is an intentional closure
        if (tunnel.isClosingIntentionally) {
          this.logMessage(id, 'info', 'SSH connection closed');
          tunnel.status = 'disconnected';
          tunnel.error = null;
          tunnel.isClosingIntentionally = false; // Reset flag
        } else {
          // Unintentional closure - treat as error
          this.logMessage(id, 'warning', `SSH connection closed${hadError ? ' with error' : ''}`);
          tunnel.status = 'error';
          tunnel.error = hadError ? 'Connection closed with error' : 'Connection closed unexpectedly';
        }

        // Close local server if it exists
        if (tunnel.server) {
          try {
            tunnel.server.close();
          } catch (e) {}
        }

        this.saveTunnelToDb(id);
        this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(id) });

        // Auto-reconnect logic (only for unintentional closures)
        if (!tunnel.isClosingIntentionally && tunnel.autoReconnect && tunnel.reconnectAttempts < tunnel.maxReconnectAttempts) {
          tunnel.reconnectAttempts++;
          const delay = tunnel.reconnectDelay || 3000; // Fixed 3 second delay
          this.logMessage(id, 'warning', `Attempting to reconnect in ${delay/1000}s (${tunnel.reconnectAttempts}/${tunnel.maxReconnectAttempts})...`);

          tunnel.reconnectTimeout = setTimeout(() => {
            this.reconnectTunnel(id);
          }, delay);
        } else if (tunnel.autoReconnect && tunnel.reconnectAttempts >= tunnel.maxReconnectAttempts) {
          this.logMessage(id, 'error', `Max reconnection attempts (${tunnel.maxReconnectAttempts}) reached. Stopping auto-reconnect.`);
          tunnel.autoReconnect = false;
        }
      });

      // Additional event listeners for better connection monitoring
      conn.on('end', () => {
        this.logMessage(id, 'info', 'SSH connection ended by remote');
      });

      conn.on('timeout', () => {
        this.logMessage(id, 'error', 'SSH connection timeout');
        tunnel.status = 'error';
        tunnel.error = 'Connection timeout';
        this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(id) });
      });

      // Connect options with keepalive to detect dead connections
      const connectOptions = {
        host: sshHost,
        port: sshPort || 22,
        username: sshUser,
        keepaliveInterval: 5000, // Send keepalive every 5 seconds
        keepaliveCountMax: 3,    // Consider dead after 3 missed keepalives (15s total)
        readyTimeout: 20000      // Initial connection timeout
      };

      if (sshKeyPath) {
        try {
          const privateKey = fs.readFileSync(sshKeyPath.replace('~', process.env.HOME));
          connectOptions.privateKey = privateKey;
          this.logMessage(id, 'info', 'Using SSH key authentication');
        } catch (err) {
          this.logMessage(id, 'error', `Failed to read SSH key: ${err.message}`);
          reject(new Error(`Failed to read SSH key: ${err.message}`));
          return;
        }
      } else if (sshPassword) {
        connectOptions.password = sshPassword;
        this.logMessage(id, 'info', 'Using password authentication');
      } else {
        this.logMessage(id, 'error', 'No authentication method provided');
        reject(new Error('No authentication method provided'));
        return;
      }

      this.logMessage(id, 'info', `Connecting to ${sshUser}@${sshHost}:${sshPort || 22}...`);
      conn.connect(connectOptions);
    });
  }

  saveTunnelToDb(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel || !tunnel.persistent) {
      return;
    }

    const tunnelData = {
      id: tunnel.id,
      name: tunnel.name,
      config: tunnel.config,
      status: tunnel.status,
      createdAt: tunnel.createdAt,
      autoReconnect: tunnel.autoReconnect,
      persistent: true
    };

    // Update or insert
    this.db.update(
      { id: tunnelId },
      tunnelData,
      { upsert: true },
      (err) => {
        if (err) {
          console.error('Failed to save tunnel to DB:', err);
        }
      }
    );
  }

  reconnectTunnel(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      return;
    }

    this.logMessage(tunnelId, 'info', `Reconnecting tunnel: ${tunnel.name}`);

    // Clean up existing connection objects before reconnecting
    if (tunnel.server) {
      try {
        tunnel.server.close();
      } catch (err) {
        // Ignore errors during cleanup
      }
    }

    if (tunnel.connection) {
      try {
        tunnel.connection.end();
      } catch (err) {
        // Ignore errors during cleanup
      }
    }

    tunnel.status = 'connecting';
    this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(tunnelId) });

    // Recreate tunnel with SAME ID to avoid duplication
    this.createTunnel({
      ...tunnel.config,
      name: tunnel.name,
      autoReconnect: tunnel.autoReconnect
    }, tunnelId).then(() => {
      this.logMessage(tunnelId, 'success', `Reconnection successful`);
    }).catch((err) => {
      this.logMessage(tunnelId, 'error', `Reconnection failed: ${err.message}`);
      tunnel.status = 'error';
      tunnel.error = err.message;
      this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(tunnelId) });
    });
  }

  closeTunnel(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      throw new Error('Tunnel not found');
    }

    this.logMessage(tunnelId, 'info', 'Closing tunnel...');

    // Clear reconnect timeout if exists
    if (tunnel.reconnectTimeout) {
      clearTimeout(tunnel.reconnectTimeout);
    }

    // Mark as intentional closure to prevent error status
    tunnel.isClosingIntentionally = true;

    // Disable auto-reconnect before closing
    tunnel.autoReconnect = false;

    // Close TCP server
    if (tunnel.server) {
      tunnel.server.close(() => {
        this.logMessage(tunnelId, 'info', 'Local server closed');
      });
    }

    // Close SSH connection
    if (tunnel.connection) {
      tunnel.connection.end();
    }

    tunnel.status = 'disconnected';

    // Save updated status to database (don't delete)
    this.saveTunnelToDb(tunnelId);

    this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(tunnelId) });
    this.logMessage(tunnelId, 'success', 'Tunnel closed');

    return { success: true, message: 'Tunnel closed' };
  }

  async startTunnel(tunnelId) {
    // Check if tunnel exists in database
    return new Promise((resolve, reject) => {
      this.db.findOne({ id: tunnelId }, async (err, tunnelData) => {
        if (err) {
          reject(new Error('Database error'));
          return;
        }

        if (!tunnelData) {
          reject(new Error('Tunnel not found'));
          return;
        }

        // Check if tunnel is already running
        const existingTunnel = this.tunnels.get(tunnelId);
        if (existingTunnel && existingTunnel.status !== 'disconnected' && existingTunnel.status !== 'error') {
          reject(new Error('Tunnel is already running or connecting'));
          return;
        }

        // If tunnel exists in memory but is disconnected, clean it up first
        if (existingTunnel) {
          this.tunnels.delete(tunnelId);
        }

        // Start the tunnel with its saved configuration
        try {
          const result = await this.createTunnel({
            ...tunnelData.config,
            name: tunnelData.name
          }, tunnelId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async updateTunnel(tunnelId, updates) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ id: tunnelId }, async (err, tunnelData) => {
        if (err) {
          reject(new Error('Database error'));
          return;
        }

        if (!tunnelData) {
          reject(new Error('Tunnel not found'));
          return;
        }

        // Check if tunnel is currently connected
        const existingTunnel = this.tunnels.get(tunnelId);
        if (existingTunnel && existingTunnel.status === 'connected') {
          reject(new Error('Cannot update a connected tunnel. Please stop it first.'));
          return;
        }

        // Update tunnel data
        const updatedConfig = {
          ...tunnelData.config,
          sshHost: updates.sshHost || tunnelData.config.sshHost,
          sshPort: updates.sshPort || tunnelData.config.sshPort,
          sshUser: updates.sshUser || tunnelData.config.sshUser,
          sshPassword: updates.sshPassword !== undefined ? updates.sshPassword : tunnelData.config.sshPassword,
          sshKeyPath: updates.sshKeyPath !== undefined ? updates.sshKeyPath : tunnelData.config.sshKeyPath,
          localPort: updates.localPort || tunnelData.config.localPort,
          remoteHost: updates.remoteHost || tunnelData.config.remoteHost,
          remotePort: updates.remotePort || tunnelData.config.remotePort,
          autoReconnect: updates.autoReconnect !== undefined ? updates.autoReconnect : tunnelData.config.autoReconnect
        };

        const updatedTunnelData = {
          id: tunnelId,
          name: updates.name || tunnelData.name,
          config: updatedConfig,
          status: 'disconnected',
          createdAt: tunnelData.createdAt,
          autoReconnect: updates.autoReconnect !== undefined ? updates.autoReconnect : tunnelData.autoReconnect,
          persistent: true
        };

        // Update in database
        this.db.update(
          { id: tunnelId },
          updatedTunnelData,
          {},
          (err) => {
            if (err) {
              reject(new Error('Failed to update tunnel in database'));
              return;
            }

            // Update in memory if exists
            if (existingTunnel) {
              existingTunnel.name = updatedTunnelData.name;
              existingTunnel.config = updatedConfig;
              existingTunnel.autoReconnect = updatedTunnelData.autoReconnect;
            } else {
              // If not in memory, add it as disconnected
              this.tunnels.set(tunnelId, {
                id: tunnelId,
                name: updatedTunnelData.name,
                config: updatedConfig,
                status: 'disconnected',
                createdAt: updatedTunnelData.createdAt,
                logs: [],
                autoReconnect: updatedTunnelData.autoReconnect,
                reconnectAttempts: 0,
                persistent: true
              });
            }

            this.broadcast({ type: 'tunnel_update', data: this.getTunnelInfo(tunnelId) });
            resolve(this.getTunnelInfo(tunnelId));
          }
        );
      });
    });
  }

  async checkTunnelStatus(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);

    if (!tunnel) {
      throw new Error('Tunnel not found');
    }

    const statusInfo = {
      id: tunnel.id,
      name: tunnel.name,
      status: tunnel.status,
      isConnected: tunnel.status === 'connected',
      hasError: tunnel.status === 'error',
      error: tunnel.error,
      autoReconnect: tunnel.autoReconnect,
      reconnectAttempts: tunnel.reconnectAttempts || 0,
      maxReconnectAttempts: tunnel.maxReconnectAttempts || 100,
      reconnectDelay: tunnel.reconnectDelay || 3000,
      uptime: tunnel.status === 'connected' && tunnel.createdAt ?
        Math.floor((Date.now() - new Date(tunnel.createdAt).getTime()) / 1000) : 0,
      config: {
        localPort: tunnel.config.localPort,
        remoteHost: tunnel.config.remoteHost,
        remotePort: tunnel.config.remotePort,
        sshHost: tunnel.config.sshHost
      }
    };

    // Test if SSH connection is alive
    if (tunnel.connection && tunnel.status === 'connected') {
      statusInfo.sshConnectionAlive = !tunnel.connection._sock?.destroyed;
    } else {
      statusInfo.sshConnectionAlive = false;
    }

    // Test if local port is listening
    if (tunnel.server && tunnel.status === 'connected') {
      statusInfo.localPortListening = tunnel.server.listening;
    } else {
      statusInfo.localPortListening = false;
    }

    // Test end-to-end connectivity
    if (tunnel.status === 'connected') {
      try {
        statusInfo.remoteEndpointReachable = await this.testRemoteConnection(tunnel);

        if (statusInfo.sshConnectionAlive && statusInfo.localPortListening && statusInfo.remoteEndpointReachable) {
          this.logMessage(tunnelId, 'success', 'Health check: All systems operational (SSH ✓, Local Port ✓, Remote Endpoint ✓)');
        } else {
          const issues = [];
          if (!statusInfo.sshConnectionAlive) issues.push('SSH ✗');
          if (!statusInfo.localPortListening) issues.push('Local Port ✗');
          if (!statusInfo.remoteEndpointReachable) issues.push('Remote Endpoint ✗');
          this.logMessage(tunnelId, 'warning', `Health check: Issues detected (${issues.join(', ')})`);
        }
      } catch (err) {
        statusInfo.remoteEndpointReachable = false;
        statusInfo.healthWarning = `Remote endpoint test failed: ${err.message}`;
        this.logMessage(tunnelId, 'error', `Health check failed: ${err.message}`);
      }
    } else {
      statusInfo.remoteEndpointReachable = false;
    }

    this.broadcast({
      type: 'tunnel_health_check',
      data: statusInfo
    });

    return statusInfo;
  }

  deleteTunnel(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (tunnel) {
      // Close tunnel first if it's active
      if (tunnel.status !== 'disconnected') {
        this.closeTunnel(tunnelId);
      }

      // Remove from memory
      this.tunnels.delete(tunnelId);
    }

    // Remove from database
    this.db.remove({ id: tunnelId }, {}, (err) => {
      if (err) {
        console.error('Failed to remove tunnel from DB:', err);
      }
    });

    this.broadcast({ type: 'tunnel_removed', data: { id: tunnelId } });

    return { success: true, message: 'Tunnel deleted' };
  }

  async loadTunnelsFromDb() {
    return new Promise((resolve, reject) => {
      this.db.find({ persistent: true }, (err, tunnels) => {
        if (err) {
          console.error('Failed to load tunnels:', err);
          reject(err);
          return;
        }

        console.log(`Loading ${tunnels.length} tunnel(s) from database...`);

        // Load tunnels into memory without connecting them
        for (const tunnelData of tunnels) {
          const tunnel = {
            id: tunnelData.id,
            name: tunnelData.name,
            config: tunnelData.config,
            status: 'disconnected', // Always start as disconnected
            createdAt: tunnelData.createdAt,
            logs: [],
            autoReconnect: tunnelData.autoReconnect || false,
            reconnectAttempts: 0,
            persistent: true
          };

          this.tunnels.set(tunnelData.id, tunnel);
          console.log(`Loaded tunnel: ${tunnelData.name} (disconnected)`);
        }

        resolve(tunnels.length);
      });
    });
  }

  async restoreTunnels() {
    return new Promise((resolve, reject) => {
      this.db.find({ persistent: true }, async (err, tunnels) => {
        if (err) {
          console.error('Failed to restore tunnels:', err);
          reject(err);
          return;
        }

        console.log(`Restoring ${tunnels.length} persistent tunnel(s)...`);

        for (const tunnelData of tunnels) {
          try {
            console.log(`Restoring tunnel: ${tunnelData.name}`);
            await this.createTunnel({
              ...tunnelData.config,
              name: tunnelData.name
            }, tunnelData.id);
          } catch (err) {
            console.error(`Failed to restore tunnel ${tunnelData.name}:`, err.message);
          }
        }

        resolve(tunnels.length);
      });
    });
  }

  getTunnelInfo(tunnelId) {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      return null;
    }

    return {
      id: tunnel.id,
      name: tunnel.name,
      config: tunnel.config,
      status: tunnel.status,
      createdAt: tunnel.createdAt,
      error: tunnel.error,
      logs: tunnel.logs || [],
      autoReconnect: tunnel.autoReconnect || false,
      reconnectAttempts: tunnel.reconnectAttempts || 0,
      maxReconnectAttempts: tunnel.maxReconnectAttempts || 100,
      reconnectDelay: tunnel.reconnectDelay || 3000
    };
  }

  getAllTunnels() {
    return Array.from(this.tunnels.values()).map(tunnel => ({
      id: tunnel.id,
      name: tunnel.name,
      config: tunnel.config,
      status: tunnel.status,
      createdAt: tunnel.createdAt,
      error: tunnel.error,
      logs: tunnel.logs || [], // All logs
      autoReconnect: tunnel.autoReconnect || false,
      reconnectAttempts: tunnel.reconnectAttempts || 0,
      maxReconnectAttempts: tunnel.maxReconnectAttempts || 100,
      reconnectDelay: tunnel.reconnectDelay || 3000
    }));
  }

  getSavedTunnels() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  }

  deleteSavedTunnel(tunnelId) {
    return new Promise((resolve, reject) => {
      this.db.remove({ id: tunnelId }, {}, (err, numRemoved) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
  }

  closeAll() {
    // Stop health check monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('Health check monitoring stopped');
    }

    // Close all tunnels
    this.tunnels.forEach((tunnel, tunnelId) => {
      try {
        this.closeTunnel(tunnelId);
      } catch (err) {
        console.error(`Error closing tunnel ${tunnelId}:`, err);
      }
    });
  }
}

module.exports = TunnelManager;