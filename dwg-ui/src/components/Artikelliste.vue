<script setup>
import { ref, onMounted, watch } from "vue";
import { supabase } from "../lib/supabase";

import EditArtikelModal from "./EditArtikelModal.vue";

const artikel = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const searchQuery = ref("");
const selectedCategory = ref("Alle");
const categories = ref([]);

const currentPage = ref(1);
const pageSize = 50;
const totalItems = ref(0);

const showEditModal = ref(false);
const selectedArtikel = ref(null);

const artikelListe = ref([])
const totalArtikel = ref(0)

const fetchCategories = async () => {
  let { data, error } = await supabase.from("artikel").select("category");
  if (!error && data) {
    categories.value = ["Alle", ...new Set(data.map((a) => a.category))];
  }
};

const fetchArtikel = async () => {
  loading.value = true;
  errorMessage.value = "";

  let query = supabase
    .from("artikel")
    .select("*", { count: "exact" })
    .order("id", { ascending: true })
    .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1);

  if (searchQuery.value) {
    query = query.or(
      `name.ilike.%${searchQuery.value}%,codenr.ilike.%${searchQuery.value}%`
    );
  }

  if (selectedCategory.value !== "Alle") {
    query = query.eq("category", selectedCategory.value);
  }

  const { data, error, count } = await query;

  if (error) {
    errorMessage.value = error.message;
  } else {
    artikel.value = data;
    totalItems.value = count || 0;
  }

  loading.value = false;
};

const totalPages = () => Math.ceil(totalItems.value / pageSize);

const openEditModal = (item) => {
  selectedArtikel.value = item;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedArtikel.value = null;
  fetchArtikel();
};

onMounted(() => {
  fetchCategories();
  fetchArtikel();
});

watch([searchQuery, selectedCategory, currentPage], () => {
  fetchArtikel();
});



</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Artikelliste</h1>

    <!-- Filter & Suche -->
    <div class="flex gap-4 mb-4" >
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Suche nach Name oder CodeNr..."
        class="border p-2 rounded w-1/3"
        style="height: 50px; width: 350px; padding-left: 50px; margin-right: 50px; font-size: 20px;"
        
      />

      <select v-model="selectedCategory" class="border p-2 rounded" style="height: 50px; width: 350px; padding-left: 50px; margin-right: 50px;">
        <option v-for="cat in categories" :key="cat" :value="cat" style="height: 50px; width: 350px; padding-left: 50px; margin-right: 50px;">
          {{ cat }}
          
        </option>
      </select>
    </div>

    <!-- Tabelle -->
    <div v-if="loading" class="p-4">Lade Artikel...</div>
    <div v-else>
      <table class="table-auto border-collapse w-full">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="p-2 border">ID</th>
            <th class="p-2 border">Bild</th>
            <th class="p-2 border">Name</th>
            <th class="p-2 border">CodeNr</th>
            <th class="p-2 border">Preis</th>
            <th class="p-2 border">Lagerstand</th>
            <th class="p-2 border">Mengeneinheit</th>
            <th class="p-2 border">Kategorie</th>
            <th class="p-2 border">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="art in artikel"
            :key="art.id"
            class="hover:bg-gray-50 cursor-pointer"
          >
            <td class="p-2 border">{{ art.id }}</td>
            <td class="p-2 border">
              <img
                v-if="art.image_url"
                :src="art.image_url"
                alt="Artikelbild"
                class="h-10 w-10 object-cover"
              />
            </td>
            <td class="p-2 border">{{ art.name }}</td>
            <td class="p-2 border">{{ art.codenr }}</td>
            <td class="p-2 border">{{ art.salesprice }} €</td>
            <td class="p-2 border">{{ art.stocktot }}</td>
            <td class="p-2 border">{{ art.unit }}</td>
            <td class="p-2 border">{{ art.category }}</td>
            <td class="p-2 border">
              <button
                class="px-2 py-1 bg-blue-500 text-white rounded"
                @click="openEditModal(art)">
                Bearbeiten
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4">
        <button
          :disabled="currentPage === 1"
          @click="currentPage--"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Zurück
        </button>

        <span>Seite {{ currentPage }} von {{ totalPages() }}</span>

        <button
          :disabled="currentPage === totalPages()"
          @click="currentPage++"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Weiter
        </button>
      </div>
    </div>

    <!-- Fehler -->
    <div v-if="errorMessage" class="text-red-500 mt-2">
      {{ errorMessage }}
    </div>

    <!-- Edit Modal -->
    <EditArtikelModal
      v-if="showEditModal"
      :artikel="selectedArtikel"
      @close="closeEditModal"
      @saved="fetchArtikel"
    />
  </div>
</template>

<style scoped>
.artikel-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-family: Arial, sans-serif;
}

.artikel-table th,
.artikel-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}

.artikel-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.artikel-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.artikel-table tbody tr:hover {
  background-color: #e9f5ff;
}

.btn-edit,
.btn-delete {
  padding: 4px 8px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-edit {
  background-color: #4caf50;
  color: white;
}

.btn-edit:hover {
  background-color: #45a049;
}

.btn-delete {
  background-color: #f44336;
  color: white;
}

.btn-delete:hover {
  background-color: #d32f2f;
}

</style>
