<script setup>
// import { ref, watch } from "vue";

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
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <h2>Artikel bearbeiten</h2>
      
      <form @submit.prevent="saveChanges">
        <label for="title">Titel:</label>
        <input id="title" v-model="localArtikel.title" type="text" required />

        <label for="price">Preis:</label>
        <input id="price" v-model="localArtikel.price" type="number" required />

        <label for="category">Kategorie:</label>
        <input id="category" v-model="localArtikel.category" type="text" />

        <div class="buttons">
          <button type="submit">Speichern</button>
          <button type="button" @click="closeModal">Abbrechen</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs, watch } from "vue";

// Props: Artikel-Objekt und Funktion zum Schließen
defineProps({
  artikel: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["close", "save"]);

const localArtikel = reactive({ ...artikel });

// Artikel-Prop beobachten und lokal aktualisieren, falls sich Prop ändert
watch(() => artikel, (newVal) => {
  Object.assign(localArtikel, newVal);
});

function closeModal() {
  emit("close");
}

function saveChanges() {
  emit("save", { ...localArtikel });
  closeModal();
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 6px 8px;
  margin-top: 4px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

button {
  margin-left: 10px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"] {
  background-color: #4CAF50;
  color: white;
}

button[type="button"] {
  background-color: #f44336;
  color: white;
}
</style>
