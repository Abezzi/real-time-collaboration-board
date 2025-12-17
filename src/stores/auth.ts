import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { LocalStorage } from 'quasar';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: number; username: string } | null,
    token: LocalStorage.getItem('token'),
  }),
  actions: {
    async register(username: string, password: string) {
      try {
        await api.post('/api/register', { username, password });
        // TODO: auto-login after register here
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    async login(username: string, password: string) {
      try {
        const { data } = await api.post('/api/login', { username, password });
        this.user = data.user;
        this.token = data.token;
        LocalStorage.set('token', data.token);
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      LocalStorage.remove('token');
    },
    getAuthHeader() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    },
  },
});
