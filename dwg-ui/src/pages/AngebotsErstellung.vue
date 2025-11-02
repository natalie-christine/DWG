<template>
  <div class="angebot-page">
    <h1>Neues Angebot erstellen</h1>

    <!-- Kundenauswahl -->
    <div class="form-section">
      <label for="kundeInput">Kunde auswählen</label>

      <!-- Accessible Combobox: Input + Listbox -->
      <div class="combo" ref="comboBoxEl">
        <input
          id="kundeInput"
          v-model.trim="kundeQuery"
          type="text"
          class="combo-input"
          :placeholder="selectedKundeObj ? displayKunde(selectedKundeObj) : 'Name, Firma oder Kundennummer eingeben'"
          role="combobox"
          :aria-expanded="showKundeList ? 'true' : 'false'"
          :aria-controls="'kunde-list'"
          aria-autocomplete="list"
          @focus="openKundeList()"
          @input="onKundeQuery()"
          @keydown.down.prevent="moveKunde(1)"
          @keydown.up.prevent="moveKunde(-1)"
          @keydown.enter.prevent="selectActiveKunde()"
          @keydown.esc.prevent="closeKundeList()"
        />
        <button class="combo-clear" v-if="kundeQuery || selectedKunde" @click="clearKunde()" aria-label="Eingabe löschen">×</button>

        <ul
          v-show="showKundeList"
          :id="'kunde-list'"
          class="combo-panel"
          :class="{ 'drop-up': dropUp }"
          role="listbox"
        >
          <li v-if="kundeLoading" class="opt muted">Lade Kunden…</li>
          <li v-else-if="filteredKunden.length === 0" class="opt muted">Keine Treffer</li>
          <li
            v-for="(k, idx) in filteredKunden"
            :key="k.id"
            class="opt"
            :class="{ active: idx === activeKundeIdx, selected: Number(selectedKunde) === Number(k.id) }"
            role="option"
            :aria-selected="Number(selectedKunde) === Number(k.id)"
            @mouseenter="activeKundeIdx = idx"
            @mousedown.prevent="selectKunde(k)"
          >
            <span class="opt-knr">{{ k.nummer || '—' }}</span>
            <span class="opt-firma" :title="k.firma">{{ k.firma || '—' }}</span>
            <span class="opt-name" :title="k.kontaktperson">{{ k.kontaktperson || '—' }}</span>
          </li>
        </ul>
      </div>

      <p class="muted" v-if="selectedKundeObj">
        Ausgewählt: {{ displayKunde(selectedKundeObj) }}
      </p>
    </div>

    <!-- Artikel hinzufügen (Combobox) -->
    <div class="form-section">
      <label for="artInput">Artikel hinzufügen</label>

      <div class="combo" ref="artComboEl">
        <input
          id="artInput"
          v-model.trim="artQuery"
          type="text"
          class="combo-input"
          placeholder="Artikel-ID, Nummer oder Name…"
          role="combobox"
          :aria-expanded="showArtList ? 'true' : 'false'"
          :aria-controls="'art-list'"
          aria-autocomplete="list"
          @focus="openArtList"
          @input="onArtInput"
          @keydown.down.prevent="moveArt(1)"
          @keydown.up.prevent="moveArt(-1)"
          @keydown.enter.prevent="selectActiveArticle"
          @keydown.esc.prevent="closeArtList"
        />
        <button class="combo-clear" v-if="artQuery" @click="artQuery=''; openArtList()" aria-label="Eingabe löschen">×</button>

        <ul
          v-show="showArtList"
          :id="'art-list'"
          class="combo-panel"
          :class="{ 'drop-up': artDropUp }"
          role="listbox"
        >
          <li v-if="articlesLoading" class="opt muted">Lade Artikel…</li>
          <li v-else-if="filteredArticles.length === 0" class="opt muted">Keine Treffer</li>

          <li
            v-for="(a, idx) in filteredArticles"
            :key="a.id"
            class="opt opt-article"
            :class="{ active: idx === artActiveIdx }"
            role="option"
            :aria-selected="idx === artActiveIdx"
            @mouseenter="artActiveIdx = idx"
            @mousedown.prevent="pickArticle(a)"
          >
            <span class="opt-id">#{{ a.id }}</span>
            <span class="opt-artnr">{{ getCodeNr(a) || '—' }}</span>
            <span class="opt-artname" :title="a.name">{{ a.name }}</span>
            <span class="opt-preis">{{ Number(a.sales_price || 0).toFixed(2) }} €</span>

            <button
              class="btn small"
              :class="{ success: isInPositions(a.id) }"
              @mousedown.stop
              @click.stop="pickArticle(a)"
            >
              {{ isInPositions(a.id) ? '✓ Hinzugefügt' : '+ Hinzufügen' }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Positionstabelle -->
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
  	      <td><div class="ellipsis" :title="p.name">{{ p.name }}</div></td>
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
        {{ saving ? 'Speichern…' : 'Angebot speichern + PDF' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { supabase } from '../lib/supabase'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import autoTableMod from 'jspdf-autotable'
const autoTable = autoTableMod.default || autoTableMod

const route = useRoute()
const router = useRouter()

// ---- Angebot State ----
const angebotsId = ref('')
const kunden = ref([])
const selectedKunde = ref(null) // stores id
const positionen = ref([])
const saving = ref(false)

const gesamtSumme = computed(() =>
  positionen.value.reduce((sum, p) => sum + (Number(p.menge)||0) * (Number(p.einzelpreis)||0), 0)
)

// ---- Kunden laden & filtern ----
const kundeLoading = ref(false)
const kundeQuery = ref('')
const showKundeList = ref(false)
const activeKundeIdx = ref(0)
const dropUp = ref(false)
const comboBoxEl = ref(null)

// --- Artikel-Combobox: State ---
const articles = ref([])
const articlesLoading = ref(false)
const artQuery = ref('')
const showArtList = ref(false)
const artActiveIdx = ref(0)
const artComboEl = ref(null)
const artDropUp = ref(false)

const filteredKunden = computed(() => {
  const q = norm(kundeQuery.value)
  if (!q) return kunden.value.slice(0, 200)
  return kunden.value
    .filter(k => {
      const name = norm(k.kontaktperson||'')
      const firma = norm(k.firma||'')
      const knr = norm(String(k.nummer||''))
      return name.includes(q) || firma.includes(q) || knr.includes(q)
    })
    .slice(0, 200)
})

const selectedKundeObj = computed(() => {
  if (selectedKunde.value == null) return null
  return kunden.value.find(k => Number(k.id) === Number(selectedKunde.value)) || null
})

function norm(s){
  return String(s).toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'')
}

async function fetchKunden(){
  kundeLoading.value = true
  try {
    const { data, error } = await supabase
      .from('kunden')
      .select('id, kontaktperson, nummer, firma, email')
      .order('kontaktperson')
    if (error) throw error
    kunden.value = data || []
  } catch (e) {
    console.error('fetchKunden failed:', e)
  } finally {
    kundeLoading.value = false
  }
}

function displayKunde(k){
  return `${k.nummer || ''} - ${k.kontaktperson || ''}${k.firma ? ' ('+k.firma+')' : ''}`.trim()
}

function openKundeList(){
  showKundeList.value = true
  nextTick(() => {
    const r = comboBoxEl.value?.getBoundingClientRect?.()
    if (r){
      const spaceBelow = window.innerHeight - r.bottom
      dropUp.value = spaceBelow < 260
    }
  })
}
function closeKundeList(){ showKundeList.value = false }
function onKundeQuery(){ openKundeList(); activeKundeIdx.value = 0 }
function moveKunde(d){
  if (!filteredKunden.value.length) return
  const next = Math.max(0, Math.min(filteredKunden.value.length-1, activeKundeIdx.value + d))
  activeKundeIdx.value = next
}
function selectActiveKunde(){
  const k = filteredKunden.value[activeKundeIdx.value]
  if (k) selectKunde(k)
}
function selectKunde(k){
  selectedKunde.value = Number(k.id)
  kundeQuery.value = `${k.nummer || ''} - ${k.kontaktperson || ''} ${k.firma ? '('+k.firma+')' : ''}`.trim()
  closeKundeList()
}
function clearKunde(){
  kundeQuery.value = ''
  selectedKunde.value = null
  openKundeList()
}

// ---- Artikel-Helfer/Filter ----
 function getCodeNr(a) {
   return a?.code_nr ?? a?.codeNr ?? a?.artikelnummer ?? a?.artikel_nr ?? a?.nummer ?? '';
 }

function formatPrice(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function normStr(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '')
}
function isInPositions(id){
  return positionen.value.some(p => Number(p.artikel_id) === Number(id))
}

// ---- Initial Positionen aus Query übernehmen ----
const initFromRoute = () => {
  const cartData = route.query?.cart ? JSON.parse(route.query.cart) : []
  positionen.value = (Array.isArray(cartData) ? cartData : []).map(a => ({
    artikel_id: a.id,
    name: a.name,
    menge: 1,
    einzelpreis: a.sales_price || 0
  }))
}

// ---- Artikel laden ----
async function fetchArticles() {
  articlesLoading.value = true
  try {
    const { data, error } = await supabase
      .from('artikel')
      .select('*')
    if (error) throw error

    articles.value = (data || []).map(a => ({
  id: a.id,
  name: a.name ?? a.bezeichnung ?? '',
  code_nr: getCodeNr(a),
  artikelnummer: getCodeNr(a),
  sales_price: Number(a.sales_price ?? a.preis ?? a.price ?? 0),
}))

    console.debug('[articles] rows:', articles.value.length)
  } catch (e) {
    console.error('fetchArticles failed:', e)
  } finally {
    articlesLoading.value = false
  }
}

// ---- Artikel filtern + Interaktion ----
const filteredArticles = computed(() => {
  const q = normStr(artQuery.value)
  if (!q) return articles.value.slice(0, 200)
  return articles.value
    .filter(a => {
      const n = normStr(a.name)
      const nr = normStr(a.artikelnummer || '')
      const idm = String(a.id).includes(artQuery.value.trim())
      return n.includes(q) || nr.includes(q) || idm
    })
    .slice(0, 200)
})

function openArtList() {
  showArtList.value = true
  nextTick(() => {
    const r = artComboEl.value?.getBoundingClientRect?.()
    if (r) {
      const spaceBelow = window.innerHeight - r.bottom
      artDropUp.value = spaceBelow < 260
    }
  })
}
function closeArtList() { showArtList.value = false }
function onArtInput() { openArtList(); artActiveIdx.value = 0 }
function moveArt(delta) {
  if (!filteredArticles.value.length) return
  const n = Math.max(0, Math.min(filteredArticles.value.length - 1, artActiveIdx.value + delta))
  artActiveIdx.value = n
}
function selectActiveArticle() {
  const a = filteredArticles.value[artActiveIdx.value]
  if (a) pickArticle(a)
}

// fügt Artikel hinzu oder erhöht Menge
function addArticleToPositions(a) {
  const idx = positionen.value.findIndex(p => Number(p.artikel_id) === Number(a.id))
  if (idx >= 0) {
    positionen.value[idx].menge = Number(positionen.value[idx].menge || 0) + 1
  } else {
    positionen.value.push({
      artikel_id: a.id,
      name: a.name,
      menge: 1,
      einzelpreis: Number(a.sales_price || 0),
    })
  }
  artQuery.value = ''
}

function pickArticle(a) {
  addArticleToPositions(a)
  closeArtList() // nach Auswahl schließen
}

// ---- Click-Outside zum Schließen beider Comboboxen ----
function onDocClick(e){
  if (showArtList.value && artComboEl.value && !artComboEl.value.contains(e.target)) {
    closeArtList()
  }
  if (showKundeList.value && comboBoxEl.value && !comboBoxEl.value.contains(e.target)) {
    closeKundeList()
  }
}

// ---- Mount / Unmount ----
onMounted(async () => {
  initFromRoute()
  document.addEventListener('click', onDocClick, { capture: true })
  await Promise.all([fetchKunden(), fetchArticles()])
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, { capture: true })
})

// ---- Angebot-ID generieren ----
async function generateAngebotsId(){
  const today = new Date()
  const datePart = today.toISOString().slice(0,10).replace(/-/g,'')
  const { count } = await supabase
    .from('angebote')
    .select('*', { count: 'exact', head: true })
    .like('id', `AN${datePart}%`)
    const newId = `AN${datePart}-${String((count||0)+1).padStart(3,'0')}`
  angebotsId.value = newId
  return newId
}

// ---- PDF erzeugen ----
async function generatePDF(angebotId, kunde, positionen, summe){
  const pdf = new jsPDF()
  pdf.setFontSize(16)
  pdf.text('ANGEBOT', 14, 20)
  pdf.setFontSize(10)
  pdf.text(`Angebotsnummer: ${angebotId}`, 14, 28)
  pdf.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 14, 33)

  pdf.setFontSize(11)
  pdf.text('Kunde:', 14, 45)
  pdf.setFontSize(10)
  pdf.text(`${kunde.nummer || ''} - ${kunde.kontaktperson || ''}`, 14, 50)
  if (kunde.firma) pdf.text(String(kunde.firma), 14, 55)

  const rows = (positionen||[]).map(p => [
    String(p.name||''),
    String(p.menge||0),
    `${Number(p.einzelpreis||0).toFixed(2)} €`,
    `${(Number(p.menge||0)*Number(p.einzelpreis||0)).toFixed(2)} €`
  ])
  autoTable(pdf, { startY: 65, head: [['Artikel','Menge','Einzelpreis','Gesamt']], body: rows })

  const sumY = (pdf.lastAutoTable?.finalY || 65) + 10
  pdf.setFontSize(12)
  pdf.text(`Gesamtsumme: ${summe.toFixed(2)} €`, 140, sumY, { align: 'right' })

  const text = `
Vielen Dank für Ihre Anfrage.
Wir freuen uns, Ihnen folgendes Angebot zu unterbreiten.
Die Preise verstehen sich netto, zuzüglich gesetzlicher Mehrwertsteuer.
Dieses Angebot ist 14 Tage gültig.

Mit freundlichen Grüßen
Ihr DWG-Team
  `
  pdf.setFontSize(10)
  pdf.text(text.trim(), 14, sumY + 15)

  return pdf.output('blob')
}

