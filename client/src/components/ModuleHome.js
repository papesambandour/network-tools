import React from 'react';
import { FaTerminal, FaLock, FaServer, FaNetworkWired, FaExchangeAlt } from 'react-icons/fa';
import './ModuleHome.css';

function ModuleHome({ onModuleSelect }) {
  const modules = [
    {
      id: 'ssh-tunnel',
      name: 'SSH Tunnel Manager',
      description: 'Create and manage SSH tunnels with port forwarding',
      icon: <FaTerminal />,
      available: true,
      color: 'green'
    },
    {
      id: 'reverse-proxy',
      name: 'Reverse Proxy Manager',
      description: 'Configure dynamic reverse proxy routes with backend support',
      icon: <FaExchangeAlt />,
      available: true,
      color: 'purple'
    },
    {
      id: 'ssl-certificate',
      name: 'SSL Certificate Manager',
      description: 'Generate and manage SSL certificates',
      icon: <FaLock />,
      available: false,
      color: 'blue',
      comingSoon: true
    },
    {
      id: 'server-monitor',
      name: 'Server Monitor',
      description: 'Monitor server resources and performance',
      icon: <FaServer />,
      available: false,
      color: 'yellow',
      comingSoon: true
    },
    {
      id: 'network-tools',
      name: 'Network Tools',
      description: 'Diagnostic tools for network analysis',
      icon: <FaNetworkWired />,
      available: false,
      color: 'cyan',
      comingSoon: true
    }
  ];

  return (
    <div className="module-home">
      <div className="module-home-header">
        <h1 className="glitch" data-text="CONTROL BOX">CONTROL BOX</h1>
        <p className="subtitle">SELECT A MODULE TO BEGIN</p>
      </div>

      <div className="modules-grid">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`module-box ${!module.available ? 'disabled' : ''} module-${module.color}`}
            onClick={() => module.available && onModuleSelect(module.id)}
          >
            <div className="module-icon">{module.icon}</div>
            <div className="module-info">
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              {module.comingSoon && (
                <span className="coming-soon-badge">COMING SOON</span>
              )}
              {module.available && (
                <span className="status-indicator">
                  <span className="status-dot"></span>
                  READY
                </span>
              )}
            </div>
            {module.available && (
              <div className="module-arrow">{'>'}</div>
            )}
          </div>
        ))}
      </div>

      <div className="home-footer">
        <div className="scan-line"></div>
        <p>SYSTEM OPERATIONAL - ALL MODULES ONLINE</p>
      </div>
    </div>
  );
}

export default ModuleHome;
