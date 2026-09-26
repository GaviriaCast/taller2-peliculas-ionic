import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.edu.upb.peliculas',
  appName: 'Películas',
  webDir: 'dist',
  server: {
    // La API local corre en http, así que el WebView de Android también
    // se sirve en http para evitar el bloqueo por contenido mixto
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
