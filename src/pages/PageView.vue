<template>
  <div class="text-h4 q-ml-md">{{ page.name || 'Loading...' }}</div>
  <!-- <q-page class="q-pa-md"> -->
  <!--   <q-input v-model="currentPage.name" label="Page Title" outlined class="q-mb-md" /> -->
  <!--   <q-btn label="Save" color="primary" @click="savePage" class="q-mt-md" /> -->
  <!-- </q-page> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'src/boot/axios';

const route = useRoute();
const pageId = Number(route.params.id);
const page = ref({ name: '', description: '' });
const currentUserRole = ref<'owner' | 'editor' | 'viewer'>('viewer');

onMounted(async () => {
  console.log('🟢 onMounted - connecting socket');
  // socketService.connect();
  // console.log('🟢 Initializing store listeners');
  // notesStore.initSocketListeners();
  // console.log('🟢 Joining board:', boardId);
  // socketService.joinBoard(boardId, (initialNotes: Note[]) => {
  //   console.log('🟢 Received initialNotes:', initialNotes.length, 'notes');
  //   notesStore.setNotes(initialNotes);
  //   loading.value = false;
  // });
  await fetchBoard();
});

// loads page data
async function fetchBoard() {
  const { data } = await api.get(`/api/pages/${pageId}`);
  console.log('page data: ', data);
  page.value = data.page;
  currentUserRole.value = data.role;
}
</script>
