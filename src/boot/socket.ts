import { boot } from 'quasar/wrappers';
import { io } from 'socket.io-client';
import { useAuthStore } from 'src/stores/auth';

export default boot(({ app }) => {
  const authStore = useAuthStore();
  const socket = io('http://localhost:3000', {
    auth: { token: authStore.token },
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  app.provide('socket', socket);
});
