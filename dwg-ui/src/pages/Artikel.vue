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

>>>>>>> feac1ee (load article, search article, filter kategory)
<style scoped>
.page {
  padding-left: 250px;
  padding-top: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f4f4f4;
}
</style>
