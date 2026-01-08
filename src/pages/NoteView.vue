<template>
  <q-page class="">
    <h1>{{ name }}</h1>
    <h2>{{ count }}</h2>
    <q-btn label="click me" @click="count++" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const name = 'Alex';
const count = ref(0);
</script>
