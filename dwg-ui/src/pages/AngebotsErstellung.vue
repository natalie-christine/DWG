<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTableMod from "jspdf-autotable";
const autoTable = autoTableMod.default || autoTableMod; // robust für Vite/ESM



const route = useRoute();
const router = useRouter();

const angebotsId = ref("");
const kunden = ref([]);
const selectedKunde = ref(null);
const positionen = ref([]);
const loading = ref(false);
const saving = ref(false);

// Berechnete Gesamtsumme
const gesamtSumme = computed(() =>
  positionen.value.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0)
);

// Kunden laden
async function fetchKunden() {
  const { data, error } = await supabase
    .from("kunden")
    .select("id, kontaktperson, nummer, firma")
    .order("kontaktperson");

  console.log("Kunden:", data, error);
  kunden.value = data || [];
}

// Artikel aus Query übernehmen
onMounted(() => {
  const cartData = route.query.cart ? JSON.parse(route.query.cart) : [];
  positionen.value = cartData.map((a) => ({
    artikel_id: a.id,
    name: a.name,
    menge: 1,
    einzelpreis: a.sales_price || 0,
  }));
  fetchKunden();
});

// Angebots-ID generieren
async function generateAngebotsId() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const { count } = await supabase
    .from("angebote")
    .select("*", { count: "exact", head: true })
    .like("id", `AN${datePart}%`);
  const newId = `AN${datePart}-${String(count + 1).padStart(3, "0")}`;
  angebotsId.value = newId;
  return newId;
}

// PDF erzeugen
async function generatePDF(angebotId, kunde, positionen, summe) {
  const pdf = new jsPDF(); // nicht "doc" verwenden

  pdf.setFontSize(16);
  pdf.text("ANGEBOT", 14, 20);
  pdf.setFontSize(10);
  pdf.text(`Angebotsnummer: ${angebotId}`, 14, 28);
  pdf.text(`Datum: ${new Date().toLocaleDateString("de-DE")}`, 14, 33);

  pdf.setFontSize(11);
  pdf.text("Kunde:", 14, 45);
  pdf.setFontSize(10);
  pdf.text(`${kunde.nummer || ""} - ${kunde.kontaktperson || ""}`, 14, 50);
  if (kunde.firma) pdf.text(kunde.firma, 14, 55);

  const tableData = positionen.map(p => [
    p.name,
    p.menge,
    `${p.einzelpreis.toFixed(2)} €`,
    `${(p.menge * p.einzelpreis).toFixed(2)} €`,
  ]);

  autoTable(pdf, {
    startY: 65,
    head: [["Artikel", "Menge", "Einzelpreis", "Gesamt"]],
    body: tableData,
  });

  const sumY = (pdf.lastAutoTable?.finalY || 65) + 10;
  pdf.setFontSize(12);
  pdf.text(`Gesamtsumme: ${summe.toFixed(2)} €`, 140, sumY, { align: "right" });

  const text = `
Vielen Dank für Ihre Anfrage.
Wir freuen uns, Ihnen folgendes Angebot zu unterbreiten.
Die Preise verstehen sich netto, zuzüglich gesetzlicher Mehrwertsteuer.
Dieses Angebot ist 14 Tage gültig.

Mit freundlichen Grüßen
Ihr DWG-Team
  `;
  pdf.setFontSize(10);
  pdf.text(text.trim(), 14, sumY + 15);

  return pdf.output("blob");
}

