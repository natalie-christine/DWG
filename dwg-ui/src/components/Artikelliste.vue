<script setup>
import { ref, onMounted, watch } from "vue";
import { supabase } from "../lib/supabase";
import EditArtikelModal from "./EditArtikelModal.vue";

const artikelliste = ref([]);

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

const fetchCategories = async () => {
  const { data, error } = await supabase.from("artikel").select("category");
  if (!error && data) {
    categories.value = ["Alle", ...new Set(data.map((a) => a.category))];
  }
};

async function fetchArtikel() {
  loading.value = true;
  errorMessage.value = "";

  try {
    let query = supabase
      .from("artikel")
      .select("*")
      .order("id", { ascending: true });

    if (selectedCategory.value !== "Alle") {
      query = query.eq("category", selectedCategory.value);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Suche auf der Client-Seite
    if (searchQuery.value) {
      const term = searchQuery.value.toLowerCase();
      artikel.value = data.filter(
        a =>
          a.name?.toLowerCase().includes(term) ||
          a.codenr?.toLowerCase().includes(term)
      );
    } else {
      artikel.value = data;
    }

    artikelliste.value = data; // volle Liste für Bearbeitung etc.
    totalItems.value = artikel.value.length;

  } catch (err) {
    errorMessage.value = err.message;
    artikel.value = [];
    artikelliste.value = [];
  } finally {
    loading.value = false;
  }
};

// Modal öffnen
function openEditModal(artikel) {
  selectedArtikel.value = { ...artikel }; // Kopie für Bearbeitung
  showEditModal.value = true;
}

// Modal schließen
function closeEditModal() {
  showEditModal.value = false;
  selectedArtikel.value = null;
}

// Artikel nach Bearbeitung aktualisieren
function saveArtikel(updatedArtikel) {
  const index = artikelliste.value.findIndex(a => a.id === updatedArtikel.id);
  if (index !== -1) {
    artikelliste.value[index] = { ...updatedArtikel };
  }
  closeEditModal();
}

const totalPages = () => Math.ceil(totalItems.value / pageSize);


watch([searchQuery, selectedCategory, currentPage], () => {
  fetchArtikel();
});

onMounted(() => {
  fetchCategories();
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
              <button @click="openEditModal(artikel)">Bearbeiten</button>
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
      @save="saveArtikel"
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
