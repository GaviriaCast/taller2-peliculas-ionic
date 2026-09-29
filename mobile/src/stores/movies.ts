import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Movie } from '../types/movie';

// El catálogo queda vivo en el stack de Ionic mientras se navega al detalle.
// Este store avisa los cambios hechos en otras vistas para que la lista
// se actualice sin volver a pedir todas las páginas.
export const useMovieChangesStore = defineStore('movieChanges', () => {
  const updated = ref<Movie | null>(null);
  const deletedId = ref<number | null>(null);

  function notifyUpdated(movie: Movie) {
    updated.value = { ...movie };
  }

  function notifyDeleted(id: number) {
    deletedId.value = id;
  }

  return { updated, deletedId, notifyUpdated, notifyDeleted };
});