// Angebot speichern
async function saveAngebot() {
  if (!selectedKunde.value) {
    Swal.fire("Fehler", "Bitte einen Kunden auswählen.", "error");
    return;
  }
  if (positionen.value.length === 0) {
    Swal.fire("Fehler", "Ein Angebot benötigt mindestens einen Artikel.", "error");
    return;
  }

  try {
    saving.value = true;
    const id = await generateAngebotsId();

    const kunde = kunden.value.find((k) => Number(k.id) === Number(selectedKunde.value));
    if (!kunde) throw new Error("Kunde konnte nicht gefunden werden.");

    const { error: insertError } = await supabase.from("angebote").insert([
      {
        id,
        kunde_id: selectedKunde.value,
        summe: gesamtSumme.value,
        status: "In Bearbeitung",
      },
    ]);
    if (insertError) throw insertError;

    const posData = positionen.value.map((p) => ({
      angebot_id: id,
      artikel_id: p.artikel_id,
      menge: p.menge,
      einzelpreis: p.einzelpreis,
    }));
    const { error: posError } = await supabase.from("angebot_positionen").insert(posData);
    if (posError) throw posError;

    const pdfBlob = await generatePDF(id, kunde, positionen.value, gesamtSumme.value);
    const { error: uploadError } = await supabase.storage
      .from("angebote-pdf")
      .upload(`${id}.pdf`, pdfBlob, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("angebote-pdf")
      .getPublicUrl(`${id}.pdf`);
    const pdfUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("angebote")
      .update({ pdf_url: pdfUrl })
      .eq("id", id);
    if (updateError) throw updateError;

    Swal.fire({
      title: "Gespeichert",
      text: `Angebot ${id} wurde erfolgreich erstellt und PDF generiert.`,
      icon: "success",
      timer: 2500,
      showConfirmButton: false,
    });

    router.push("/");
  } catch (err) {
    console.error(err);
    Swal.fire("Fehler", err.message, "error");
  } finally {
    saving.value = false;
  }
}

function removePosition(index) {
  positionen.value.splice(index, 1);
}
</script>

<template>
  <div class="angebot-page">
    <h1>Neues Angebot erstellen</h1>

    <div class="form-section">
      <label>Kunde auswählen:</label>
      <select v-model.number="selectedKunde">
        <option disabled :value="null">-- Kunde wählen --</option>
        <option v-for="k in kunden" :key="k.id" :value="k.id">
          {{ k.nummer }} - {{ k.kontaktperson }} ({{ k.firma }})
        </option>
      </select>
      <p style="margin-top:10px;color:#666;">Ausgewählter Kunde: {{ selectedKunde }}</p>
    </div>

    <div class="table-wrapper">
      <table class="angebot-table">
        <thead>
          <tr>
            <th>Artikel</th>
            <th>Menge</th>
            <th>Einzelpreis (€)</th>
            <th>Gesamt (€)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in positionen" :key="p.artikel_id">
            <td>{{ p.name }}</td>
            <td><input type="number" min="1" v-model.number="p.menge" class="input" /></td>
            <td><input type="number" min="0" step="0.01" v-model.number="p.einzelpreis" class="input" /></td>
            <td>{{ (p.menge * p.einzelpreis).toFixed(2) }}</td>
            <td><button class="btn small danger" @click="removePosition(i)">✕</button></td>
          </tr>
          <tr v-if="positionen.length === 0">
            <td colspan="5" class="no-items">Keine Artikel ausgewählt</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <h3>Gesamtsumme: {{ gesamtSumme.toFixed(2) }} €</h3>
    </div>

    <div class="actions">
      <button class="btn secondary" @click="router.push('/')">Abbrechen</button>
      <button class="btn primary" :disabled="saving" @click="saveAngebot">
        {{ saving ? "Speichern..." : "Angebot speichern + PDF" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.angebot-page {
  max-width: 1000px;
  margin: auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  color: #222;
}
h1 {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
}
.form-section {
  margin-bottom: 1.5rem;
}
select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  width: 100%;
}
.table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0,0,0,0.05);
  overflow: hidden;
}
.angebot-table {
  width: 100%;
  border-collapse: collapse;
}
.angebot-table th, .angebot-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}
.angebot-table th {
  background: #f9f9f9;
  font-weight: 600;
}
.input {
  width: 80px;
  padding: 0.3rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: right;
}
.no-items {
  text-align: center;
  color: #666;
  padding: 1rem;
}
.summary {
  text-align: right;
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}
.btn.primary {
  background: #2563eb;
  color: white;
}
.btn.primary:hover {
  background: #1e40af;
}
.btn.secondary {
  background: #e5e7eb;
  color: #111;
}
.btn.secondary:hover {
  background: #d1d5db;
}
.btn.danger {
  background: #dc2626;
  color: white;
}
.btn.danger:hover {
  background: #991b1b;
}
.btn.small {
  font-size: 0.85rem;
  padding: 0.3rem 0.6rem;
}
</style>
