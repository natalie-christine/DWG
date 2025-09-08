<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const artikel = ref([]);
const selected = ref([]);
const loading = ref(true);

const fetchArtikel = async () => {
  loading.value = true;
  const { data, error } = await supabase.from("artikel").select("*").limit(50);

  if (error) {
    console.error("Fehler beim Laden:", error);
  } else {
    artikel.value = data;
  }

  loading.value = false;
};

const toggleSelect = (id) => {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter((x) => x !== id);
  } else {
    selected.value.push(id);
  }
};

onMounted(fetchArtikel);
</script>

<template>
  <div class="page">
    <h1>Artikelverwaltung</h1>
    <div v-if="loading">⏳ Lade Artikel...</div>

    <table v-else>
      <thead>
        <tr>
          <th><input type="checkbox" /></th>
          <th>ID</th>
          <th>CodeNr</th>
          <th>Name</th>
          <th>Preis</th>
          <th>Lagerstand</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in artikel" :key="item.id">
          <td>
            <input
              type="checkbox"
              :value="item.id"
              @change="toggleSelect(item.id)"
              :checked="selected.includes(item.id)"
            />
          </td>
          <td>{{ item.id }}</td>
          <td>{{ item.codenr }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.salesprice }} €</td>
          <td>{{ item.stocktot }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

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
