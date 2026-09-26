<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/movies" text="Catálogo"></ion-back-button>
        </ion-buttons>
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content pulling-text="Desliza para actualizar..."></ion-refresher-content>
      </ion-refresher>

      <div class="profile-wrapper">
        <div class="avatar">{{ initials }}</div>
        <h1>{{ auth.user?.nombre }}</h1>
        <p class="email">{{ auth.user?.email }}</p>

        <ion-list inset>
          <ion-item>
            <ion-icon slot="start" :icon="personOutline"></ion-icon>
            <ion-label>
              <p>Nombre</p>
              <h2>{{ auth.user?.nombre }}</h2>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" :icon="mailOutline"></ion-icon>
            <ion-label>
              <p>Correo</p>
              <h2>{{ auth.user?.email }}</h2>
            </ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon slot="start" :icon="shieldCheckmarkOutline" color="success"></ion-icon>
            <ion-label>
              <p>Sesión</p>
              <h2>Token JWT guardado con Capacitor Preferences</h2>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-button expand="block" color="danger" fill="outline" @click="confirmLogout">
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
          Cerrar sesión
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  alertController,
  onIonViewWillEnter,
  type RefresherCustomEvent,
} from '@ionic/vue';
import {
  personOutline,
  mailOutline,
  shieldCheckmarkOutline,
  logOutOutline,
} from 'ionicons/icons';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const initials = computed(() =>
  (auth.user?.nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
);

// Cada vez que se entra a la vista se revalida el token con GET /auth/me
onIonViewWillEnter(() => {
  auth.fetchMe();
});

const handleRefresh = async (event: RefresherCustomEvent) => {
  await auth.fetchMe();
  event.target.complete();
};

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: 'Cerrar sesión',
    message: '¿Seguro que quieres salir de tu cuenta?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Salir',
        role: 'destructive',
        handler: async () => {
          await auth.logout();
          router.replace('/movies');
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
.profile-wrapper {
  max-width: 520px;
  margin: 0 auto;
  padding-top: 16px;
  text-align: center;
}

.avatar {
  width: 88px;
  height: 88px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  background: var(--ion-color-primary);
}

h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.email {
  margin: 4px 0 16px;
  color: var(--ion-color-step-600, #666);
}

ion-list {
  text-align: left;
  margin-bottom: 24px;
}
</style>
