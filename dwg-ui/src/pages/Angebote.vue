<template>
  <section class="page">
    <h1>Angebote</h1>
    <table class="grid">
      <thead>
        <tr><th>Nr</th><th>Name</th><th>Firma</th><th>Status</th><th>Summe</th><th>PDF</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.name }}</td>
          <td>{{ r.firma }}</td>
          <td>
            <select v-model="r.status" @change="updateStatus(r.id, r.status)">
              <option v-for="s in STATUS" :key="s" :value="s">{{ s }}</option>
            </select>
          </td>
          <td class="num">{{ r.summe?.toFixed(2) }} €</td>
          <td>
            <button class="btn" :disabled="!r.pdf_url" @click="openPdf(r.pdf_url)">Öffnen</button>
            <a class="btn secondary" :href="r.pdf_url" target="_blank" rel="noopener" download>
              Download
            </a>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pager">
      <button @click="prev" :disabled="page===1">‹</button>
      <span>Seite {{ page }}</span>
      <button @click="next" :disabled="rows.length < pageSize">›</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from "../lib/supabase";

const rows = ref([])
const page = ref(1)
const pageSize = 25
const STATUS = ['In Bearbeitung','Gesendet','Akzeptiert','Abgelehnt','In Bestellung','Archiviert']

async function load(){
  const offset = (page.value-1)*pageSize
  const { data, error } = await supabase
    .from('v_angebote_list')
    .select('*')
    .order('created_at', { ascending:false })
    .range(offset, offset+pageSize-1)
  if (!error) rows.value = data || []
}
async function updateStatus(id, newStatus){
  await supabase.from('angebote').update({ status:newStatus }).eq('id', id)
}
function openPdf(url){ if(url) window.open(url, '_blank', 'noopener') }
function next(){ page.value++; load() }
function prev(){ page.value = Math.max(1, page.value-1); load() }

onMounted(load)
</script>

<style scoped>
.page{padding:1rem}
.grid{width:100%; border-collapse:collapse}
.grid th,.grid td{border-bottom:1px solid #eee; padding:.5rem}
.num{text-align:right}
.btn{padding:.3rem .6rem; border:1px solid #ddd; border-radius:6px}
.btn.secondary{background:#f3f4f6}
.pager{display:flex; gap:.5rem; justify-content:flex-end; padding-top:.5rem}
</style>
