<template>
  <q-page class="flex flex-center">
    <q-card style="width: 400px">
      <q-card-section>
        <q-form @submit="onSubmit">
          <q-input v-model="username" label="Username" />
          <q-input v-model="password" label="Password" type="password" />
          <q-btn label="Login" type="submit" color="primary" />
          <q-btn label="Register" @click="onRegister" color="secondary" flat />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';

const authStore = useAuthStore();
const router = useRouter();
const username = ref('');
const password = ref('');

async function onSubmit() {
  try {
    await authStore.login(username.value, password.value);
    void router.push('/board');
  } catch (err) {
    console.error(err);
    Notify.create({ message: 'Login failed', color: 'negative' });
  }
}

async function onRegister() {
  try {
    await authStore.register(username.value, password.value);
    Notify.create({ message: 'Registered! Now login.', color: 'positive' });
  } catch (err) {
    console.error(err);
    Notify.create({ message: 'Registration failed', color: 'negative' });
  }
}
</script>
