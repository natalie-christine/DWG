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
  { name: "Inventur", path: "/inventur" },
  { name: "Angebote", path: "/angebote" },
  { name: "Bestellungen", path: "/bestellungen" },
];

const isActive = (path) => route.path === path;
</script>

  
  <style scoped>
  nav ul {

    display: flex;
    gap: 1rem;
    color: aliceblue;
    height: 200px;
    margin-bottom: 50px;

  }

  a{
   background-color: rgba(62, 106, 121, 0.482);
    border: 10px;
    padding: 50px;
  }

  nav{   
    width: fit-content;
    border: 100px;
    font-size: 30px;
    font-style: normal;

  }


  
  </style>
  