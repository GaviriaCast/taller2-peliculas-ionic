# 📱 Cliente móvil — Taller #2 (Ionic Vue + Capacitor)

Cliente móvil del catálogo de películas. Reutiliza la misma API de NestJS del Taller #1 (`../backend`) sin cambiar el backend.

| Qué | Cómo se resolvió |
| --- | --- |
| Navegación | `@ionic/vue-router` con `ion-router-outlet`, páginas con `ion-page`, `ion-header` y `ion-content` |
| Listado | `GET /movies` con tarjetas `ion-card` y recarga con `ion-refresher` |
| Detalle | Al tocar una tarjeta se abre `/movies/:id` (`GET /movies/:id`) con póster, datos y acciones de editar/eliminar |
| Búsqueda | `ion-searchbar` con debounce, envía `?search=` a la API |
| Paginación | `ion-infinite-scroll` pidiendo `?page=` hasta `totalPages` |
| Crear / editar | `MovieForm.vue` dentro de un `ion-modal` (`modalController`), hace `POST` o `PATCH` |
| Eliminar | Confirmación con `ion-alert` y `DELETE /movies/:id` |
| Registro / login | `LoginView.vue` y `RegisterView.vue` con `ion-input`, `ion-item` y `ion-button` |
| Sesión | Token y usuario guardados con **Capacitor Preferences** (store de Pinia en `src/stores/auth.ts`) |
| Header `Authorization` | Interceptor de Axios en `src/services/api.ts`: lee el token de Preferences y agrega `Bearer <token>` a todas las peticiones; con un `401` cierra la sesión y manda a `/login` |
| Rutas protegidas | `router.beforeEach` espera a que la sesión cargue: `/perfil` pide sesión y `/login` y `/registro` son solo para invitados |

---

## Requisitos

- Node.js 20 o superior
- La API del Taller #1 corriendo (ver el [README principal](../README.md#1-backend-api-de-nestjs))
- Opcional: Ionic CLI (`npm i -g @ionic/cli`) para usar `ionic serve`

> ⚠️ Clona el repositorio en una ruta **sin el carácter `#`**; Vite y Capacitor fallan con ese carácter.

## 1. Preparar la API para el móvil (CORS)

El backend lee los orígenes permitidos de `CORS_ORIGIN` en `backend/.env`. Agrega el puerto de Ionic y los orígenes de Capacitor, separados por coma:

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:8100,capacitor://localhost,http://localhost"
```

Reinicia la API después de cambiarlo.

## 2. Levantar la app en el navegador

```bash
cd mobile
npm install
cp .env.example .env
ionic serve        # o: npm run dev -- --port 8100
```

La app queda en **http://localhost:8100**.

### Apuntar a la API

La URL de la API sale de `VITE_API_URL` en `mobile/.env`:

| Dónde corre la app | `VITE_API_URL` |
| --- | --- |
| Navegador (`ionic serve`) | `http://localhost:3000/api` |
| Emulador de Android | `http://10.0.2.2:3000/api` |
| Celular físico (misma red wifi) | `http://<IP-de-tu-PC>:3000/api` |

Si cambias el `.env`, reinicia `ionic serve` (o vuelve a compilar para Android).

### Usuario de prueba

El seed del backend crea `demo@peliculas.com` / `demo1234`. También puedes crear una cuenta desde **Regístrate**.

## 3. Flujo de la app

1. **Catálogo** (`/movies`): es público. Tiene búsqueda, scroll infinito y la opción de deslizar hacia abajo para recargar.
2. **Detalle** (`/movies/:id`): toca cualquier tarjeta para ver la película completa. Con sesión, desde ahí también se edita o elimina.
3. **Entrar** (botón de la barra): inicia sesión o regístrate. El token queda guardado con Capacitor Preferences, así que la sesión sigue activa después de recargar o cerrar la app.
4. Con sesión iniciada aparecen el botón flotante **+** (crear), **Editar** y **Eliminar** en cada tarjeta.
5. **Mi perfil** (`/perfil`, ícono de usuario): revalida el token con `GET /auth/me` y permite cerrar sesión.

> En el navegador, Capacitor Preferences se guarda en `localStorage` con el prefijo `CapacitorStorage.`; en Android usa `SharedPreferences` nativo. El código de la app nunca usa `localStorage` directamente.

## 4. Plus: Android con Capacitor

Necesitas Android Studio con un SDK y un emulador (o un celular con depuración USB).

> ⚠️ **Java:** la plantilla de Capacitor usa Gradle 8.14, que **no funciona con Java 25** (el que trae Android Studio). Usa **JDK 21**: en Android Studio ve a *Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK* y elige un JDK 21, o desde la terminal instala `brew install openjdk@21` y exporta `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`.

```bash
cd mobile
# en .env: VITE_API_URL=http://10.0.2.2:3000/api
npm run build
npx cap add android     # solo la primera vez
npx cap sync android
npx cap open android    # abre Android Studio, luego Run ▶
```

También puedes compilar e instalar sin abrir Android Studio (con el emulador ya encendido):

```bash
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`capacitor.config.ts` sirve el WebView en `http` (`androidScheme: 'http'`) para que el emulador pueda consumir la API local, que corre en `http`.

## Estructura

```
mobile/src
├── components/
│   ├── MovieCard.vue      # Tarjeta de película
│   └── MovieForm.vue      # Formulario de crear/editar (va dentro de ion-modal)
├── router/index.ts        # Rutas y guard de sesión
├── services/
│   ├── api.ts             # Axios + interceptores (Bearer y 401)
│   └── session.ts         # Lectura/escritura en Capacitor Preferences
├── stores/
│   ├── auth.ts            # Store de Pinia: login, register, logout, fetchMe
│   └── movies.ts          # Avisa al catálogo los cambios hechos desde el detalle
├── types/                 # Tipos de Movie y User
├── utils/errors.ts        # Mensajes de error de la API
└── views/
    ├── MoviesPage.vue     # Catálogo
    ├── MovieDetailView.vue # Detalle de una película
    ├── LoginView.vue
    ├── RegisterView.vue
    └── ProfileView.vue
```
