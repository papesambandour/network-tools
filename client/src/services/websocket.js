let ws = null;
let reconnectInterval = null;
let onLogCallback = null;
let onStatusCallback = null;

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws/tunnels';

export const connectWebSocket = (onLog, onStatus) => {
  onLogCallback = onLog;
  onStatusCallback = onStatus;

  const connect = () => {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      if (onStatusCallback) onStatusCallback('connected');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'log' && onLogCallback) {
          onLogCallback(data.data);
        } else if (data.type === 'tunnel_update') {
          // Handle tunnel updates
          console.log('Tunnel update:', data.data);
        } else if (data.type === 'connected') {
          console.log('Server message:', data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (onStatusCallback) onStatusCallback('disconnected');

      // Attempt to reconnect
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      }
    };
  };

  connect();
};

export const disconnectWebSocket = () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }
};

export const sendMessage = (message) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not connected');
  }
};
