// lib/socket.js
import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    socket = io(SOCKET_URL, {
      path: '/socket.io',
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