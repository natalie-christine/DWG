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

// Watch auf Props
watch(() => props.artikel, (newVal) => {
  Object.assign(localArtikel, newVal);
  originalArtikel = { ...newVal };
}, { deep: true });

// Datei für Upload
const selectedFile = ref(null);

// Datei auswählen
function onFileChange(event) {
  selectedFile.value = event.target.files[0];
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
    let imageUrl = localArtikel.image_url;

    if (selectedFile.value) {
      // Datei sicher benennen
      const safeFileName = `picture/${localArtikel.id}_${Date.now()}_${encodeURIComponent(selectedFile.value.name)}`;

      // Upload in Supabase
      const { data, error: uploadError } = await supabase.storage
        .from("artikel-bilder")
        .upload(safeFileName, selectedFile.value, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL generieren
      const { publicUrl, error: urlError } = supabase.storage
        .from("artikel-bilder")
        .getPublicUrl(safeFileName);

      if (urlError) throw urlError;

      imageUrl = publicUrl;
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
        image_url: imageUrl
      })
      .eq("id", localArtikel.id);

    if (dbError) throw dbError;

    // Event auslösen
    emit("save", { ...localArtikel, image_url: imageUrl });
    emit("close");

    // Erfolgsmeldung
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
        <label>ID:</label>
        <input type="text" v-model="localArtikel.id" disabled />

        <label>Name:</label>
        <input type="text" v-model="localArtikel.name" required />

        <label>Code-Nr:</label>
        <input type="text" v-model="localArtikel.code_nr"  />

        <label>Preis:</label>
        <input type="number" v-model="localArtikel.sales_price" required step="0.01" />

        <label>Lagerstand:</label>
        <input type="number" v-model="localArtikel.stock_tot" />

        <label>Einheit:</label>
        <input type="text" v-model="localArtikel.unit" />

        <label>Kategorie:</label>
        <input type="text" v-model="localArtikel.category" />

        <label>Bild hochladen:</label>
        <input type="file" @change="onFileChange" accept="image/*" />

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
  background:white; padding:20px; border-radius:8px;
  width:400px; max-width:90%;
}
label { display:block; margin-top:10px; font-weight:bold; }
input { width:100%; padding:6px 8px; margin-top:4px; border-radius:4px; border:1px solid #ccc; }
.buttons { display:flex; justify-content:flex-end; margin-top:20px; }
button { margin-left:10px; padding:6px 12px; border:none; border-radius:4px; cursor:pointer; }
button[type="submit"] { background-color:#4CAF50; color:white; }
button[type="button"] { background-color:#f44336; color:white; }
</style>
