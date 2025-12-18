import { defineStore } from 'pinia';
import { socketService } from 'src/services/SocketService';
import type { Note, NoteComment } from 'src/types/socketEvents';
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from './auth';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const onlineUsers = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notesBeingEdited = reactive<Map<number, string>>(new Map());
  const authStore = useAuthStore();

  function setNotes(newNotes: Note[]) {
    notes.value = newNotes;
  }

  function addNote(note: Note) {
    notes.value.push(note);
  }

  function updateNote(updatedNote: Note) {
    const index = notes.value.findIndex((n) => n.id === updatedNote.id);

    if (index !== -1) {
      notes.value[index] = updatedNote;
    }
  }

  function removeNote(noteId: number) {
    notes.value = notes.value.filter((n) => n.id !== noteId);
  }

  function addComment(noteId: number, comment: NoteComment) {
    const note = notes.value.find((n) => n.id === noteId);

    if (note) {
      note.comments.push(comment);
    }
  }

  // socket listeners (call this when entering board)
  function initSocketListeners() {
    console.log('🔌 Initializing socket listeners for board');
    socketService.on('note:created', (note: Note) => {
      console.log('✅ Received note:created', note);
      addNote(note);
    });

    socketService.on('note:updated', (note: Note) => {
      console.log('✅ Received note:updated', note);
      updateNote(note);
    });

    socketService.on('note:deleted', ({ noteId }: { noteId: number }) => {
      console.log('✅ Received note:deleted', noteId);
      removeNote(noteId);
    });

    socketService.on(
      'note:commented',
      ({ noteId, newComment }: { noteId: number; newComment: NoteComment }) => {
        console.log('✅ Received note:commented', noteId, newComment);
        addComment(noteId, newComment);
      },
    );

    socketService.on('presence:users', (users: string[]) => {
      console.log('✅ Received presence:users', users);
      onlineUsers.value = users;
    });

    socketService.on('server:error', (err) => {
      console.error('❌ Server error:', err);
      error.value = err.message;
    });

    socketService.on(
      'note:edit:started',
      ({ noteId, editedBy }: { noteId: number; editedBy: string }) => {
        console.log('✏️Received note:edit:start');
        notesBeingEdited.set(noteId, editedBy);
      },
    );

    socketService.on('note:edit:ended', ({ noteId }: { noteId: number }) => {
      console.log('✏️Received note:edit:ended');
      notesBeingEdited.delete(noteId);
    });

    socketService.on(
      'note:edit:locked',
      ({ noteId, editedBy }: { noteId: number; editedBy: string }) => {
        console.log(`🔒 LOCKED, Note ${noteId} is being edited by ${editedBy}`);
      },
    );
  }

  // Cleanup when leaving board
  function cleanupSocketListeners() {
    socketService.off('note:created');
    socketService.off('note:updated');
    socketService.off('note:deleted');
    socketService.off('note:commented');
    socketService.off('presence:users');
    socketService.off('server:error');
  }

  return {
    notes,
    onlineUsers,
    loading,
    error,
    setNotes,
    addNote,
    updateNote,
    removeNote,
    addComment,
    initSocketListeners,
    cleanupSocketListeners,
    currentUsername: computed(() => authStore.user?.username),
    notesBeingEdited,
  };
});
