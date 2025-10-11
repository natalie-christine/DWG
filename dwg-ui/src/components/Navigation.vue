<template>
  <nav class="navStyle">
    <RouterLink 
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
    >
      {{ tab.name}} 
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  { name: "Dashboard", path: "/" },
  { name: "Artikel", path: "/artikel" },
  { name: "Angebote Erstellen", path: "/angebotserstellung" },
  { name: "Kunden Verwalten", path: "/kundenverwaltung" },
  { name: "Inventur", path: "/inventur" },
  { name: "Angebote", path: "/angebote" },
  { name: "Bestellungen", path: "/bestellungen" },
  { name: "Einstellungen", path: "/einstellungen"}
];

const isActive = (path) => route.path === path;
</script>

  
  <style scoped>
  nav ul {

    display: flex;
    gap: 1rem;
    height: 200px;
    margin-bottom: 50px;

  }

  a{
    border: 10px;
    padding: 20px;
    color: darkslategrey;
    text-decoration: none;
    
  }

  nav{   
    border: 100px;
    font-size: 30px;

  }


  
  </style>
  