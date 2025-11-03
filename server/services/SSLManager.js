const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

class SSLManager {
  constructor() {
    this.certsDir = path.join(__dirname, '../certs');
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true });
    }
  }

  generateCertificate(options = {}) {
    const {
      commonName = 'localhost',
      countryName = 'US',
      stateName = 'State',
      localityName = 'City',
      organizationName = 'Organization',
      validityDays = 365
    } = options;

    // Generate key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + Math.floor(Math.random() * 1000000);

    const now = new Date();
    cert.validity.notBefore = now;
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(now.getDate() + validityDays);

    const attrs = [
      { name: 'commonName', value: commonName },
      { name: 'countryName', value: countryName },
      { shortName: 'ST', value: stateName },
      { name: 'localityName', value: localityName },
      { name: 'organizationName', value: organizationName }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // Add extensions
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2, // DNS
            value: commonName
          },
          {
            type: 7, // IP
            ip: '127.0.0.1'
          }
        ]
      }
    ]);

    // Self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Convert to PEM format
    const pemCert = forge.pki.certificateToPem(cert);
    const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

    // Save to files
    const timestamp = Date.now();
    const certFileName = `cert_${commonName}_${timestamp}.pem`;
    const keyFileName = `key_${commonName}_${timestamp}.pem`;

    const certPath = path.join(this.certsDir, certFileName);
    const keyPath = path.join(this.certsDir, keyFileName);

    fs.writeFileSync(certPath, pemCert);
    fs.writeFileSync(keyPath, pemKey);

    return {
      certificate: pemCert,
      privateKey: pemKey,
      certPath,
      keyPath,
      commonName,
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
      serialNumber: cert.serialNumber
    };
  }

  getAllCertificates() {
    const files = fs.readdirSync(this.certsDir);
    const certFiles = files.filter(f => f.startsWith('cert_') && f.endsWith('.pem'));

    return certFiles.map(certFile => {
      const certPath = path.join(this.certsDir, certFile);
      const pemCert = fs.readFileSync(certPath, 'utf8');

      try {
        const cert = forge.pki.certificateFromPem(pemCert);
        const commonName = cert.subject.getField('CN').value;

        return {
          fileName: certFile,
          certPath,
          keyPath: certPath.replace('cert_', 'key_'),
          commonName,
          validFrom: cert.validity.notBefore,
          validTo: cert.validity.notAfter,
          serialNumber: cert.serialNumber,
          isExpired: new Date() > cert.validity.notAfter
        };
      } catch (err) {
        console.error(`Error reading certificate ${certFile}:`, err);
        return null;
      }
    }).filter(cert => cert !== null);
  }

  getCertificate(fileName) {
    const certPath = path.join(this.certsDir, fileName);
    const keyPath = certPath.replace('cert_', 'key_');

    if (!fs.existsSync(certPath)) {
      throw new Error('Certificate not found');
    }

    const certificate = fs.readFileSync(certPath, 'utf8');
    const privateKey = fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8') : null;

    return { certificate, privateKey, certPath, keyPath };
  }

  deleteCertificate(fileName) {
    const certPath = path.join(this.certsDir, fileName);
    const keyPath = certPath.replace('cert_', 'key_');

    if (fs.existsSync(certPath)) {
      fs.unlinkSync(certPath);
    }

    if (fs.existsSync(keyPath)) {
      fs.unlinkSync(keyPath);
    }

    return { success: true, message: 'Certificate deleted' };
  }
}

module.exports = SSLManager;