<!-- src/components/Navigation.vue -->
<template>
    <nav>
      <ul>
        <li><router-link to="/">Dashboard</router-link></li>
        <li><router-link to="/artikel">Artikel</router-link></li>
        <li><router-link to="/inventur">Inventur</router-link></li>
        <li><router-link to="/angebote">Angebote</router-link></li>
        <li><router-link to="/bestellungen">Bestellungen</router-link></li>
      </ul>
    </nav>
  </template>
  
  <script setup>
  </script>
  
  <style scoped>
  nav ul {
    display: flex;
    gap: 1rem;
  }
  </style>
  