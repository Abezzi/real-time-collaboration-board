<template>
  <q-layout view="lHh Lpr lFf">
    <!-- header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <!-- app title -->
        <q-toolbar-title> Real-time Collaboration Board </q-toolbar-title>

        <!-- user -->
        <div class="row items-center q-gutter-sm">
          <q-avatar color="secondary" text-color="white" size="md">
            {{ usernameInitial }}
          </q-avatar>

          <q-btn flat no-caps dense align="left" class="text-weight-medium">
            {{ authStore.user?.username || 'Guest' }}

            <q-menu anchor="bottom end" self="top end">
              <q-list style="min-width: 200px">
                <q-item>
                  <q-item-section>
                    Signed in as<br />
                    <strong>{{ authStore.user?.username || 'Guest' }}</strong>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section>Logout</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- left drawer layout -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essentials </q-item-label>
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />

        <q-item-label header> Reminders </q-item-label>
        <EssentialLink v-for="reminder in remindersList" :key="reminder.title" v-bind="reminder" />

        <q-item-label header> Preferences </q-item-label>
        <EssentialLink v-for="setting in settingList" :key="setting.title" v-bind="setting" />
      </q-list>
    </q-drawer>

    <!-- page container -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

// First letter for user avatar
const usernameInitial = computed(() => {
  const username = authStore.user?.username;
  // G is the fallback since the user can be 'guest' in future implementations
  return username ? username.charAt(0).toUpperCase() : 'G';
});

// Drawer toggle
const leftDrawerOpen = ref(false);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Logout handler
async function handleLogout() {
  authStore.logout();
  // notification
  $q.notify({
    type: 'positive',
    message: 'Logged out',
    position: 'top',
    timeout: 2000,
  });
  await router.push('/login');
}

const settingList: EssentialLinkProps[] = [
  {
    title: 'User',
    caption: 'Edit your Profile',
    icon: 'settings',
    link: '/setting/user',
  },
  {
    title: 'System',
    caption: 'General Configuration',
    icon: 'build',
    link: '/setting/system',
  },
];

const remindersList: EssentialLinkProps[] = [
  {
    title: 'Alarm',
    caption: 'Notifications',
    icon: 'notifications',
    link: '/reminder/alarm',
  },
  {
    title: 'Calendar',
    caption: 'Check Notes On The Calendar',
    icon: 'calendar_month',
    link: '/reminder/calendar',
  },
];

const linksList: EssentialLinkProps[] = [
  {
    title: 'Home',
    caption: 'Home',
    icon: 'home',
    link: '/',
    exact: true,
  },
  {
    title: 'Boards',
    caption: 'Board',
    icon: 'developer_board',
    link: '/board',
  },
  {
    title: 'Notes',
    caption: 'Notes',
    icon: 'sticky_note_2',
    link: '/note',
  },
  {
    title: 'Chat Channel',
    caption: 'Team Conversations',
    icon: 'chat',
    link: '/chat',
  },
  {
    title: 'Teams',
    caption: 'Teams',
    icon: 'group',
    link: '/team',
  },
];
</script>
