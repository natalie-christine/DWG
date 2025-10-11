import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../pages/Dashboard.vue";
import Artikel from "../pages/Artikel.vue";
import AngebotsErstellung from "../pages/AngebotsErstellung.vue";
import Kundenverwaltung from "../pages/Kundenverwaltung.vue";
import Inventur from "../pages/Inventur.vue";
import Angebote from "../pages/Angebote.vue";
import Bestellungen from "../pages/Bestellungen.vue";
import Einstellungen from "../pages/Einstellungen.vue";

const routes = [
  { path: "/", component: Dashboard },
  { path: "/artikel", component: Artikel },
  { path: "/angebotserstellung",  component: AngebotsErstellung },
  { path: "/kundenverwaltung", component: Kundenverwaltung },
  { path: "/inventur", component: Inventur },
  { path: "/angebote", component: Angebote },
  { path: "/bestellungen", component: Bestellungen },
  {path: "/einstellungen", component: Einstellungen},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
