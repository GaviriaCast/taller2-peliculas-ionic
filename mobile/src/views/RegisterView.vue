<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/login" text="Atrás"></ion-back-button>
        </ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="auth-wrapper">
        <div class="auth-heading">
          <ion-icon :icon="personAddOutline" class="auth-icon"></ion-icon>
          <h1>Regístrate</h1>
          <p>Crea tu cuenta para administrar el catálogo.</p>
        </div>

        <form @submit.prevent="handleRegister" novalidate>
          <ion-list lines="none" class="auth-list">
            <ion-item>
              <ion-input
                v-model="form.nombre"
                label="Nombre"
                label-placement="stacked"
                placeholder="Tu nombre completo"
                autocomplete="name"
                :maxlength="80"
                :class="{ 'ion-invalid': touched.nombre && !!errors.nombre, 'ion-touched': touched.nombre }"
                :error-text="errors.nombre"
                @ionBlur="touched.nombre = true"
              ></ion-input>
            </ion-item>

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
                autocomplete="new-password"
                :maxlength="72"
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
            <span v-else>Crear cuenta</span>
          </ion-button>
        </form>

        <p class="auth-footer">
          ¿Ya tienes cuenta?
          <router-link to="/login">Inicia sesión</router-link>
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
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
import { personAddOutline } from 'ionicons/icons';
import { useAuthStore } from '../stores/auth';
import { getErrorMessage } from '../utils/errors';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ nombre: '', email: '', password: '' });
const touched = reactive({ nombre: false, email: false, password: false });
const loading = ref(false);
const errorMsg = ref<string | null>(null);

const errors = computed(() => ({
  nombre: !form.nombre.trim() ? 'El nombre es obligatorio' : '',
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

const handleRegister = async () => {
  touched.nombre = true;
  touched.email = true;
  touched.password = true;
  if (errors.value.nombre || errors.value.email || errors.value.password) return;

  loading.value = true;
  errorMsg.value = null;
  try {
    await auth.register({
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    form.password = '';
    touched.password = false;

    await router.replace('/');

    const toast = await toastController.create({
      message: `Cuenta creada. ¡Bienvenido, ${auth.user?.nombre}!`,
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    toast.present();
  } catch (err) {
    errorMsg.value = getErrorMessage(err, 'No se pudo crear la cuenta. Intenta nuevamente.');
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
