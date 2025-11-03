const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class SSLServerManager {
  constructor() {
    this.db = new Datastore({
      filename: path.join(__dirname, '../data/ssl_servers.db'),
      autoload: true
    });

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Create a new SSL server configuration
  create(serverData) {
    return new Promise((resolve, reject) => {
      const server = {
        id: uuidv4(),
        name: serverData.name,
        host: serverData.host,
        port: serverData.port || 22,
        user: serverData.user,
        password: serverData.password || null,
        sshKeyPath: serverData.sshKeyPath || null,
        description: serverData.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.db.insert(server, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  }

  // Get all SSL servers
  getAll() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  }

  // Get a specific SSL server by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ id }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  }

  // Update an SSL server
  update(id, serverData) {
    return new Promise((resolve, reject) => {
      const updateData = {
        ...serverData,
        updatedAt: new Date()
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key =>
        updateData[key] === undefined && delete updateData[key]
      );

      this.db.update(
        { id },
        { $set: updateData },
        { returnUpdatedDocs: true },
        (err, numAffected, affectedDoc) => {
          if (err) reject(err);
          else if (numAffected === 0) reject(new Error('Server not found'));
          else resolve(affectedDoc);
        }
      );
    });
  }

  // Delete an SSL server
  delete(id) {
    return new Promise((resolve, reject) => {
      this.db.remove({ id }, {}, (err, numRemoved) => {
        if (err) reject(err);
        else if (numRemoved === 0) reject(new Error('Server not found'));
        else resolve({ success: true, message: 'Server deleted' });
      });
    });
  }

  // Test connection to an SSL server
  async testConnection(serverId) {
    const server = await this.getById(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    return new Promise((resolve, reject) => {
      const { Client } = require('ssh2');
      const conn = new Client();

      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          conn.end();
          reject(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout

      conn.on('ready', () => {
        connected = true;
        clearTimeout(timeout);
        conn.end();
        resolve({ success: true, message: 'Connection successful' });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      const connectOptions = {
        host: server.host,
        port: server.port,
        username: server.user
      };

      if (server.sshKeyPath) {
        try {
          const privateKey = fs.readFileSync(server.sshKeyPath.replace('~', process.env.HOME));
          connectOptions.privateKey = privateKey;
        } catch (err) {
          clearTimeout(timeout);
          reject(new Error(`Failed to read SSH key: ${err.message}`));
          return;
        }
      } else if (server.password) {
        connectOptions.password = server.password;
      } else {
        clearTimeout(timeout);
        reject(new Error('No authentication method provided'));
        return;
      }

      conn.connect(connectOptions);
    });
  }
}

module.exports = SSLServerManager;
