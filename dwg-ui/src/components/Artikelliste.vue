<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { supabase } from "../lib/supabase";
import EditArtikelModal from "./EditArtikelModal.vue";

const allArtikel = ref([]);
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

// Auswahl / Warenkorb
const selectedIds = ref([]);
const selectAll = ref(false);

// Hover / Click Preview
const hoverImage = ref(null);
const clickedImage = ref(null);
let hoverTimeout = null;

// Hover / Click helpers
function setHover(url) {
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    hoverImage.value = url;
  }, 500); // 1 Sekunde warten
}
function clearHover() {
  clearTimeout(hoverTimeout);
  if (!clickedImage.value) {
    hoverImage.value = null;
  }
}

function toggleClick(url) {
  clickedImage.value = clickedImage.value === url ? null : url;
  if (!clickedImage.value) hoverImage.value = null;
}

// Supabase Public URL
function getImageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from("artikel-bilder").getPublicUrl(path);
  return data.publicUrl;
}

// Artikel vom Backend laden
async function fetchArtikel() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { data, error } = await supabase
      .from("artikel")
      .select("*")
      .order("id", { ascending: true })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1);
    if (error) throw error;

    // Public URL schon vorab anlegen
    allArtikel.value = (data || []).map(a => ({
      ...a,
      imagePreview: getImageUrl(a.image_url),
    }));

    applyFilters();
  } catch (err) {
    console.error(err);
    errorMessage.value = err.message || "Fehler beim Laden der Artikel";
    allArtikel.value = [];
    artikel.value = [];
  } finally {
    loading.value = false;
  }
}

// Filter / Suche
function applyFilters() {
  let list = allArtikel.value.slice();
  if (selectedCategory.value && selectedCategory.value !== "Alle") {
    list = list.filter(a => a.category === selectedCategory.value);
  }
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase();
    list = list.filter(a =>
      (a.name && a.name.toLowerCase().includes(term)) ||
      (a.codenr && a.codenr.toLowerCase().includes(term))
    );
  }
  artikel.value = list;
  totalItems.value = list.length;

  if (selectAll.value) selectedIds.value = artikel.value.map(a => a.id);
}

// Kategorien laden
async function fetchCategories() {
  const { data, error } = await supabase.from("artikel").select("category");
  if (!error && data) {
    categories.value = ["Alle", ...new Set(data.map(a => a.category).filter(Boolean))];
  }
}

// Modal öffnen / schließen
function openEditModal(art) {
  selectedArtikel.value = { ...art };
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  selectedArtikel.value = null;
}

// nach Edit: lokale Liste aktualisieren
function saveArtikel(updatedArtikel) {
  const idx = allArtikel.value.findIndex(a => a.id === updatedArtikel.id);
  if (idx !== -1) {
    allArtikel.value[idx] = { ...allArtikel.value[idx], ...updatedArtikel, imagePreview: getImageUrl(updatedArtikel.image_url) };
  }
  applyFilters();
  closeEditModal();
}

// Auswahl-Handling
function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = artikel.value.map(a => a.id);
  } else {
    selectedIds.value = [];
  }
}
watch(selectedIds, ids => {
  if (ids.length === artikel.value.length && artikel.value.length > 0) selectAll.value = true;
  else selectAll.value = false;
});

// Warenkorb
function addToCart() {
  const chosen = allArtikel.value.filter(a => selectedIds.value.includes(a.id));
  console.log("In Warenkorb:", chosen);
}

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)));

watch([searchQuery, selectedCategory], () => applyFilters());
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
      <input v-model="searchQuery" type="text" placeholder="Suche nach Name oder CodeNr..." class="border p-2 rounded"
             style="height:50px; width:350px; padding-left:10px; font-size:18px;" />
      <select v-model="selectedCategory" class="border p-2 rounded" style="height:50px; width:250px; padding-left:10px;">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <div class="ml-auto flex items-center gap-2">
        <button @click="addToCart" class="px-3 py-2 bg-blue-600 text-white rounded">In Warenkorb ({{ selectedIds.length }})</button>
      </div>
    </div>

    <!-- Tabelle -->
    <div v-if="loading" class="p-4">Lade Artikel...</div>
    <div v-else>
      <table class="table-auto border-collapse w-full">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="p-2 border"><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" /></th>
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
          <tr v-for="art in artikel" :key="art.id" class="hover:bg-gray-50">
            <td class="p-2 border"><input type="checkbox" :value="art.id" v-model="selectedIds" @click.stop /></td>
            <td class="p-2 border">{{ art.id }}</td>

            <!-- Hover / Click Bild -->
            <td class="p-2 border relative" style="width:70px;">
             <span
               v-if="art.imagePreview"
               @mouseenter="setHover(art.imagePreview)"
               @mouseleave="clearHover"
               @click="toggleClick(art.imagePreview)"
               class="cursor-pointer text-blue-500"
              >
                🖼️
               </span>
            </td>

            <td class="p-2 border">{{ art.name }}</td>
            <td class="p-2 border">{{ art.codenr }}</td>
            <td class="p-2 border">{{ art.salesprice }} €</td>
            <td class="p-2 border">{{ art.stocktot }}</td>
            <td class="p-2 border">{{ art.unit }}</td>
            <td class="p-2 border">{{ art.category }}</td>
            <td class="p-2 border">
              <button @click="openEditModal(art)" class="px-2 py-1 bg-green-500 text-white rounded">Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>

<!-- Overlay-Bild Vorschau -->
<div 
  v-if="hoverImage || clickedImage" 
  class="overlay" 
  @click="clickedImage = null; hoverImage = null"
>
  <img :src="clickedImage || hoverImage" class="overlay-img" />
</div>



      <div class="flex justify-between items-center mt-4">
        <button :disabled="currentPage===1" @click="currentPage--" class="px-3 py-1 border rounded disabled:opacity-50">Zurück</button>
        <span>Seite {{ currentPage }} von {{ totalPages }}</span>
        <button :disabled="currentPage===totalPages" @click="currentPage++" class="px-3 py-1 border rounded disabled:opacity-50">Weiter</button>
      </div>
    </div>

    <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>

    <EditArtikelModal v-if="showEditModal" :artikel="selectedArtikel" @close="closeEditModal" @save="saveArtikel" />
  </div>
</template>

<style scoped>
.preview-box {
  position: absolute;
  z-index: 60;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  background: white;
  padding: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
  border-radius: 8px;
  max-width: 420px;
  max-height: 420px;
  margin-left: 12px;
}

.preview-img {
  display: block;
  max-width: 400px;
  max-height: 400px;
  object-fit: contain;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  cursor: zoom-out;
}

.overlay-img {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  object-fit: contain;
}




</style>
