<template>
  <div class="min-h-screen bg-gray-100">
    <Navigation />
    <main class="p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import Navigation from "./components/Navigation.vue";
</script>


<style>
#app {
  /*background-color: darkslategray; */
  font-size: large;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
}
</style>
