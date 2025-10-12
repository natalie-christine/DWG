<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { supabase } from "../lib/supabase";
import EditKundenModal from "../components/EditKundenModal.vue"; 

const allKunden = ref([]);
const kunden = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const searchQuery = ref("");
const selectedRegion = ref("Alle");
const regionen = ref([]);

const currentPage = ref(1);
const pageSize = ref(50);
const totalItems = ref(0);

const showEditModal = ref(false);
const selectedKunde = ref(null);

const selectedIds = ref([]);
const selectAll = ref(false);

// Regionen laden (falls vorhanden)
async function fetchRegionen() {
  const { data, error } = await supabase.from("kunden").select("ort");
  if (!error && data) {
    regionen.value = ["Alle", ...new Set(data.map(k => k.region).filter(Boolean))];
  }
}

// Kunden laden
async function fetchKunden() {
  loading.value = true;
  try {
    const { data, error, count } = await supabase
      .from("kunden")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1);
    if (error) throw error;

    allKunden.value = data || [];
    totalItems.value = count || 0;
    applyFilters();
  } catch (err) {
console.error(err);
    errorMessage.value = err.message || "Fehler beim Laden der Kunden";
    allKunden.value = [];
    kunden.value = [];
  } finally {
    loading.value = false;
  }
}

// Filter
function applyFilters() {
  let list = allKunden.value.slice();
  if (selectedRegion.value && selectedRegion.value !== "Alle") {
    list = list.filter(k => k.region === selectedRegion.value);
  }
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase();
    list = list.filter(k =>
      (k.name && k.name.toLowerCase().includes(term)) ||
      (k.firma && k.firma.toLowerCase().includes(term)) ||
      (k.ort  && k.ort.toLowerCase().includes(term)) ||
      (k.kundennummer && k.kundennummer.toString().toLowerCase().includes(term))
    );
  }
  kunden.value = list;
  if (selectAll.value) selectedIds.value = kunden.value.map(k => k.id);
}

// Modal
function openEditModal(kunde) {
  selectedKunde.value = { ...kunde };
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  selectedKunde.value = null;
}

// Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
watch(currentPage, fetchKunden);

// Filter neu anwenden
watch([searchQuery, selectedRegion], applyFilters);

onMounted(() => {
  fetchRegionen();
  fetchKunden();
});
</script>

<template>
  <div class="container">
    <h1 class="title">Kundenverwaltung</h1>

    <!-- Filter & Suche -->
    <div class="filters">
      <input v-model="searchQuery" type="text" placeholder="Suche nach Name, Firma oder Kundennummer..." />
    </div>

    <!-- Tabelle -->
    <div v-if="loading" class="loading">Lade Kunden...</div>
    <div v-else>
      <table class="kunden-table">
        <thead>
          <tr>            
            <th>Kundennummer</th>
            <th>Name</th>
            <th>Firma</th>
            <th>Email</th>
            <th>Region</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="kunde in kunden" :key="kunde.id">
            <td>{{ kunde.nummer }}</td>
            <td>{{ kunde.kontaktperson }}</td>
            <td>{{ kunde.firma }}</td>
            <td>{{ kunde.email }}</td>
            <td>{{ kunde.ort }}</td>
            <td>
              <div class="actions">
                <button class="btn" @click="openEditModal(kunde)">Bearbeiten</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button :disabled="currentPage===1" @click="currentPage--">Zurück</button>
        <span>Seite {{ currentPage }} von {{ totalPages }}</span>
        <button :disabled="currentPage===totalPages" @click="currentPage++">Weiter</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <EditKundenModal
      v-if="showEditModal"
      :kunde="selectedKunde"
      @close="closeEditModal"
      @save="fetchKunden"
    />
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
.filters input,
.filters select {
  padding: 0.5rem;
  font-size: 1rem;
}
.kunden-table {
  width: 100%;
  border-collapse: collapse;
}
.kunden-table th,
.kunden-table td {
  border: 1px solid #ccc;
  text-align: left;
  padding: 0.5rem;
}
.kunden-table tr:hover {
  background-color: #f9f9f9;
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
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }
  .kunden-table th,
  .kunden-table td {
    font-size: 0.9rem;
    padding: 0.3rem;
  }
}
</style>