// ---- Speichern + Upload + Open-Prompt ----
async function saveAngebot(){
  if (!selectedKunde.value){
    await Swal.fire('Fehler','Bitte einen Kunden auswählen.','error')
    return
  }
  if (!positionen.value.length){
    await Swal.fire('Fehler','Ein Angebot benötigt mindestens einen Artikel.','error')
    return
  }

  try{
    saving.value = true
    const id = await generateAngebotsId()

    const kunde = kunden.value.find(k => Number(k.id) === Number(selectedKunde.value))
    if (!kunde) throw new Error('Kunde konnte nicht gefunden werden.')

    const { error: insErr } = await supabase.from('angebote').insert([{
      id,
      kunde_id: selectedKunde.value,
      summe: gesamtSumme.value,
      status: 'In Bearbeitung'
    }])
    if (insErr) throw insErr

    const posData = positionen.value.map(p => ({
      angebot_id: id,
      artikel_id: p.artikel_id,
      menge: p.menge,
      einzelpreis: p.einzelpreis
    }))
    const { error: posErr } = await supabase.from('angebot_positionen').insert(posData)
    if (posErr) throw posErr

    const pdfBlob = await generatePDF(id, kunde, positionen.value, gesamtSumme.value)
    const { error: upErr } = await supabase.storage.from('angebote-pdf').upload(`${id}.pdf`, pdfBlob, { upsert: true })
    if (upErr) throw upErr

    const { data: urlData } = await supabase.storage.from('angebote-pdf').getPublicUrl(`${id}.pdf`)
    const pdfUrl = urlData?.publicUrl

    const { error: updErr } = await supabase.from('angebote').update({ pdf_url: pdfUrl }).eq('id', id)
    if (updErr) throw updErr

    const res = await Swal.fire({
      title: `Angebot ${id} erstellt`,
      text: 'PDF jetzt öffnen?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Ja, öffnen',
      cancelButtonText: 'Später'
    })

    if (res.isConfirmed && pdfUrl){
      window.open(pdfUrl, '_blank', 'noopener')
    }

    // router.push('/angebote')
  }catch(err){
    console.error(err)
    await Swal.fire('Fehler', err.message || 'Unbekannter Fehler', 'error')
  }finally{
    saving.value = false
  }
}

