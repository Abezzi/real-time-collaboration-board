<template>
  <q-page class="q-pa-md">
    <!-- Board Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" @click="$router.push('/board')" />
      <div class="text-h4 q-ml-md">{{ board.name || 'Loading...' }}</div>
      <q-space />
      <div class="text-subtitle1 text-grey-7">
        {{ board.description || 'No description' }}
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-center" style="height: 60vh">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Real-time Canvas -->
    <div
      v-else
      class="board-canvas relative-position"
      style="min-height: 80vh; background: #f5f5f5; border-radius: 8px; overflow: hidden"
    >
      <!-- Notes will be placed absolutely inside here -->
      <div class="absolute-full">
        <div
          v-for="note in notes"
          :key="note.id"
          class="note-card absolute"
          :style="{ left: note.x + 'px', top: note.y + 'px', zIndex: note.zIndex }"
        >
          <q-card class="shadow-4" style="width: 250px">
            <q-card-section>
              <div class="text-h6">{{ note.title }}</div>
              <div class="text-body2 q-mt-sm">{{ note.content }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Floating Add Button -->
      <q-fab
        color="primary"
        icon="add"
        direction="up"
        vertical-actions-align="right"
        class="absolute-bottom-right q-ma-lg"
      >
        <q-fab-action color="secondary" icon="sticky_note_2" label="New Note" @click="createNote" />
      </q-fab>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// import { onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
// import { useAuthStore } from 'src/stores/auth';

interface Board {
  id: number;
  name: string;
  description: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  x: number;
  y: number;
  zIndex: number;
  boardId: number;
}

const route = useRoute();
const $q = useQuasar();
// const authStore = useAuthStore();

const boardId = Number(route.params.id);

const board = ref<Board>({ id: boardId, name: '', description: '' });
const notes = ref<Note[]>([]);
const loading = ref(true);

// Fetch board info
async function fetchBoard() {
  try {
    const { data } = await api.get(`/api/boards/${boardId}`);
    board.value = data;
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to load board' });
  }
}

// Fetch notes (TODO: will use this later)
async function fetchNotes() {
  try {
    const { data } = await api.get(`/api/boards/${boardId}/notes`);
    notes.value = data;
  } catch (err) {
    // If endpoint not ready yet, just start empty
    console.error(err);
    notes.value = [];
  } finally {
    loading.value = false;
  }
}

function createNote() {
  // TODO: placeholder for now
  const newNote: Note = {
    // temporary client-side ID
    id: Date.now(),
    title: 'New Note',
    content: 'Click to edit...',
    x: Math.random() * 400 + 100,
    y: Math.random() * 300 + 100,
    zIndex: notes.value.length,
    boardId,
  };
  notes.value.push(newNote);
  $q.notify({ type: 'positive', message: 'New note created (local for now)' });
}

onMounted(async () => {
  await fetchBoard();
  await fetchNotes();
});
</script>

<style scoped>
.board-canvas {
  position: relative;
}

.note-card {
  transition: transform 0.2s;
}

.note-card:hover {
  transform: translateY(-4px);
}
</style>
