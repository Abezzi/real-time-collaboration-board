<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" @click="$router.push('/board')" />
      <div class="text-h4 q-ml-md">{{ board.name || 'Loading...' }}</div>
      <q-space />
      <q-chip color="green" text-color="white" v-for="user in onlineUsers" :key="user">
        {{ user }} (online)
      </q-chip>
    </div>

    <!--
    <div>
      <h3>DEBUG</h3>
      <p>{{ notes }}</p>
      <p>{{ onlineUsers }}</p>
    </div>
    -->

    <div v-if="loading" class="flex flex-center" style="height: 60vh">
      <q-spinner color="primary" size="3em" />
    </div>

    <div
      v-else
      ref="canvasEl"
      class="board-canvas relative-position q-pa-md"
      style="height: 80vh; background: #f5f5f5; border-radius: 8px; overflow: auto"
    >
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-card absolute cursor-pointer shadow-4"
        :style="{
          left: `${draggingNote?.id === note.id ? draggedNotePosition.x : note.x}px`,
          top: `${draggingNote?.id === note.id ? draggedNotePosition.y : note.y}px`,
          zIndex: note.zIndex || 0,
          width: '250px',
          minHeight: '150px',
        }"
        :data-note-id="note.id"
        @mousedown="startDrag($event, note)"
        @dblclick="editNote(note)"
      >
        <q-card class="shadow-2 rounded-borders" :style="{ backgroundColor: note.color }">
          <q-card-section class="drag-handle">
            <div class="text-h6">{{ note.title }}</div>
            <div class="text-body2 q-mt-sm" v-html="note.content"></div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-list dense>
              <q-item v-for="comment in note.comments" :key="comment.id">
                <q-item-section>
                  <q-item-label caption>{{ comment.user }}: {{ comment.text }}</q-item-label>
                  <q-item-label caption class="text-grey-6">{{
                    new Date(comment.timestamp * 1000).toLocaleString()
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-input
            v-model="commentDrafts[note.id]"
            label="Add comment"
            dense
            class="q-pa-sm"
            @keyup.enter="addCommentToNote(note.id, commentDrafts[note.id] || '')"
          />
        </q-card>
      </div>

      <q-fab color="primary" icon="add" direction="up" class="absolute-bottom-right q-ma-lg">
        <q-fab-action color="secondary" icon="sticky_note_2" label="New Note" @click="createNote" />
      </q-fab>
    </div>

    <!-- Edit Modal (for title/content/color) -->
    <q-dialog v-model="showEditNote">
      <q-card style="width: 400px">
        <q-card-section>
          <!-- editing indicator -->
          <div
            class="text-caption text-grey"
            v-if="notesStore.notesBeingEdited.has(editingNote.id)"
          >
            <q-icon name="edit" size="xs" class="q-mr-xs" />
            Being edited by {{ notesStore.notesBeingEdited.get(editingNote.id) }}
            <span v-if="isNoteLockedByOtherUser" class="text-negative"> (you cannot edit)</span>
          </div>
          <q-input v-model="editingNote.title" label="Title" :disable="isNoteLockedByOtherUser" />
          <q-editor
            v-model="editingNote.content"
            min-height="200px"
            :disable="isNoteLockedByOtherUser"
          />
          <q-color v-model="editingNote.color" label="Color" :disable="isNoteLockedByOtherUser" />
        </q-card-section>
        <!-- actions/buttons -->
        <q-card-actions align="between">
          <q-btn
            v-if="currentUserRole === 'owner' || currentUserRole === 'editor'"
            flat
            color="negative"
            icon="delete"
            label="Delete"
            @click="confirmDelete = true"
            :disabled="isNoteLockedByOtherUser"
          />
          <div>
            <q-btn flat label="Cancel" v-close-popup @click="cancelEdit" />
            <q-btn
              color="primary"
              label="Save"
              @click="saveNoteEdit"
              :disabled="isNoteLockedByOtherUser"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirm Delete Dialog -->
    <q-dialog v-model="confirmDelete" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >Are you sure you want to delete this note? This cannot be undone.</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteNote" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useNotesStore } from 'src/stores/notesStore';
import { socketService } from 'src/services/SocketService';
import type { Note } from 'src/types/socketEvents';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

const route = useRoute();
const notesStore = useNotesStore();
const notes = computed(() => notesStore.notes);
const onlineUsers = computed(() => notesStore.onlineUsers);
const boardId = Number(route.params.id);
const board = ref({ name: '', description: '' });
const loading = ref(true);
const commentDrafts = reactive<Record<number, string>>({});
const showEditNote = ref(false);
const editingNote = ref<Note>({
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
});
const canvasEl = ref<HTMLElement | null>(null);
const draggingNote = ref<Note | null>(null);
const draggedNotePosition = reactive({ x: 0, y: 0 });
const offsetX = ref(0);
const offsetY = ref(0);
const currentUserRole = ref<'owner' | 'editor' | 'viewer'>('viewer');
const confirmDelete = ref(false);
const currentUsername = computed(() => notesStore.currentUsername);
const isNoteLockedByOtherUser = computed(() => {
  if (!editingNote.value.id) return false;
  const editor = notesStore.notesBeingEdited.get(editingNote.value.id);
  // not being edited
  if (!editor) return false;
  // locked by someone else
  return editor !== currentUsername.value;
});
const $q = useQuasar();

function deleteNote() {
  if (!editingNote.value.id) return;

  socketService.emit('note:delete', {
    noteId: editingNote.value.id,
    boardId,
  });

  showEditNote.value = false;
  confirmDelete.value = false;
}

async function fetchBoard() {
  const { data } = await api.get(`/api/boards/${boardId}`);
  console.log('board data: ', data);
  board.value = data.board;
  currentUserRole.value = data.role;
}

function createNote() {
  const note = {
    boardId,
    title: 'New Note',
    content: '',
    x: 100,
    y: 100,
    zIndex: notes.value.length,
    color: '#fff59d',
  };
  socketService.emit('note:create', note);
}

function startDrag(event: MouseEvent, note: Note) {
  // prevent drag if note has no real server id yet (avoids "Note not found")
  if (!note.id || note.id <= 0) return;

  draggingNote.value = note;

  const noteRect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  // calculate where user clicked relative to note's top-left
  offsetX.value = event.clientX - noteRect.left;
  offsetY.value = event.clientY - noteRect.top;

  // bring to front optimistically
  const maxZ = Math.max(...notes.value.map((n) => n.zIndex || 0), 0);
  note.zIndex = maxZ + 1;
  socketService.emit('note:update', { id: note.id, boardId, zIndex: note.zIndex });

  draggedNotePosition.x = note.x;
  draggedNotePosition.y = note.y;

  // avoid selection while dragging
  canvasEl.value?.classList.add('no-select');

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  if (!draggingNote.value || !canvasEl.value) return;

  const canvasRect = canvasEl.value.getBoundingClientRect();

  draggedNotePosition.x = Math.max(0, Math.round(event.clientX - canvasRect.left - offsetX.value));
  draggedNotePosition.y = Math.max(0, Math.round(event.clientY - canvasRect.top - offsetY.value));
}

function onMouseUp() {
  if (!draggingNote.value) return;

  const noteId = draggingNote.value.id;

  notesStore.updateNote({
    ...draggingNote.value,
    x: draggedNotePosition.x,
    y: draggedNotePosition.y,
  });

  socketService.emit('note:update', {
    id: noteId,
    boardId,
    x: draggedNotePosition.x,
    y: draggedNotePosition.y,
  });

  // re-enabling text selection
  canvasEl.value?.classList.remove('no-select');

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  draggingNote.value = null;
}

function editNote(note: Note) {
  const currentlyEditedBy = notesStore.notesBeingEdited.get(note.id);

  // someone else is editing, show warning and open read-only
  if (currentlyEditedBy && currentlyEditedBy !== notesStore.currentUsername) {
    $q.notify({
      type: 'warning',
      message: `This note is currently being edited by ${currentlyEditedBy}`,
      timeout: 4000,
    });

    editingNote.value = { ...note, comments: [...note.comments] };
    showEditNote.value = true;
    return;
  }

  // no one is editing
  editingNote.value = { ...note, comments: [...note.comments] };
  showEditNote.value = true;

  socketService.emit('note:edit:start', { noteId: note.id, boardId });
}

function saveNoteEdit() {
  const payload = {
    id: editingNote.value.id,
    boardId: boardId,
    title: editingNote.value.title,
    content: editingNote.value.content,
    color: editingNote.value.color,
  };

  socketService.emit('note:update', payload);

  if (isCurrentUserEditing(editingNote.value.id)) {
    socketService.emit('note:edit:end', { noteId: editingNote.value.id, boardId });
  }

  showEditNote.value = false;
}

function addCommentToNote(noteId: number, text: string) {
  if (!text.trim()) return;
  socketService.emit('note:comment', { noteId, boardId, text });
  commentDrafts[noteId] = '';
}

onMounted(async () => {
  console.log('🟢 onMounted - connecting socket');
  socketService.connect();
  console.log('🟢 Initializing store listeners');
  notesStore.initSocketListeners();
  console.log('🟢 Joining board:', boardId);
  socketService.joinBoard(boardId, (initialNotes: Note[]) => {
    console.log('🟢 Received initialNotes:', initialNotes.length, 'notes');
    notesStore.setNotes(initialNotes);
    loading.value = false;
  });
  await fetchBoard();
});

function isCurrentUserEditing(noteId: number): boolean {
  const editor = notesStore.notesBeingEdited.get(noteId);
  return editor === notesStore.currentUsername;
}

function cancelEdit() {
  // release note lock on cancel if the user is the one editing it
  if (isCurrentUserEditing(editingNote.value.id)) {
    socketService.emit('note:edit:end', { noteId: editingNote.value.id, boardId });
  }

  showEditNote.value = false;
}

onBeforeUnmount(() => {
  console.log('🔴 onBeforeUnmount - cleaning up');
  notesStore.cleanupSocketListeners();
  socketService.leaveBoard(boardId);
});
</script>
