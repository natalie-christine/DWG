<template>
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Kundenverwaltung</h1>
  
      <!-- Suchfeld + Neu-Button -->
      <div class="flex items-center mb-4 gap-3">
        <input
          v-model="suchbegriff"
          type="text"
          placeholder="Suche nach Name, Firma oder Nummer..."
          class="border rounded px-3 py-2 flex-1"
        />
        <button @click="neuerKunde" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Neuer Kunde
        </button>
      </div>
  
      <!-- Lade-/Fehlerstatus -->
      <div v-if="ladeStatus === 'laden'" class="text-gray-500">Kunden werden geladen...</div>
      <div v-else-if="ladeStatus === 'fehler'" class="text-red-500">Fehler beim Laden der Kunden.</div>
  
      <!-- Tabelle -->
      <table v-if="gefilterteKunden.length > 0" class="min-w-full border rounded">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2 border cursor-pointer" @click="sortiere('nachname')">
              Nachname <span v-if="sortSpalte === 'nachname'">{{ sortRichtung === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-3 py-2 border cursor-pointer" @click="sortiere('firma')">
              Firma <span v-if="sortSpalte === 'firma'">{{ sortRichtung === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-3 py-2 border cursor-pointer" @click="sortiere('nummer')">
              Nummer <span v-if="sortSpalte === 'nummer'">{{ sortRichtung === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-3 py-2 border text-center">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="kunde in gefilterteKunden" :key="kunde.id">
            <td class="border px-3 py-2">{{ kunde.nachname }}</td>
            <td class="border px-3 py-2">{{ kunde.firma }}</td>
            <td class="border px-3 py-2">{{ kunde.nummer }}</td>
            <td class="border px-3 py-2 text-center">
              <button @click="bearbeiten(kunde)" class="text-blue-600 hover:underline mr-2">Bearbeiten</button>
              <button @click="loeschen(kunde.id)" class="text-red-600 hover:underline">Löschen</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <div v-else-if="ladeStatus === 'fertig'" class="text-gray-500 mt-3">
        Keine Kunden gefunden.
      </div>
  
      <!-- Modal für Bearbeiten/Neu -->
      <div
        v-if="zeigeModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <div class="bg-white p-6 rounded shadow-lg w-96">
          <h2 class="text-lg font-semibold mb-4">
            {{ aktuellerKunde?.id ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen' }}
          </h2>
  
          <div class="space-y-3">
            <input
              v-model="aktuellerKunde.nachname"
              type="text"
              placeholder="Nachname"
              class="border rounded px-3 py-2 w-full"
            />
            <input
              v-model="aktuellerKunde.firma"
              type="text"
              placeholder="Firma"
              class="border rounded px-3 py-2 w-full"
            />
            <input
              v-model="aktuellerKunde.nummer"
              type="text"
              placeholder="Kundennummer"
              class="border rounded px-3 py-2 w-full"
            />
          </div>
  
          <div class="flex justify-end mt-4 gap-2">
            <button @click="zeigeModal = false" class="border px-3 py-2 rounded">Abbrechen</button>
            <button
              @click="speichern"
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { supabase } from "../lib/supabase";
  
  // Reactive states
  const kunden = ref([])
  const ladeStatus = ref('laden')
  const suchbegriff = ref('')
  const sortSpalte = ref('nachname')
  const sortRichtung = ref('asc')
  
  // Modal-Steuerung
  const zeigeModal = ref(false)
  const aktuellerKunde = ref({ nachname: '', firma: '', nummer: '' })
  
  // Kunden laden
  async function ladeKunden() {
    ladeStatus.value = 'laden'
    const { data, error } = await supabase.from('kunden').select('*')
    if (error) {
      console.error(error)
      ladeStatus.value = 'fehler'
    } else {
      kunden.value = data || []
      ladeStatus.value = 'fertig'
    }
  }
  onMounted(ladeKunden)
  
  // Filter und Sortierung
  const gefilterteKunden = computed(() => {
    const s = suchbegriff.value.toLowerCase()
    const sort = [...kunden.value].sort((a, b) => {
      const va = a[sortSpalte.value]?.toString().toLowerCase() || ''
      const vb = b[sortSpalte.value]?.toString().toLowerCase() || ''
      return sortRichtung.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return sort.filter(k =>
      [k.nachname, k.firma, k.nummer].some(v =>
        v?.toString().toLowerCase().includes(s)
      )
    )
  })
  
  // Sortierfunktion
  function sortiere(spalte) {
    if (sortSpalte.value === spalte) {
      sortRichtung.value = sortRichtung.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortSpalte.value = spalte
      sortRichtung.value = 'asc'
    }
  }
  
  // Aktionen
  function neuerKunde() {
    aktuellerKunde.value = { nachname: '', firma: '', nummer: '' }
    zeigeModal.value = true
  }
  
  function bearbeiten(kunde) {
    aktuellerKunde.value = { ...kunde }
    zeigeModal.value = true
  }
  
  async function speichern() {
    const k = aktuellerKunde.value
    if (k.id) {
      const { error } = await supabase.from('kunden').update(k).eq('id', k.id)
      if (error) console.error(error)
    } else {
      const { error } = await supabase.from('kunden').insert([k])
      if (error) console.error(error)
    }
    zeigeModal.value = false
    ladeKunden()
  }
  
  async function loeschen(id) {
    if (!confirm('Diesen Kunden wirklich löschen?')) return
    const { error } = await supabase.from('kunden').delete().eq('id', id)
    if (error) console.error(error)
    ladeKunden()
  }
  </script>
  
  <style scoped>
  table {
    border-collapse: collapse;
  }
  th, td {
    font-size: 0.95rem;
  }
  </style>
  