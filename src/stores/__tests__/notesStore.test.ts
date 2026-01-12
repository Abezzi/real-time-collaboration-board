import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '../notesStore';
import type { Note } from 'src/types/socketEvents';

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty notes array', () => {
    const store = useNotesStore();

    expect(store.notes).toEqual([]);
  });

  it('can add a note', () => {
    const store = useNotesStore();

    const newNote: Note = {
      id: 0,
      boardId: 0,
      title: '',
      content: '',
      x: 0,
      y: 0,
      zIndex: 1,
      color: '#fff59d',
      updatedBy: 0,
      updatedByUsername: '',
      comments: [],
    };

    store.addNote(newNote);

    expect(store.notes).toHaveLength(1);
    expect(store.notes[0]).toMatchObject(newNote);
  });

  it('can update note position (drag and drop)', () => {
    const store = useNotesStore();

    const newNote: Note = {
      id: 0,
      boardId: 0,
      title: '',
      content: '',
      x: 0,
      y: 0,
      zIndex: 1,
      color: '#fff59d',
      updatedBy: 0,
      updatedByUsername: '',
      comments: [],
    };

    const updatedNote: Note = {
      id: 0,
      boardId: 0,
      title: '',
      content: '',
      x: 100,
      y: 50,
      zIndex: 1,
      color: '#fff59d',
      updatedBy: 0,
      updatedByUsername: '',
      comments: [],
    };

    store.addNote(newNote);
    store.updateNote(updatedNote);
    expect(store.notes).toHaveLength(1);
    expect(store.notes[0]?.x).toBe(100);
    expect(store.notes[0]?.y).toBe(50);
  });

  it('can delete a note', () => {
    const store = useNotesStore();

    const newNote: Note = {
      id: 0,
      boardId: 0,
      title: '',
      content: '',
      x: 0,
      y: 0,
      zIndex: 1,
      color: '#fff59d',
      updatedBy: 0,
      updatedByUsername: '',
      comments: [],
    };

    store.addNote(newNote);
    expect(store.notes).toHaveLength(1);
    store.removeNote(0);
    expect(store.notes).toHaveLength(0);
    expect(store.notes).toEqual([]);
  });
});
