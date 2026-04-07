// lib/socket.js
import { io } from 'socket.io-client';

let socket;
let currentToken;

export async function getSocket(token) {
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

  if (!token) {
    throw new Error('Socket auth token required');
  }

  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    currentToken = token;
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('CONNECTED:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log('CONNECT ERROR:', err);
    });
  }
  return socket;
}
