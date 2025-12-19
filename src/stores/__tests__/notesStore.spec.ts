import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '../notesStore';
import type { Note } from 'src/types/socketEvents';
import { socketService } from 'src/services/SocketService';

// Mock
vi.mock('src/services/SocketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe('notesStore', () => {
  let store: ReturnType<typeof useNotesStore>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockOn = vi.mocked((socketService as any).on);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockOff = vi.mocked((socketService as any).off);

  // storing the actual listener functions here
  let createdListener: (note: Note) => void;
  let updatedListener: (note: Note) => void;
  let deletedListener: (data: { noteId: number }) => void;
  let editStartedListener: (data: { noteId: number; editedBy: string }) => void;
  let editEndedListener: (data: { noteId: number }) => void;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotesStore();

    // reset mocks
    mockOn.mockReset();
    mockOff.mockReset();

    // union of all listenre types to avoid listener:any
    type SocketListener =
      | ((note: Note) => void)
      | ((data: { noteId: number }) => void)
      | ((data: { noteId: number; editedBy: string }) => void)
      | ((users: string[]) => void)
      | ((err: { message: string }) => void);

    mockOn.mockImplementation((event: string, listener: SocketListener) => {
      switch (event) {
        case 'note:created':
          createdListener = listener as (note: Note) => void;
          break;
        case 'note:updated':
          updatedListener = listener as (note: Note) => void;
          break;
        case 'note:deleted':
          deletedListener = listener as (data: { noteId: number }) => void;
          break;
        case 'note:edit:started':
          editStartedListener = listener as (data: { noteId: number; editedBy: string }) => void;
          break;
        case 'note:edit:ended':
          editEndedListener = listener as (data: { noteId: number }) => void;
          break;
      }
      return socketService;
    });

    store.initSocketListeners();
  });

  it('adds a note when receiving note:created', () => {
    const newNote = {
      id: 1,
      boardId: 1,
      title: 'Test Note',
      content: 'Hello',
      x: 100,
      y: 100,
      zIndex: 1,
      color: '#fff59d',
      updatedBy: 12,
      updatedByUsername: 'Alice',
      comments: [],
    };

    createdListener(newNote);

    expect(store.notes).toHaveLength(1);
    expect(store.notes[0]).toMatchObject(newNote);
  });

  it('updates a note when receiving note:updated', () => {
    store.setNotes([
      {
        id: 1,
        boardId: 1,
        title: 'Old Title',
        content: 'Old',
        x: 100,
        y: 100,
        zIndex: 1,
        color: '#fff59d',
        updatedBy: 49,
        updatedByUsername: 'Homero',
        comments: [],
      },
    ]);

    const updatedNote = {
      id: 1,
      boardId: 1,
      title: 'New Title',
      content: 'Updated',
      x: 150,
      y: 200,
      zIndex: 2,
      color: '#ffeb3b',
      updatedBy: 49,
      updatedByUsername: 'Homero',
      comments: [],
    };

    updatedListener(updatedNote);

    expect(store.notes[0]?.title).toBe('New Title');
    expect(store.notes[0]?.x).toBe(150);
  });

  it('removes a note when receiving note:deleted', () => {
    store.setNotes([
      {
        id: 1,
        title: 'Note 1',
        content: '',
        x: 100,
        y: 100,
        zIndex: 1,
        color: '#fff59d',
        updatedBy: 29,
        updatedByUsername: 'Lisa',
        comments: [],
        boardId: 1,
      },
      {
        id: 2,
        title: 'Note 2',
        content: '',
        x: 200,
        y: 200,
        zIndex: 2,
        color: '#fff59d',
        updatedBy: 30,
        updatedByUsername: 'Bart',
        comments: [],
        boardId: 1,
      },
    ]);

    deletedListener({ noteId: 1 });

    expect(store.notes).toHaveLength(1);
    expect(store.notes[0]?.id).toBe(2);
  });

  it('tracks editing lock state correctly', () => {
    editStartedListener({ noteId: 5, editedBy: 'Bob' });
    expect(store.notesBeingEdited.get(5)).toBe('Bob');

    editEndedListener({ noteId: 5 });
    expect(store.notesBeingEdited.has(5)).toBe(false);
  });
});
