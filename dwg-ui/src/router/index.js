import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../pages/Dashboard.vue";
import Artikel from "../pages/Artikel.vue";
import Inventur from "../pages/Inventur.vue";
import Angebote from "../pages/Angebote.vue";
import Bestellungen from "../pages/Bestellungen.vue";

const routes = [
  { path: "/", component: Dashboard },
  { path: "/artikel", component: Artikel },
  { path: "/inventur", component: Inventur },
  { path: "/angebote", component: Angebote },
  { path: "/bestellungen", component: Bestellungen },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
