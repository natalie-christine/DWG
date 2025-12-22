<template>
  <div class="page">
    <h1>Dashboard</h1>

    <div v-if="loading">Lade…</div>
    <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>

    <div v-else class="grid dashboard-grid">
      <div class="panel card">
        <div class="title">Artikel</div>
        <div class="kpiValue">{{ artikelTotal }}</div>
        <div class="muted">
          Geringer Lagerstand (≤ {{ artikelThreshold }}): <b>{{ artikelLow }}</b>
        </div>
      </div>

      <div class="panel card">
        <div class="title">Kunden</div>
        <div class="kpiValue">{{ kundenCount }}</div>
        <div class="muted">Gesamt</div>
      </div>

      <div class="panel card">
        <div class="title">Angebote</div>
        <div class="kpiValue">{{ angeboteCount }}</div>
        <div class="muted">Geschrieben</div>
      </div>

      <div class="panel card">
        <div class="title">Bestellungen</div>
        <div class="kpiValue">{{ bestellungenCount }}</div>
        <div class="muted">Ausgelöst</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  getArtikelStats,
  getKundenCount,
  getAngeboteCount,
  getBestellungenCount,
} from "../services/dashboardStats";

const loading = ref(true);
const errorMsg = ref(null);

const artikelTotal = ref(0);
const artikelLow = ref(0);
const artikelThreshold = ref(5);

const kundenCount = ref(0);
const angeboteCount = ref(0);
const bestellungenCount = ref(0);

onMounted(async () => {
  loading.value = true;
  errorMsg.value = null;

  try {
    const [artikel, kunden, angebote, bestellungen] = await Promise.all([
      getArtikelStats(),
      getKundenCount(),
      getAngeboteCount(),
      getBestellungenCount(),
    ]);

    artikelTotal.value = artikel.total || 0;
    artikelLow.value = artikel.lowStock || 0;
    artikelThreshold.value = artikel.threshold || 5;

    kundenCount.value = kunden || 0;
    angeboteCount.value = angebote || 0;
    bestellungenCount.value = bestellungen || 0;
  } catch (e) {
    console.error(e);
    errorMsg.value = e?.message || "Fehler beim Laden der Dashboard-Daten.";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard-grid{
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.card{
  padding: 14px;
}
.title{
  font-size: 18px;
  font-weight: 700;
  opacity: .85;
}
.kpiValue{
  font-size: 34px;
  font-weight: 800;
  margin-top: 6px;
}
.muted{
  color: var(--muted, #6b7280);
  font-size: 16px;
  margin-top: 6px;
}
.error{
  color: #b00020;
}
@media (max-width: 900px){
  .dashboard-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px){
  .dashboard-grid{ grid-template-columns: 1fr; }
}
</style>
