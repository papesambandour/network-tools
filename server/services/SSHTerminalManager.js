const { Client } = require('ssh2');
const fs = require('fs');

class SSHTerminalManager {
  constructor(io) {
    this.io = io;
    this.sessions = new Map();
    console.log('[SSHTerminalManager] Initializing SSH Terminal Manager');
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    console.log('[SSHTerminalManager] Setting up Socket.IO handlers');

    // Create a dedicated namespace for SSH terminals
    const sshNamespace = this.io.of('/ssh-terminal');

    sshNamespace.on('connection', (socket) => {
      const sessionId = socket.handshake.query.sessionId;
      console.log(`[SSHTerminalManager] SSH Terminal session connected: ${sessionId}, socket.id: ${socket.id}`);

      socket.on('ssh:connect', (config) => {
        console.log(`Received ssh:connect for session ${sessionId}:`, {
          host: config.host,
          port: config.port,
          username: config.username
        });
        this.connectSSH(socket, sessionId, config);
      });

      socket.on('ssh:data', (data) => {
        const session = this.sessions.get(sessionId);
        if (session && session.stream) {
          console.log(`Writing data to stream (${sessionId}):`, data.substring(0, 20));
          session.stream.write(data);
        } else {
          console.log(`No stream available for session ${sessionId}`);
        }
      });

      socket.on('ssh:resize', ({ rows, cols }) => {
        const session = this.sessions.get(sessionId);
        if (session && session.stream) {
          session.stream.setWindow(rows, cols, rows * 10, cols * 10);
        }
      });

      socket.on('disconnect', () => {
        console.log(`SSH Terminal session disconnected: ${sessionId}`);
        this.closeSession(sessionId);
      });
    });
  }

  connectSSH(socket, sessionId, config) {
    const { host, port = 22, username, password, privateKeyPath } = config;

    const conn = new Client();
    const session = {
      connection: conn,
      socket: socket,
      stream: null
    };

    this.sessions.set(sessionId, session);

    conn.on('ready', () => {
      console.log(`SSH connection ready for session: ${sessionId}`);

      conn.shell({
        term: 'xterm-256color',
        rows: 30,
        cols: 100
      }, (err, stream) => {
        if (err) {
          socket.emit('ssh:error', err.message);
          console.error(`Shell error for session ${sessionId}:`, err);
          return;
        }

        console.log(`Shell created for session: ${sessionId}`);
        session.stream = stream;

        // Emit ready only after shell is created
        socket.emit('ssh:ready');

        stream.on('data', (data) => {
          socket.emit('ssh:data', data.toString('utf-8'));
        });

        stream.on('close', () => {
          console.log(`SSH stream closed for session: ${sessionId}`);
          socket.emit('ssh:close');
          this.closeSession(sessionId);
        });

        stream.stderr.on('data', (data) => {
          socket.emit('ssh:data', data.toString('utf-8'));
        });
      });
    });

    conn.on('error', (err) => {
      console.error(`SSH connection error for session ${sessionId}:`, err);
      socket.emit('ssh:error', err.message);
      this.closeSession(sessionId);
    });

    conn.on('close', () => {
      console.log(`SSH connection closed for session: ${sessionId}`);
      socket.emit('ssh:close');
      this.closeSession(sessionId);
    });

    conn.on('end', () => {
      console.log(`SSH connection ended for session: ${sessionId}`);
    });

    // Build connection options
    const connectOptions = {
      host,
      port,
      username,
      keepaliveInterval: 5000,
      keepaliveCountMax: 3,
      readyTimeout: 20000
    };

    // Authentication
    if (privateKeyPath) {
      try {
        const privateKey = fs.readFileSync(privateKeyPath.replace('~', process.env.HOME));
        connectOptions.privateKey = privateKey;
        console.log(`Using SSH key authentication for ${username}@${host}`);
      } catch (err) {
        socket.emit('ssh:error', `Failed to read SSH key: ${err.message}`);
        return;
      }
    } else if (password) {
      connectOptions.password = password;
      console.log(`Using password authentication for ${username}@${host}`);
    } else {
      socket.emit('ssh:error', 'No authentication method provided');
      return;
    }

    try {
      conn.connect(connectOptions);
    } catch (err) {
      console.error(`Failed to connect SSH for session ${sessionId}:`, err);
      socket.emit('ssh:error', err.message);
      this.closeSession(sessionId);
    }
  }

  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.stream) {
        try {
          session.stream.close();
        } catch (e) {
          console.error(`Error closing stream for session ${sessionId}:`, e);
        }
      }

      if (session.connection) {
        try {
          session.connection.end();
        } catch (e) {
          console.error(`Error closing connection for session ${sessionId}:`, e);
        }
      }

      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} cleaned up`);
    }
  }

  closeAll() {
    console.log('Closing all SSH terminal sessions...');
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
  }
}

module.exports = SSHTerminalManager;