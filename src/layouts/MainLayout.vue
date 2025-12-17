<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Real-time Collaboration Board </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

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

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

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

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
