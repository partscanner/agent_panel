import { useEffect } from 'react';
import { socketClient } from '../services/socketClient';

export const useSocket = (event: string, callback: (...args: unknown[]) => void) => {
  useEffect(() => {
    socketClient.on(event, callback);

    return () => {
      socketClient.off(event, callback);
    };
  }, [event, callback]);
};

