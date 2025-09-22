<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

// Props & Events
const props = defineProps({
  artikel: { type: Object, required: true }
});
const emit = defineEmits(["close", "save"]);

// Lokale Kopie für Bearbeitung
const localArtikel = reactive({ ...props.artikel });
let originalArtikel = { ...props.artikel };

// Datei für Upload
const selectedFile = ref(null);
const imagePreview = ref(null);

// Watch auf Props
watch(() => props.artikel, (newVal) => {
  Object.assign(localArtikel, newVal);
  originalArtikel = { ...newVal };
  imagePreview.value = getImageUrl(localArtikel.image_url);
}, { deep: true });

// Beim Mount direkt Preview setzen
onMounted(() => {
  imagePreview.value = getImageUrl(localArtikel.image_url);
});

// Datei auswählen
function onFileChange(event) {
  selectedFile.value = event.target.files[0];
  if (selectedFile.value) {
    imagePreview.value = URL.createObjectURL(selectedFile.value);
  }
}

// Supabase Public URL generieren
function getImageUrl(path) {
  console.log("getImageUrl Input:", path);
  if (!path) return null;
  const { data, error } = supabase.storage.from("artikel-bilder").getPublicUrl(path);
  console.log("getImageUrl Output:", data, error);
  if (error) return null;
  return data.publicUrl;
}


// Modal schließen
function closeModal() {
  const changed = JSON.stringify(localArtikel) !== JSON.stringify(originalArtikel);
  if (changed) {
    Swal.fire({
      title: "Ungespeicherte Änderungen",
      text: "Es gibt ungespeicherte Änderungen. Wollen Sie das Fenster wirklich schließen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ja, schließen",
      cancelButtonText: "Abbrechen"
    }).then(result => {
      if (result.isConfirmed) emit("close");
    });
  } else {
    emit("close");
  }
}

// Änderungen speichern
async function saveChanges() {
  try {
    let imagePath = localArtikel.image_url; // nur Pfad speichern

    if (selectedFile.value) {
      const safeFileName = `picture/${localArtikel.id}_${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("artikel-bilder")
        .upload(safeFileName, selectedFile.value, { upsert: true });

      if (uploadError) throw uploadError;

      imagePath = safeFileName; // Nur den Pfad merken
    }

    // Artikel in DB aktualisieren
    const { error: dbError } = await supabase
      .from("artikel")
      .update({
        name: localArtikel.name,
        code_nr: localArtikel.code_nr,
        sales_price: localArtikel.sales_price,
        stock_tot: localArtikel.stock_tot,
        unit: localArtikel.unit,
        category: localArtikel.category,
        image_url: imagePath // nur den Pfad speichern
      })
      .eq("id", localArtikel.id);

    if (dbError) throw dbError;

    // Preview sofort aktualisieren
    imagePreview.value = getImageUrl(imagePath);

    emit("save", { ...localArtikel, image_url: imagePath });
    emit("close");

    await Swal.fire({
      title: "Gespeichert",
      text: "Die Änderungen wurden erfolgreich gespeichert.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    Swal.fire("Fehler", err.message, "error");
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2>Artikel bearbeiten</h2>

      <form @submit.prevent="saveChanges">
        <div class="form-row">
          <label>ID:</label>
          <input type="text" v-model="localArtikel.id" disabled />

          <label>Name:</label>
          <input type="text" v-model="localArtikel.name" required />

          <label>Code-Nr:</label>
          <input type="text" v-model="localArtikel.code_nr" />

          <label>Preis:</label>
          <input type="number" v-model="localArtikel.sales_price" required step="0.01" />

          <label>Lagerstand:</label>
          <input type="number" v-model="localArtikel.stock_tot" />

          <label>Einheit:</label>
          <input type="text" v-model="localArtikel.unit" />

          <label>Kategorie:</label>
          <input type="text" v-model="localArtikel.category" />
        </div>

        <!-- Bild Vorschau -->
        <div class="image-section">
          <label>Bild:</label>
          <input type="file" @change="onFileChange" accept="image/*" />
          <div v-if="imagePreview" class="mt-2">
            <img :src="imagePreview" class="preview-img" />
          </div>
        </div>

        <div class="buttons">
          <button type="submit">Speichern</button>
          <button type="button" @click="closeModal">Abbrechen</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top:0; left:0;
  width:100%; height:100%;
  background: rgba(0,0,0,0.5);
  display:flex; justify-content:center; align-items:center;
  z-index:1000;
}
.modal {
  background:white;
  padding:20px;
  border-radius:8px;
  width:700px;
  max-width:95%;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
label {
  display:block; 
  margin-top:10px; 
  font-weight:bold;
}
input {
  width:100%; 
  padding:6px 8px; 
  margin-top:4px; 
  border-radius:4px; 
  border:1px solid #ccc;
}
.image-section {
  margin-top: 15px;
}
.buttons {
  display:flex; 
  justify-content:flex-end; 
  margin-top:20px;
}
button { 
  margin-left:10px; 
  padding:6px 12px; 
  border:none; 
  border-radius:4px; 
  cursor:pointer; 
}
button[type="submit"] { background-color:#4CAF50; color:white; }
button[type="button"] { background-color:#f44336; color:white; }
.preview-img { max-width: 100%; max-height: 200px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; }
</style>
