import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export interface User {
  id: number;
  username: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
  },

  actions: {
    async register(username: string, password: string) {
      const { data } = await api.post('/api/register', { username, password });
      // TODO: login after register
      return data;
    },

    async login(username: string, password: string) {
      const { data } = await api.post('/api/login', { username, password });
      this.user = data.user;
      this.token = data.token;
    },

    logout() {
      this.user = null;
      this.token = null;
    },

    getAuthHeader() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    },
  },

  persist: true,
});
