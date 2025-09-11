<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import EditArtikelModal from "./EditArtikelModal.vue";




const artikel = ref([]);
const loading = ref(true);

const selected = ref([]);
const search = ref("");
const selectedArtikel = ref(null);

const openEditModal = (item) => {
  selectedArtikel.value = item;
};


const toggleSelect = (id) => {
  if (selected.value.includes(id)) selected.value = selected.value.filter(x => x !== id);
  else selected.value.push(id);
};

const toggleAll = () => {
  if (allSelected.value) selected.value = [];
  else selected.value = artikel.value.map(a => a.id);
};

const allSelected = computed(() => artikel.value.length && selected.value.length === artikel.value.length);

const filteredArtikel = computed(() => {
  if (!search.value) return artikel.value;
  const term = search.value.toLowerCase();
  return artikel.value.filter(a => a.name.toLowerCase().includes(term) || a.codenr.toLowerCase().includes(term));
});

const editArtikel = (item) => {
  selectedArtikel.value = { ...item };
};

const deleteArtikel = async (item) => {
  if (!confirm(`Artikel ${item.name} wirklich löschen?`)) return;
  const { error } = await supabase.from("artikel").delete().eq("id", item.id);
  if (error) console.error(error);
  else fetchArtikel();
};

const fetchArtikel = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .order("name", { ascending: true });

  if (error) console.error("Fehler beim Laden:", error.message);
  else artikel.value = data;

  loading.value = false;
};

const closeEditModal = () => {
  selectedArtikel.value = null;
};

const reloadAfterSave = () => {
  fetchArtikel();
};

onMounted(fetchArtikel);
</script>

<template>
  <div>
    <h1>Artikelverwaltung</h1>
    <div v-if="loading">⏳ Lade Artikel...</div>
    <div v-else>
      <input v-model="search" placeholder="Suchen nach Name oder CodeNr" style="margin-bottom:1rem;"/>

      <table>
        <thead>
          <tr>
            <th><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th>ID</th>
            <th>CodeNr</th>
            <th>Name</th>
            <th>Preis</th>
            <th>Lagerstand</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredArtikel" :key="item.id">
            <td>
              <input type="checkbox" :value="item.id" :checked="selected.includes(item.id)" @change="toggleSelect(item.id)">
            </td>
            <td>{{ item.id }}</td>
            <td>{{ item.codenr }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.salesprice }} €</td>
            <td>{{ item.stocktot }}</td>
            <td>
              <button @click="editArtikel(item)">Bearbeiten</button>
              <button @click="deleteArtikel(item)">Löschen</button>
            </td>
          </tr>
        </tbody>
      </table>

      <EditArtikelModal
  v-if="selectedArtikel"
  :artikel="selectedArtikel"
  @close="closeEditModal"
  @saved="reloadAfterSave"
/>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  color: #333;
}
th {
  background-color: #f4f4f4;
}
button {
  padding: 4px 8px;
  margin-right: 4px;
  cursor: pointer;
}
</style>





