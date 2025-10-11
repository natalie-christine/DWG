<script setup>
import { ref, onMounted, computed, watch } from "vue";
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
const pageSize = ref(50);
const totalItems = ref(0);

const showEditModal = ref(false);
const selectedArtikel = ref(null);

// Auswahl
const selectedIds = ref([]);
const selectAll = ref(false);

// Overlay für Klick-Bild
const clickedImage = ref(null);

// Warenkorb
const cart = ref([]);

// Supabase Public URL
function getImageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from("artikel-bilder").getPublicUrl(path);
  return data.publicUrl;
}

// Kategorien laden
async function fetchCategories() {
  const { data, error } = await supabase.from("artikel").select("category");
  if (!error && data) {
    categories.value = ["Alle", ...new Set(data.map(a => a.category).filter(Boolean))];
  }
}

// Artikel laden
async function fetchArtikel() {
  loading.value = true;
  try {
    const { data, error, count } = await supabase
      .from("artikel")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1);
    if (error) throw error;

    allArtikel.value = (data || []).map(a => ({
      ...a,
      imagePreview: getImageUrl(a.image_url)
    }));

    totalItems.value = count || 0;
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

// Filter
function applyFilters() {
  let list = allArtikel.value.slice();
  if (selectedCategory.value && selectedCategory.value !== "Alle") {
    list = list.filter(a => a.category === selectedCategory.value);
  }
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase();
    list = list.filter(a =>
      (a.name && a.name.toLowerCase().includes(term)) ||
      (a.code_nr && a.code_nr.toLowerCase().includes(term))
    );
  }
  artikel.value = list;

  if (selectAll.value) selectedIds.value = artikel.value.map(a => a.id);
}

// Modal
function openEditModal(art) {
  selectedArtikel.value = { ...art };
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  selectedArtikel.value = null;
}

// Overlay
function showOverlay(image) {
  clickedImage.value = image;
}

// Warenkorb hinzufügen
function addToCart(item = null) {
  const toAdd = item ? [item] : allArtikel.value.filter(a => selectedIds.value.includes(a.id));
  toAdd.forEach(i => {
    if (!cart.value.find(c => c.id === i.id)) cart.value.push(i);
  });
  selectedIds.value = [];
  selectAll.value = false;
}

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
watch(currentPage, fetchArtikel);

// Filter neu anwenden bei Suchbegriff/Kategorie
watch([searchQuery, selectedCategory], applyFilters);

onMounted(() => {
  fetchCategories();
  fetchArtikel();
});
</script>

<template>
  <div class="container">
    <h1 class="title">Artikelliste</h1>

    <!-- Filter & Suche -->
    <div class="filters">
      <input v-model="searchQuery" type="text" placeholder="Suche nach Name oder CodeNr..." />
      <select v-model="selectedCategory">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <button @click="addToCart" class="btn main-btn">
        Warenkorb bearbeiten / Angebot erstellen {{ selectedIds.length }} ausgewählt </button>
    </div>

    <!-- Tabelle -->
    <div v-if="loading" class="loading">Lade Artikel...</div>
    <div v-else>
      <table class="artikel-table">
        <thead>
          <tr>
            <th>Bild</th>
            <th>ID</th>
            <th>Name</th>
            <th>CodeNr</th>
            <th>Preis</th>
            <th>Lagerstand</th>
            <th>Einheit</th>
            <th>Kategorie</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="art in artikel" :key="art.id">
            <td>
              <img v-if="art.imagePreview" :src="art.imagePreview" class="thumbnail" @click="showOverlay(art.imagePreview)" />
            </td>
            <td>{{ art.id }}</td>
            <td>{{ art.name }}</td>
            <td>{{ art.code_nr }}</td>
            <td>{{ art.sales_price }} €</td>
            <td>{{ art.stock_tot }}</td>
            <td>{{ art.unit }}</td>
            <td>{{ art.category }}</td>
            <td>
              <div class="actions">
                <button class="btn" @click="openEditModal(art)">Bearbeiten</button>
                <button class="btn" @click="addToCart(art)">In Warenkorb</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Overlay für Klickbild -->
      <div v-if="clickedImage" class="overlay" @click="clickedImage = null">
        <img :src="clickedImage" class="overlay-img" />
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button :disabled="currentPage===1" @click="currentPage--">Zurück</button>
        <span>Seite {{ currentPage }} von {{ totalPages }}</span>
        <button :disabled="currentPage===totalPages" @click="currentPage++">Weiter</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <EditArtikelModal v-if="showEditModal" :artikel="selectedArtikel" @close="closeEditModal" @save="fetchArtikel" />
  </div>
</template>

<style scoped>
.container {
  padding: 1rem;
  font-family: Arial, sans-serif;
}
.title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}
.filters input, .filters select {
  padding: 0.5rem;
  font-size: 1rem;
}
.main-btn {
  padding: 0.5rem 1rem;
}
.cart-preview {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}
.loading {
  padding: 1rem;
}
.artikel-table {
  width: 100%;
  border-collapse: collapse;
}
.artikel-table th, .artikel-table td {
  border: 1px solid #ccc;
  text-align: left;
}
.artikel-table tr:hover {
  background-color: #f9f9f9;
}
.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.2s;
}
.thumbnail:hover {
  transform: scale(1.05);
}
.actions {
  display: flex;
  gap: 0.3rem;
}
.actions button {
  flex: 1;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
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
  object-fit: contain;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.error {
  color: red;
  margin-top: 1rem;
}
/* Responsiv */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }
  .artikel-table th, .artikel-table td {
    font-size: 0.9rem;
    padding: 0.3rem;
  }
  .thumbnail {
    width: 70px;
    height: 70px;
  }
}
</style>
