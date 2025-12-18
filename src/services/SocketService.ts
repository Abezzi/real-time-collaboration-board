import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Note } from 'src/types/socketEvents';
import { useAuthStore } from 'src/stores/auth';

class SocketService {
  // Properly typed socket with our custom events
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect() {
    const authStore = useAuthStore();

    this.socket = io('http://localhost:3000', {
      auth: { token: authStore.token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Global server error
    this.socket.on('server:error', (error: { message: string }) => {
      console.error('Server error:', error.message);
    });
  }

  // Join a board room and receive initial data
  joinBoard(boardId: number, onInitialNotes: (notes: Note[]) => void) {
    this.socket?.emit('joinBoard', boardId);
    this.socket?.on('initialNotes', onInitialNotes);
  }

  leaveBoard(boardId: number) {
    this.socket?.emit('leaveBoard', boardId);
  }

  // Generic emit — now correctly typed
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    this.socket?.emit(event, ...args);
  }

  // Generic listener
  on<K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]) {
    // this line is safe because we already constrain K to valid events, and always pass the correct listener type

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event, listener as any);
  }

  off<K extends keyof ServerToClientEvents>(event: K) {
    this.socket?.off(event);
  }

  // Convenience methods
  createNote(note: Parameters<ClientToServerEvents['note:create']>[0]) {
    this.emit('note:create', note);
  }

  updateNote(note: Parameters<ClientToServerEvents['note:update']>[0]) {
    this.emit('note:update', note);
  }

  deleteNote(data: Parameters<ClientToServerEvents['note:delete']>[0]) {
    this.emit('note:delete', data);
  }

  addComment(data: Parameters<ClientToServerEvents['note:comment']>[0]) {
    this.emit('note:comment', data);
  }
}

export const socketService = new SocketService();
