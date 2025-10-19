<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { supabase } from "../lib/supabase";
import EditArtikelModal from "../components/EditArtikelModal.vue";
import { useRouter } from "vue-router";
import { showToast } from "../lib/toast";


const router = useRouter();

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

const clickedImage = ref(null);
const cart = ref([]);

// Public URL für Bilder
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
    showToast("Fehler beim Speichern.", "error");
    errorMessage.value = err.message || "Fehler beim Laden der Artikel";
  } finally {
    loading.value = false;
    showToast("Artikel erfolgreich gelöscht.", "success");
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
}

// Modal öffnen
function openEditModal(art) {
  selectedArtikel.value = { ...art };
  showEditModal.value = true;
}

// Neuen Artikel anlegen
function createNewArtikel() {
  selectedArtikel.value = {
    name: "",
    code_nr: "",
    sales_price: 0,
    stock_tot: 0,
    unit: "",
    category: "",
    image_url: ""
  };
  showEditModal.value = true;
}

// Modal schließen
function closeEditModal() {
  showEditModal.value = false;
  selectedArtikel.value = null;
}

// Artikel löschen
async function deleteArtikel(id) {
  if (!confirm("Diesen Artikel wirklich löschen?")) return;
  const { error } = await supabase.from("artikel").delete().eq("id", id);
  if (error) {
    alert("Fehler beim Löschen.");
  } else {
    await fetchArtikel();
  }
}

// Warenkorb hinzufügen
function addToCart(item) {
  if (!cart.value.find(c => c.id === item.id)) {
    cart.value.push(item);
  }
}

// Zum Angebotseditor wechseln
function openAngebotEditor() {
  router.push({
    path: "/AngebotsErstellung",
    query: { cart: JSON.stringify(cart.value) }
  });
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
watch(currentPage, fetchArtikel);
watch([searchQuery, selectedCategory], applyFilters);

onMounted(() => {
  fetchCategories();
  fetchArtikel();
});
</script>

<template>
  <div class="page-container">
    <header class="header">
      <h1>Artikelliste</h1>
      <div class="actions-header">
        <button class="btn primary" @click="createNewArtikel">+ Neuer Artikel</button>
        <button class="btn secondary" @click="openAngebotEditor">
          Weiter zur Angebots-Erstellung ({{ cart.length }})
        </button>
      </div>
    </header>

    <div class="filters">
      <input v-model="searchQuery" placeholder="🔍 Suche nach Name oder Code..." />
      <select v-model="selectedCategory">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Lade Artikel...</div>

    <table v-else class="clean-table">
      <thead>
        <tr>
          <th>Bild</th>
          <th>Name</th>
          <th>Code</th>
          <th>Preis (€)</th>
          <th>Lager</th>
          <th>Einheit</th>
          <th>Kategorie</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="art in artikel" :key="art.id">
          <td>
            <img v-if="art.imagePreview" :src="art.imagePreview" class="thumb" @click="clickedImage = art.imagePreview" />
          </td>
          <td>{{ art.name }}</td>
          <td>{{ art.code_nr }}</td>
          <td>{{ art.sales_price?.toFixed(2) }}</td>
          <td>{{ art.stock_tot }}</td>
          <td>{{ art.unit }}</td>
          <td>{{ art.category }}</td>
          <td class="row-actions">
            <button class="btn small" @click="openEditModal(art)">Bearbeiten</button>
            <button class="btn small" @click="addToCart(art)">Warenkorb</button>
            <button class="btn small danger" @click="deleteArtikel(art.id)">Löschen</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination">
      <button :disabled="currentPage===1" @click="currentPage--">◀</button>
      <span>Seite {{ currentPage }} von {{ totalPages }}</span>
      <button :disabled="currentPage===totalPages" @click="currentPage++">▶</button>
    </div>

    <!-- Overlay -->
    <div v-if="clickedImage" class="overlay" @click="clickedImage = null">
      <img :src="clickedImage" />
    </div>

    <EditArtikelModal
      v-if="showEditModal"
      :artikel="selectedArtikel"
      @close="closeEditModal"
      @save="fetchArtikel"
    />

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  color: #222;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.6rem;
  font-weight: 600;
}

.actions-header {
  display: flex;
  gap: 0.5rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  flex: 1;
}

.clean-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.clean-table th {
  background: #f9f9f9;
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.clean-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.clean-table tr:hover {
  background-color: #f6f8fa;
}

.thumb {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
}

.btn {
  padding: 0.4rem 0.7rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn.primary { background: #2563eb; color: white; }
.btn.primary:hover { background: #1e40af; }

.btn.secondary { background: #e5e7eb; color: #111; }
.btn.secondary:hover { background: #d1d5db; }

.btn.small { font-size: 0.85rem; padding: 0.3rem 0.6rem; }
.btn.danger { background: #dc2626; color: white; }
.btn.danger:hover { background: #991b1b; }

.loading { text-align: center; padding: 2rem; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button {
  padding: 0.4rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  background: white;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.overlay img {
  max-width: 80%;
  max-height: 80%;
  border-radius: 10px;
}
.error {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
