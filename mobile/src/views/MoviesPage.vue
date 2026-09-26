<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Catálogo de Películas</ion-title>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-searchbar
          placeholder="Buscar película por nombre..."
          :debounce="350"
          animated
          @ionInput="handleSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Catálogo de Películas</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Recarga deslizando hacia abajo (Pull-to-refresh) -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content pulling-text="Desliza para actualizar..."></ion-refresher-content>
      </ion-refresher>

      <!-- Indicador de carga inicial -->
      <div v-if="loading && movies.length === 0" class="state-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando películas...</p>
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="state-container">
        <ion-icon :icon="alertCircleOutline" class="state-icon danger"></ion-icon>
        <p>{{ error }}</p>
        <ion-button fill="outline" size="small" @click="fetchInitialMovies">
          Reintentar
        </ion-button>
      </div>

      <!-- Estado vacío si no hay coincidencias -->
      <div v-else-if="movies.length === 0" class="state-container">
        <ion-icon :icon="filmOutline" class="state-icon"></ion-icon>
        <p>No se encontraron películas.</p>
      </div>

      <!-- Listado de tarjetas de películas -->
      <div v-else class="movies-list">
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          :can-edit="true"
          @delete="confirmDeleteMovie"
          @edit="handleEditMovie"
        />
      </div>

      <!-- Scroll Infinito nativo de Ionic -->
      <ion-infinite-scroll
        :disabled="isInfiniteDisabled"
        @ionInfinite="handleInfiniteScroll($event)"
      >
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="Cargando más películas..."
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonIcon,
  IonButton,
  alertController,
  toastController,
  type InfiniteScrollCustomEvent,
  type RefresherCustomEvent,
  type SearchbarCustomEvent,
} from '@ionic/vue';
import { filmOutline, alertCircleOutline } from 'ionicons/icons';
import MovieCard from '../components/MovieCard.vue';
import api from '../services/api';
import type { Movie, PaginationMeta } from '../types/movie';

const movies = ref<Movie[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const searchQuery = ref<string>('');
const page = ref<number>(1);
const limit = 8;
const meta = ref<PaginationMeta>({
  total: 0,
  page: 1,
  limit: 8,
  totalPages: 1,
});
const isInfiniteDisabled = ref<boolean>(false);

const fetchMovies = async (append = false) => {
  if (!append) {
    loading.value = true;
    error.value = null;
  }

  try {
    const params: { page: number; limit: number; search?: string } = {
      page: page.value,
      limit,
    };
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    const { data } = await api.get('/movies', { params });

    if (append) {
      movies.value = [...movies.value, ...data.data];
    } else {
      movies.value = data.data;
    }

    meta.value = data.meta;

    if (page.value >= meta.value.totalPages) {
      isInfiniteDisabled.value = true;
    } else {
      isInfiniteDisabled.value = false;
    }
  } catch (err) {
    console.error('Error al cargar películas:', err);
    error.value = 'Ocurrió un error al cargar las películas.';
  } finally {
    loading.value = false;
  }
};

const fetchInitialMovies = () => {
  page.value = 1;
  isInfiniteDisabled.value = false;
  fetchMovies(false);
};

// Tarea 3: Manejo de búsqueda por nombre con evento @ionInput
const handleSearch = (event: SearchbarCustomEvent) => {
  const query = event.detail.value ?? '';
  searchQuery.value = query;
  page.value = 1;
  isInfiniteDisabled.value = false;
  fetchMovies(false);
};

// Tarea 4: Paginación con Scroll Infinito según especificaciones de Ionic
const handleInfiniteScroll = async (event: InfiniteScrollCustomEvent) => {
  if (page.value >= meta.value.totalPages) {
    event.target.disabled = true;
    event.target.complete();
    return;
  }

  page.value++;

  try {
    const params: { page: number; limit: number; search?: string } = {
      page: page.value,
      limit,
    };
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    const { data } = await api.get('/movies', { params });
    movies.value = [...movies.value, ...data.data];
    meta.value = data.meta;
  } catch (err) {
    console.error('Error al solicitar siguiente página:', err);
  } finally {
    event.target.complete();
    if (page.value >= meta.value.totalPages) {
      event.target.disabled = true;
      isInfiniteDisabled.value = true;
    }
  }
};

// Recarga deslizando hacia abajo
const handleRefresh = async (event: RefresherCustomEvent) => {
  page.value = 1;
  isInfiniteDisabled.value = false;
  await fetchMovies(false);
  event.target.complete();
};

// Tarea 5: Flujo de Eliminación con ion-alert nativo
const confirmDeleteMovie = async (movie: Movie) => {
  const alert = await alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar "${movie.nombre}"?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          deleteMovie(movie.id);
        },
      },
    ],
  });

  await alert.present();
};

const deleteMovie = async (id: number) => {
  try {
    await api.delete(`/movies/${id}`);
    movies.value = movies.value.filter((m) => m.id !== id);

    const toast = await toastController.create({
      message: 'Película eliminada correctamente',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  } catch (err) {
    console.error('Error al eliminar película:', err);
    const toast = await toastController.create({
      message: 'No se pudo eliminar la película.',
      duration: 2500,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
};

const handleEditMovie = (movie: Movie) => {
  console.log('Editar película (preparado para modal de Daniel):', movie);
};

onMounted(() => {
  fetchInitialMovies();
});
</script>

<style scoped>
.movies-list {
  padding: 8px 4px 24px 4px;
  max-width: 680px;
  margin: 0 auto;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--ion-color-step-600, #666);
}

.state-icon {
  font-size: 54px;
  margin-bottom: 12px;
  color: var(--ion-color-step-400, #999);
}

.state-icon.danger {
  color: var(--ion-color-danger, #eb445a);
}
</style>
