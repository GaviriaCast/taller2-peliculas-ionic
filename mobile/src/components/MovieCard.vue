<template>
  <ion-card class="movie-card">
    <div class="poster-container">
      <img
        :src="movie.imagen"
        :alt="movie.nombre"
        class="poster-image"
        @error="handleImageError"
      />
      <div v-if="movie.anio" class="year-badge">
        {{ movie.anio }}
      </div>
    </div>

    <ion-card-header>
      <ion-card-subtitle v-if="movie.genero">{{ movie.genero }}</ion-card-subtitle>
      <ion-card-title>{{ movie.nombre }}</ion-card-title>
    </ion-card-header>

    <ion-card-content>
      <p v-if="movie.director" class="director-text">
        <strong>Director:</strong> {{ movie.director }}
      </p>

      <p v-if="movie.sinopsis" class="synopsis-text">
        {{ movie.sinopsis }}
      </p>

      <div v-if="canEdit" class="card-actions">
        <ion-button
          fill="clear"
          size="small"
          color="primary"
          @click="$emit('edit', movie)"
        >
          <ion-icon slot="start" :icon="createOutline"></ion-icon>
          Editar
        </ion-button>

        <ion-button
          fill="clear"
          size="small"
          color="danger"
          @click="$emit('delete', movie)"
        >
          <ion-icon slot="start" :icon="trashOutline"></ion-icon>
          Eliminar
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';
import type { Movie } from '../types/movie';

defineProps<{
  movie: Movie;
  canEdit?: boolean;
}>();

defineEmits<{
  (e: 'delete', movie: Movie): void;
  (e: 'edit', movie: Movie): void;
}>();

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = 'https://placehold.co/500x750/1e293b/ffffff?text=Sin+Imagen';
  target.onerror = null;
};
</script>

<style scoped>
.movie-card {
  margin: 16px 12px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 240px;
  overflow: hidden;
  background-color: #0f172a;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.year-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

ion-card-header {
  padding-bottom: 6px;
}

ion-card-title {
  font-size: 1.15rem;
  font-weight: 700;
}

ion-card-subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ion-color-primary, #3880ff);
}

.director-text {
  margin: 4px 0 8px 0;
  font-size: 0.85rem;
  color: var(--ion-color-step-600, #666);
}

.synopsis-text {
  margin: 6px 0 12px 0;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--ion-color-step-800, #333);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-step-150, #eee);
}
</style>
