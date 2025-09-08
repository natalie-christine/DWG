<template>
  <Navigation />
  <router-view />
</template>

<script setup>
import Navigation from './components/Navigation.vue';
</script>


<style>
#app {
  background-color: darkslategray;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
}
</style>
