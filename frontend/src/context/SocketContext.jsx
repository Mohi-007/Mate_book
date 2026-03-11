import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

import { API_BASE_URL } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });

      newSocket.on('user_online', (data) => {
        setOnlineUsers((prev) => new Set([...prev, data.user_id]));
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Clean up if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers(new Set());
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
