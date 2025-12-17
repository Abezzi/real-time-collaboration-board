<template>
  <q-page class="q-pa-md">
    <!-- Create button -->
    <div class="row q-mb-md">
      <q-btn color="primary" icon="add" label="Create New Board" @click="showCreateDialog = true" />
    </div>

    <!-- table -->
    <q-table
      title="My Boards"
      :rows="boards"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="description" :props="props">
            {{ props.row.description || '-' }}
          </q-td>
          <q-td key="role" :props="props">
            <q-chip :color="roleColor(props.row.role)" text-color="white">
              {{ props.row.role }}
            </q-chip>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              color="primary"
              @click="viewBoard(props.row.id)"
            />
            <q-btn
              v-if="props.row.role === 'owner' || props.row.role === 'editor'"
              flat
              round
              dense
              icon="edit"
              color="secondary"
              @click="editBoard(props.row)"
            />
            <q-btn
              v-if="props.row.role === 'owner'"
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="deleteBoard(props.row.id)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- create dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="width: 500px; max-width: 80vw">
        <q-card-section>
          <div class="text-h6">Create New Board</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="createBoard">
            <q-input
              v-model="newBoard.name"
              label="Board Name"
              :rules="[(val) => !!val || 'Name is required']"
              autofocus
            />
            <q-input
              v-model="newBoard.description"
              label="Description"
              type="textarea"
              class="q-mt-md"
            />

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn type="submit" color="primary" label="Create" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="width: 700px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Edit Board</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="updateBoard">
            <q-input
              v-model="editForm.name"
              label="Board Name"
              :rules="[(val) => !!val || 'Name is required']"
            />
            <q-input
              v-model="editForm.description"
              label="Description"
              type="textarea"
              class="q-mt-md"
            />

            <!-- Collaborators section -->
            <div class="q-mt-lg">
              <div class="text-subtitle1 q-mb-md">Collaborators</div>

              <q-table
                :rows="editForm.collaborators"
                :columns="collaboratorColumns"
                row-key="userId"
                flat
                bordered
                hide-pagination
              >
                <template v-slot:body="colProps">
                  <q-tr :props="colProps">
                    <q-td key="username">{{ colProps.row.username }}</q-td>
                    <q-td key="role">
                      <q-select
                        v-model="colProps.row.role"
                        :options="roleOptions"
                        dense
                        outlined
                        emit-value
                      />
                    </q-td>
                    <q-td key="actions">
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click="removeCollaborator(colProps.row.userId)"
                      />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>

              <!-- Add new collaborator -->
              <div class="row q-mt-md q-gutter-md items-end">
                <q-input
                  v-model="newCollaborator.username"
                  label="Add user by username"
                  class="col"
                />
                <q-select
                  v-model="newCollaborator.role"
                  :options="roleOptions"
                  label="Role"
                  dense
                  outlined
                  style="width: 160px"
                />
                <q-btn
                  color="positive"
                  icon="person_add"
                  label="Add"
                  :disable="!newCollaborator.username"
                  @click="addCollaborator"
                />
              </div>
            </div>

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn type="submit" color="primary" label="Save Changes" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'boot/axios';

interface Board {
  id: number;
  name: string;
  description: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface Collaborator {
  userId: number;
  username: string;
  role: 'editor' | 'viewer';
}

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

// Data
const boards = ref<Board[]>([]);
const loading = ref(false);

const columns: QTableColumn[] = [
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'role', label: 'Your Role', field: 'role', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
];

const collaboratorColumns: QTableColumn[] = [
  { name: 'username', label: 'Username', field: 'username' },
  { name: 'role', label: 'Role', field: 'role' },
  { name: 'actions', label: '', field: () => '' },
];

const roleOptions = [
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

// Create dialog
const showCreateDialog = ref(false);
const newBoard = ref({ name: '', description: '' });

// Edit dialog
const showEditDialog = ref(false);
const editForm = ref<{
  id: number;
  name: string;
  description: string;
  collaborators: Collaborator[];
}>({
  id: 0,
  name: '',
  description: '',
  collaborators: [],
});

const newCollaborator = ref({ username: '', role: 'viewer' as 'editor' | 'viewer' });

// helpers
function roleColor(role: string) {
  switch (role) {
    case 'owner':
      return 'purple';
    case 'editor':
      return 'orange';
    case 'viewer':
      return 'blue';
    default:
      return 'grey';
  }
}

// API calls
async function fetchBoards() {
  loading.value = true;
  try {
    const { data } = await api.get('/api/boards');
    boards.value = data;
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to load boards' });
  } finally {
    loading.value = false;
  }
}

async function createBoard() {
  try {
    const { data } = await api.post('/api/boards', newBoard.value, {
      headers: authStore.getAuthHeader(),
    });
    boards.value.unshift({ ...data, role: 'owner' });
    showCreateDialog.value = false;
    newBoard.value = { name: '', description: '' };
    $q.notify({ type: 'positive', message: 'Board created successfully' });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to create board' });
  }
}

async function editBoard(board: Board) {
  editForm.value = {
    id: board.id,
    name: board.name,
    description: board.description || '',
    collaborators: [],
  };

  try {
    const { data } = await api.get(`/api/boards/${board.id}/collaborators`);
    editForm.value.collaborators = data;
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to load collaborators' });
  }

  showEditDialog.value = true;
}

function addCollaborator() {
  if (!newCollaborator.value.username.trim()) return;

  editForm.value.collaborators.push({
    userId: 0, // backend will resolve username → id
    username: newCollaborator.value.username.trim(),
    role: newCollaborator.value.role,
  });

  newCollaborator.value.username = '';
}

function removeCollaborator(userId: number) {
  editForm.value.collaborators = editForm.value.collaborators.filter((c) => c.userId !== userId);
}

async function updateBoard() {
  try {
    // Update board info
    await api.put(
      `/api/boards/${editForm.value.id}`,
      {
        name: editForm.value.name,
        description: editForm.value.description,
      },
      { headers: authStore.getAuthHeader() },
    );

    // Update collaborators (backend resolves usernames)
    await api.put(
      `/api/boards/${editForm.value.id}/collaborators`,
      { collaborators: editForm.value.collaborators },
      { headers: authStore.getAuthHeader() },
    );

    await fetchBoards();
    showEditDialog.value = false;
    $q.notify({ type: 'positive', message: 'Board updated successfully' });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to update board' });
  }
}

function deleteBoard(id: number) {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this board? This action cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void handleDeleteConfirmed(id);
  });
}

async function handleDeleteConfirmed(id: number) {
  try {
    await api.delete(`/api/boards/${id}`, {
      headers: authStore.getAuthHeader(),
    });
    boards.value = boards.value.filter((b) => b.id !== id);
    $q.notify({ type: 'positive', message: 'Board deleted' });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to delete board' });
  }
}

function viewBoard(id: number) {
  void router.push(`/board/${id}`);
}

onMounted(fetchBoards);
</script>
