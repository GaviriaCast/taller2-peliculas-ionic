<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/movies" text="Catálogo"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ movie?.nombre ?? 'Película' }}</ion-title>
        <ion-buttons v-if="auth.isAuthenticated && movie" slot="end">
          <ion-button aria-label="Editar" @click="openEdit">
            <ion-icon slot="icon-only" :icon="createOutline"></ion-icon>
          </ion-button>
          <ion-button aria-label="Eliminar" @click="confirmDelete">
            <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content pulling-text="Desliza para actualizar..."></ion-refresher-content>
      </ion-refresher>

      <div v-if="loading && !movie" class="state-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando película...</p>
      </div>

      <div v-else-if="error" class="state-container">
        <ion-icon :icon="alertCircleOutline" class="state-icon danger"></ion-icon>
        <p>{{ error }}</p>
        <ion-button fill="outline" size="small" @click="fetchMovie">Reintentar</ion-button>
      </div>

      <template v-else-if="movie">
        <div class="hero">
          <img
            class="hero-backdrop"
            :src="posterSrc"
            alt=""
            aria-hidden="true"
          />
          <img
            class="hero-poster"
            :src="posterSrc"
            :alt="movie.nombre"
            @error="posterFailed = true"
          />
        </div>

        <div class="detail">
          <h1>{{ movie.nombre }}</h1>

          <div class="chips">
            <ion-chip v-if="movie.anio" color="primary">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <ion-label>{{ movie.anio }}</ion-label>
            </ion-chip>
            <ion-chip v-if="movie.genero" color="secondary">
              <ion-icon :icon="pricetagOutline"></ion-icon>
              <ion-label>{{ movie.genero }}</ion-label>
            </ion-chip>
          </div>

          <ion-list lines="none" class="info-list">
            <ion-item v-if="movie.director">
              <ion-icon slot="start" :icon="videocamOutline"></ion-icon>
              <ion-label>
                <p>Director</p>
                <h2>{{ movie.director }}</h2>
              </ion-label>
            </ion-item>
          </ion-list>

          <section class="synopsis">
            <h2>Sinopsis</h2>
            <p>{{ movie.sinopsis || 'Esta película todavía no tiene sinopsis.' }}</p>
          </section>

          <ion-button
            v-if="!auth.isAuthenticated"
            expand="block"
            fill="outline"
            :router-link="`/login?redirect=/movies/${movie.id}`"
            class="login-hint"
          >
            <ion-icon slot="start" :icon="logInOutline"></ion-icon>
            Inicia sesión para editar
          </ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonIcon,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  alertController,
  modalController,
  toastController,
  type RefresherCustomEvent,
} from '@ionic/vue';
import {
  alertCircleOutline,
  calendarOutline,
  createOutline,
  logInOutline,
  pricetagOutline,
  trashOutline,
  videocamOutline,
} from 'ionicons/icons';
import MovieForm from '../components/MovieForm.vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useMovieChangesStore } from '../stores/movies';
import type { Movie } from '../types/movie';
import { getErrorMessage } from '../utils/errors';

const PLACEHOLDER = 'https://placehold.co/500x750/1e293b/ffffff?text=Sin+Imagen';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const changes = useMovieChangesStore();

const movie = ref<Movie | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const posterFailed = ref(false);

const posterSrc = computed(() =>
  !movie.value || posterFailed.value ? PLACEHOLDER : movie.value.imagen
);

const fetchMovie = async () => {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get<Movie>(`/movies/${id}`);
    movie.value = data;
    posterFailed.value = false;
  } catch (err) {
    error.value = getErrorMessage(err, 'No se pudo cargar la película.');
  } finally {
    loading.value = false;
  }
};

// Ionic reutiliza la página si se navega entre detalles: se recarga al cambiar el id
watch(() => route.params.id, fetchMovie, { immediate: true });

const handleRefresh = async (event: RefresherCustomEvent) => {
  await fetchMovie();
  event.target.complete();
};

const openEdit = async () => {
  if (!movie.value) return;
  const modal = await modalController.create({
    component: MovieForm,
    componentProps: { movie: movie.value },
  });
  await modal.present();

  const { data, role } = await modal.onWillDismiss<Movie>();
  if (role !== 'confirm' || !data) return;

  movie.value = data;
  posterFailed.value = false;
  changes.notifyUpdated(data);

  const toast = await toastController.create({
    message: 'Película actualizada correctamente',
    duration: 2000,
    color: 'success',
    position: 'bottom',
  });
  toast.present();
};

const confirmDelete = async () => {
  if (!movie.value) return;
  const current = movie.value;
  const alert = await alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar "${current.nombre}"?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          deleteMovie(current.id);
        },
      },
    ],
  });
  await alert.present();
};

const deleteMovie = async (id: number) => {
  try {
    await api.delete(`/movies/${id}`);
    changes.notifyDeleted(id);
    await router.replace('/movies');

    const toast = await toastController.create({
      message: 'Película eliminada correctamente',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    toast.present();
  } catch (err) {
    const toast = await toastController.create({
      message: getErrorMessage(err, 'No se pudo eliminar la película.'),
      duration: 2500,
      color: 'danger',
      position: 'bottom',
    });
    toast.present();
  }
};
</script>

<style scoped>
.hero {
  position: relative;
  height: 340px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(24px) brightness(0.55);
  transform: scale(1.2);
}

.hero-poster {
  position: relative;
  height: 290px;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.detail {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.detail h1 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 4px 0 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: -4px;
}

.info-list {
  background: transparent;
  margin: 8px -16px 0;
}

.synopsis h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 16px 0 6px;
}

.synopsis p {
  margin: 0;
  line-height: 1.55;
  color: var(--ion-text-color-step-200, #333);
}

.login-hint {
  margin-top: 28px;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--ion-text-color-step-400, #666);
}

.state-icon {
  font-size: 54px;
  margin-bottom: 12px;
}

.state-icon.danger {
  color: var(--ion-color-danger, #eb445a);
}
</style>
