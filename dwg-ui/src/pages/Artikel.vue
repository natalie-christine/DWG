<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import Artikelliste from "../components/Artikelliste.vue";

</script>

<template>
  <div class="page">
    <Artikelliste />
  </div>
</template>


<style scoped>

</style>
