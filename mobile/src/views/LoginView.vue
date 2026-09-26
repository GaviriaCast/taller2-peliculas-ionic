<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/movies" text="Catálogo"></ion-back-button>
        </ion-buttons>
        <ion-title>Iniciar sesión</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="auth-wrapper">
        <div class="auth-heading">
          <ion-icon :icon="filmOutline" class="auth-icon"></ion-icon>
          <h1>Bienvenido de nuevo</h1>
          <p>Ingresa para crear, editar y eliminar películas.</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate>
          <ion-list lines="none" class="auth-list">
            <ion-item>
              <ion-input
                v-model="form.email"
                type="email"
                label="Correo electrónico"
                label-placement="stacked"
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                inputmode="email"
                :class="{ 'ion-invalid': touched.email && !!errors.email, 'ion-touched': touched.email }"
                :error-text="errors.email"
                @ionBlur="touched.email = true"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-input
                v-model="form.password"
                type="password"
                label="Contraseña"
                label-placement="stacked"
                placeholder="Mínimo 6 caracteres"
                autocomplete="current-password"
                :class="{ 'ion-invalid': touched.password && !!errors.password, 'ion-touched': touched.password }"
                :error-text="errors.password"
                @ionBlur="touched.password = true"
              >
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
            </ion-item>
          </ion-list>

          <ion-text v-if="errorMsg" color="danger">
            <p class="server-error">{{ errorMsg }}</p>
          </ion-text>

          <ion-button type="submit" expand="block" class="submit-btn" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Entrar</span>
          </ion-button>
        </form>

        <p class="auth-footer">
          ¿No tienes cuenta?
          <router-link to="/registro">Regístrate</router-link>
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  toastController,
} from '@ionic/vue';
import { filmOutline } from 'ionicons/icons';
import { useAuthStore } from '../stores/auth';
import { getErrorMessage } from '../utils/errors';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const touched = reactive({ email: false, password: false });
const loading = ref(false);
const errorMsg = ref<string | null>(null);

const errors = computed(() => ({
  email: !form.email
    ? 'El correo es obligatorio'
    : !/^\S+@\S+\.\S+$/.test(form.email)
      ? 'Ingresa un correo válido'
      : '',
  password: !form.password
    ? 'La contraseña es obligatoria'
    : form.password.length < 6
      ? 'La contraseña debe tener al menos 6 caracteres'
      : '',
}));

const handleLogin = async () => {
  touched.email = true;
  touched.password = true;
  if (errors.value.email || errors.value.password) return;

  loading.value = true;
  errorMsg.value = null;
  try {
    await auth.login({ email: form.email.trim(), password: form.password });
    form.password = '';
    touched.password = false;

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);

    const toast = await toastController.create({
      message: `Hola, ${auth.user?.nombre}`,
      duration: 1800,
      color: 'success',
      position: 'bottom',
    });
    toast.present();
  } catch (err) {
    errorMsg.value = getErrorMessage(err, 'No se pudo iniciar sesión. Intenta nuevamente.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-wrapper {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 24px;
}

.auth-heading {
  text-align: center;
  margin-bottom: 24px;
}

.auth-heading h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 8px 0 4px;
}

.auth-heading p {
  margin: 0;
  color: var(--ion-color-step-600, #666);
}

.auth-icon {
  font-size: 56px;
  color: var(--ion-color-primary);
}

.auth-list {
  background: transparent;
}

.auth-list ion-item {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  margin-bottom: 12px;
}

.server-error {
  margin: 4px 4px 12px;
  font-size: 0.9rem;
}

.submit-btn {
  margin-top: 8px;
  height: 48px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--ion-color-step-600, #666);
}

.auth-footer a {
  color: var(--ion-color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
