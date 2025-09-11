<script setup>
 import { ref, watch } from "vue";

const localArtikel = ref({ ...artikel });

watch(() => artikel, (newVal) => {
  localArtikel.value = { ...newVal };
});

  const saveArtikel = async () => {
    const { error } = await supabase
      .from("artikel")
      .update({
        name: localArtikel.value.name,
        codenr: localArtikel.value.codenr,
        salesprice: localArtikel.value.salesprice,
        stocktot: localArtikel.value.stocktot
      })
      .eq("id", localArtikel.value.id);
  
    if (error) {
      alert("Fehler beim Speichern: " + error.message);
    } else {
      emit("saved");
      emit("close");
    }
  };
  </script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2>Artikel bearbeiten</h2>
      
      <label>
        Name:
        <input v-model="localArtikel.value.name" />

      </label>
      
      <label>
        CodeNr:
        <input v-model="localArtikel.value.codenr" />
      </label>
      
      <label>
        Preis:
        <input type="number" v-model="localArtikel.value.salesprice" />
      </label>
      
      <label>
        Lagerstand:
        <input type="number" v-model="localArtikel.value.stocktot" />
      </label>
      
      <div class="actions">
        <button @click="save('saved')">Speichern</button>
        <button @click="emit('close')">Abbrechen</button>


      </div>
    </div>
  </div>
</template>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top:0; left:0; right:0; bottom:0;
    background: rgba(0,0,0,0.5);
    display:flex;
    justify-content:center;
    align-items:center;
  }
  .modal {
    background: white;
    padding: 1rem 2rem;
    border-radius: 6px;
    min-width: 300px;
  }
  label {
    display:block;
    margin: 0.5rem 0;
  }
  .actions {
    margin-top: 1rem;
    text-align:right;
  }
  button {
    margin-left: 0.5rem;
  }
  </style>
  