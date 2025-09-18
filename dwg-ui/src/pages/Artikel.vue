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
.page {
  background-color: rgba(58, 102, 102, 0.342);
  padding-left: 50px;
  padding-top: 20px;
}
</style>
