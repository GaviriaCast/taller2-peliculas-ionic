import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import MoviesPage from '../views/MoviesPage.vue';
import { useAuthStore } from '../stores/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/movies',
  },
  {
    path: '/movies',
    name: 'Movies',
    component: MoviesPage,
  },
  {
    path: '/movies/:id',
    name: 'MovieDetail',
    component: () => import('../views/MovieDetailView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registro',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/perfil',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Guard global: antes de cada navegación espera a que la sesión se lea
// desde Capacitor Preferences y decide si deja pasar o redirige
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { path: '/' };
  }
  return true;
});

export default router;
