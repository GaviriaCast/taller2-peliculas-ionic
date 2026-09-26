<template>
  <ion-header>
    <ion-toolbar color="primary">
      <ion-buttons slot="start">
        <ion-button @click="cancel" :disabled="saving">Cancelar</ion-button>
      </ion-buttons>
      <ion-title>{{ isEditing ? 'Editar' : 'Nueva' }}</ion-title>
      <ion-buttons slot="end">
        <ion-button :strong="true" @click="save" :disabled="saving">
          <ion-spinner v-if="saving" name="crescent"></ion-spinner>
          <span v-else>Guardar</span>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <div class="preview" v-if="showPreview">
      <img :src="form.imagen" alt="Vista previa" @error="previewFailed = true" />
    </div>

    <ion-text v-if="serverErrors.length" color="danger">
      <ul class="server-errors">
        <li v-for="(msg, i) in serverErrors" :key="i">{{ msg }}</li>
      </ul>
    </ion-text>

    <form @submit.prevent="save" novalidate>
      <ion-list lines="full">
        <ion-item>
          <ion-input
            v-model="form.nombre"
            label="Nombre *"
            label-placement="stacked"
            placeholder="Ej: Matrix"
            :maxlength="120"
            :class="fieldClass('nombre')"
            :error-text="errors.nombre"
            @ionBlur="touched.nombre = true"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.imagen"
            type="url"
            inputmode="url"
            label="URL de la imagen *"
            label-placement="stacked"
            placeholder="https://ejemplo.com/poster.jpg"
            :class="fieldClass('imagen')"
            :error-text="errors.imagen"
            @ionBlur="touched.imagen = true"
            @ionInput="previewFailed = false"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.director"
            label="Director"
            label-placement="stacked"
            placeholder="Ej: Lana y Lilly Wachowski"
            :maxlength="120"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.anio"
            type="number"
            inputmode="numeric"
            label="Año"
            label-placement="stacked"
            placeholder="Ej: 1999"
            :min="1888"
            :max="2100"
            :class="fieldClass('anio')"
            :error-text="errors.anio"
            @ionBlur="touched.anio = true"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.genero"
            label="Género"
            label-placement="stacked"
            placeholder="Ej: Ciencia ficción"
            :maxlength="60"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-textarea
            v-model="form.sinopsis"
            label="Sinopsis"
            label-placement="stacked"
            placeholder="Breve descripción de la película..."
            :auto-grow="true"
            :rows="4"
            :maxlength="1000"
            :counter="true"
          ></ion-textarea>
        </ion-item>
      </ion-list>

      <!-- Permite enviar con "Enter" desde el teclado -->
      <button type="submit" hidden></button>
    </form>
  </ion-content>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonText,
  IonSpinner,
  modalController,
} from '@ionic/vue';
import api from '../services/api';
import type { Movie } from '../types/movie';
import { getErrorMessages } from '../utils/errors';

const props = defineProps<{
  movie?: Movie | null;
}>();

type Field = 'nombre' | 'imagen' | 'anio';

const isEditing = computed(() => !!props.movie);

// Si llega una película se precarga el formulario (modo edición)
const form = reactive({
  nombre: props.movie?.nombre ?? '',
  imagen: props.movie?.imagen ?? '',
  director: props.movie?.director ?? '',
  anio: props.movie?.anio != null ? String(props.movie.anio) : '',
  genero: props.movie?.genero ?? '',
  sinopsis: props.movie?.sinopsis ?? '',
});

const touched = reactive<Record<Field, boolean>>({
  nombre: false,
  imagen: false,
  anio: false,
});

const saving = ref(false);
const serverErrors = ref<string[]>([]);
const previewFailed = ref(false);

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

const errors = computed<Record<Field, string>>(() => {
  const anio = form.anio === '' || form.anio == null ? null : Number(form.anio);
  return {
    nombre: form.nombre.trim() ? '' : 'El nombre es obligatorio',
    imagen: !form.imagen.trim()
      ? 'La imagen es obligatoria'
      : !isUrl(form.imagen)
        ? 'Debe ser una URL válida (http o https)'
        : '',
    anio:
      anio === null || (Number.isInteger(anio) && anio >= 1888 && anio <= 2100)
        ? ''
        : 'El año debe ser un entero entre 1888 y 2100',
  };
});

const hasErrors = computed(() => Object.values(errors.value).some(Boolean));

const showPreview = computed(() => isUrl(form.imagen) && !previewFailed.value);

const fieldClass = (field: Field) => ({
  'ion-touched': touched[field],
  'ion-invalid': touched[field] && !!errors.value[field],
});

// Solo se envían los campos con valor; en edición los vacíos se mandan
// como null para poder limpiarlos en la API
const buildPayload = () => {
  const optional = (value: string) => {
    const clean = value.trim();
    return clean ? clean : isEditing.value ? null : undefined;
  };

  return {
    nombre: form.nombre.trim(),
    imagen: form.imagen.trim(),
    director: optional(form.director),
    anio: form.anio === '' || form.anio == null ? (isEditing.value ? null : undefined) : Number(form.anio),
    genero: optional(form.genero),
    sinopsis: optional(form.sinopsis),
  };
};

const cancel = () => modalController.dismiss(null, 'cancel');

const save = async () => {
  touched.nombre = true;
  touched.imagen = true;
  touched.anio = true;
  if (hasErrors.value) return;

  saving.value = true;
  serverErrors.value = [];
  try {
    const payload = buildPayload();
    const { data } = isEditing.value
      ? await api.patch<Movie>(`/movies/${props.movie!.id}`, payload)
      : await api.post<Movie>('/movies', payload);

    await modalController.dismiss(data, 'confirm');
  } catch (err) {
    serverErrors.value = getErrorMessages(err, 'No se pudo guardar la película.');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.preview {
  width: 100%;
  max-width: 220px;
  aspect-ratio: 2 / 3;
  margin: 0 auto 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.server-errors {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 0.9rem;
}
</style>
