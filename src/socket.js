import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

socket.on('connect', () => {
  console.log('🔌 Connected to Live Sync Server');
});

socket.on('connect_error', (err) => {
  console.error('🔌 Live Sync Connection Error:', err.message);
});

export default socket;
