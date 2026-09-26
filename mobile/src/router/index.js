import { createRouter, createWebHistory } from '@ionic/vue-router';
import MoviesPage from '../views/MoviesPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/movies',
  },
  {
    path: '/movies',
    name: 'Movies',
    component: MoviesPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
