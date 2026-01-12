import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '../notesStore';

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty notes array', () => {
    const store = useNotesStore();

    expect(store.notes).toEqual([]);
  });
});
