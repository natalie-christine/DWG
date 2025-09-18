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

// Hover & Klick
const hoverImage = ref(null);
const clickedImage = ref(null);

// Kategorien laden
const fetchCategories = async () => {
  const { data, error } = await supabase.from("artikel").select("category");
  if (!error && data) {
    categories.value = ["Alle", ...new Set(data.map((a) => a.category))];
  }
};

// Artikel laden
async function fetchArtikel() {
  loading.value = true;
  errorMessage.value = "";

  try {
    let query = supabase.from("artikel").select("*").order("id", { ascending: true });

    if (selectedCategory.value !== "Alle") {
      query = query.eq("category", selectedCategory.value);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    if (searchQuery.value) {
      const term = searchQuery.value.toLowerCase();
      artikel.value = data.filter(
        a => a.name?.toLowerCase().includes(term) || a.codenr?.toLowerCase().includes(term)
      );
    } else {
      artikel.value = data;
    }

    artikelliste.value = data;
    totalItems.value = artikel.value.length;
  } catch (err) {
    errorMessage.value = err.message;
    artikel.value = [];
  } finally {
    loading.value = false;
  }
}

// Modal öffnen
function openEditModal(art) {
  selectedArtikel.value = { ...art };
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

// Supabase Public URL holen
function getImageUrl(path) {
  if (!path) return null;
  return supabase.storage.from("artikel-bilder").getPublicUrl(path).data.publicUrl;
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
    <div class="flex gap-4 mb-4">
      <input v-model="searchQuery" type="text" placeholder="Suche nach Name oder CodeNr..."
             class="border p-2 rounded w-1/3" style="height: 50px; width: 350px; padding-left: 10px; font-size: 20px;" />
      <select v-model="selectedCategory"
              class="border p-2 rounded" style="height: 50px; width: 350px; padding-left: 10px;">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
            <th class="p-2 border">Einheit</th>
            <th class="p-2 border">Kategorie</th>
            <th class="p-2 border">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="art in artikel" :key="art.id" class="hover:bg-gray-50 cursor-pointer relative">
            <td class="p-2 border">{{ art.id }}</td>

            <!-- Bildspalte mit Hover- und Klick-Vorschau -->
            <td class="p-2 border relative">
              <span
                v-if="art.image_url"
                @mouseenter="hoverImage = getImageUrl(art.image_url)"
                @mouseleave="hoverImage = null"
                @click="clickedImage = getImageUrl(art.image_url)"
                class="cursor-pointer text-blue-500"
              >
                🖼️
              </span>

              <!-- Hover & Klick Vorschau -->
              <div v-if="hoverImage === getImageUrl(art.image_url) || clickedImage === getImageUrl(art.image_url)"
                   class="absolute z-50 mt-2 left-1/2 transform -translate-x-1/2 bg-white p-1 border shadow-lg rounded"
                   style="max-width: 250px; max-height: 250px;">
                <img :src="getImageUrl(art.image_url)" class="object-contain w-full h-full rounded" />
              </div>
            </td>

            <td class="p-2 border">{{ art.name }}</td>
            <td class="p-2 border">{{ art.code_nr }}</td>
            <td class="p-2 border">{{ art.sales_price }} €</td>
            <td class="p-2 border">{{ art.stock_tot }}</td>
            <td class="p-2 border">{{ art.unit }}</td>
            <td class="p-2 border">{{ art.category }}</td>
            <td class="p-2 border">
              <button @click="openEditModal(art)">Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4">
        <button :disabled="currentPage === 1" @click="currentPage--" class="px-3 py-1 border rounded disabled:opacity-50">Zurück</button>
        <span>Seite {{ currentPage }} von {{ totalPages() }}</span>
        <button :disabled="currentPage === totalPages()" @click="currentPage++" class="px-3 py-1 border rounded disabled:opacity-50">Weiter</button>
      </div>
    </div>

    <!-- Fehler -->
    <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>

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
.relative { position: relative; }
.absolute { position: absolute; top: -150%; left: 50%; transform: translateX(-50%); }
</style>