function removePosition(i){
  positionen.value.splice(i,1)
}
</script>

<style scoped>
.angebot-page{max-width:1000px;margin:auto;padding:2rem;font-family:system-ui,sans-serif;color:#222}
h1{font-size:1.6rem;font-weight:600;margin-bottom:1.2rem}
.form-section{margin-bottom:1.5rem}
.muted{color:#6b7280;font-size:.9rem;margin-top:.25rem}

/* Combobox */
.combo{position:relative;display:flex;align-items:center;gap:.5rem}
.combo-input{flex:1;min-width:0;padding:.55rem .75rem;border-radius:6px;border:1px solid #ccc;font-size:1rem}
.combo-input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.15)}
.combo-clear{position:absolute;right:.4rem;background:none;border:none;font-size:1.2rem;line-height:1;color:#666;cursor:pointer}

/* Dropdown panel that never overflows viewport */
.combo-panel{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:30;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.08);max-height:40vh;overflow:auto}
.combo-panel.drop-up{top:auto;bottom:calc(100% + 4px)}
.opt{display:grid;grid-template-columns:120px 1fr 1fr;gap:.5rem;align-items:center;padding:.5rem .75rem;cursor:pointer}
.opt:hover,.opt.active{background:#f3f4f6}
.opt.selected{outline:2px solid #2563eb}
.opt-knr{font-variant-numeric:tabular-nums;color:#111827}
.opt-firma{color:#111827;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.opt-name{color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Table */
.table-wrapper{background:#fff;border-radius:8px;box-shadow:0 0 8px rgba(0,0,0,.05);overflow:hidden}
.angebot-table{width:100%;border-collapse:collapse}
.angebot-table th,.angebot-table td{padding:.75rem;border-bottom:1px solid #eee}
.angebot-table th{background:#f9f9f9;font-weight:600}
.ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.input{width:90px;padding:.3rem;border:1px solid #ccc;border-radius:4px;text-align:right}
.no-items{text-align:center;color:#666;padding:1rem}
.summary{text-align:right;margin-top:1rem;font-size:1.2rem;font-weight:600}
.actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.5rem}
.btn{padding:.5rem 1rem;border:none;border-radius:6px;cursor:pointer;transition:background .2s;font-size:1rem}
.btn.primary{background:#2563eb;color:#fff}
.btn.primary:hover{background:#1e40af}
.btn.secondary{background:#e5e7eb;color:#111}
.btn.secondary:hover{background:#d1d5db}
.btn.danger{background:#dc2626;color:#fff}
.btn.danger:hover{background:#991b1b}
.btn.small{font-size:.85rem;padding:.3rem .6rem}
.btn.success{background:#16a34a;color:#fff}
.btn.success:hover{background:#15803d}

/* Artikelzeilen im Dropdown */
.opt-article{
  grid-template-columns: 64px 140px 1fr 100px auto;
  align-items: center;
}
.opt-id{ color:#6b7280; font-variant-numeric: tabular-nums; }
.opt-artnr{ font-variant-numeric: tabular-nums; color:#111827; }
.opt-artname{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.opt-preis{ text-align:right; padding:0 .5rem; color:#111; }
</style>
