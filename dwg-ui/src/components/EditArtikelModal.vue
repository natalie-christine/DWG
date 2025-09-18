<script setup>
import { reactive, ref, watch } from "vue";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

const props = defineProps({
  artikel: { type: Object, required: true }
});
const emit = defineEmits(["close", "save"]);

const localArtikel = reactive({ ...props.artikel });
let originalArtikel = { ...props.artikel };

watch(
  () => props.artikel,
  (newVal) => {
    Object.assign(localArtikel, newVal);
    originalArtikel = { ...newVal };
  },
  { deep: true }
);

const selectedFile = ref(null);

function onFileChange(event) {
  selectedFile.value = event.target.files[0];
}

function getImageUrl(path) {
  if (!path) return null;
  return supabase.storage.from("artikel-bilder").getPublicUrl(path).data.publicUrl;
}


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
    }).then((result) => {
      if (result.isConfirmed) emit("close");
    });
  } else {
    emit("close");
  }
}

async function saveChanges() {
  try {
    let imageUrl = localArtikel.image_url;

    if (selectedFile.value) {
      const safeFileName = `picture/${localArtikel.id}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("artikel-bilder")
        .upload(safeFileName, selectedFile.value, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("artikel-bilder")
        .getPublicUrl(safeFileName);

      imageUrl = data.publicUrl;
    }

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

    emit("save", { ...localArtikel, image_url: imageUrl });
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
        <div class="form-grid">
          <div>
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

          <!-- Bildbereich -->
          <div class="image-section">
            <label>Artikelbild:</label>
            <div v-if="localArtikel.image_url" class="image-preview">
              <img :src="getImageUrl(localArtikel.image_url)" alt="Artikelbild" />
              <small>Bestehendes Bild</small>
              <input type="file" @change="onFileChange" accept="image/*" />
             </div>
             <div v-else>
             <input type="file" @change="onFileChange" accept="image/*" />
             </div>
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
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 700px; /* breiter */
  max-width: 95%;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
label { display: block; margin-top: 10px; font-weight: bold; }
input { width: 100%; padding: 6px 8px; margin-top: 4px; border-radius: 4px; border: 1px solid #ccc; }
.image-section { display: flex; flex-direction: column; align-items: flex-start; }
.image-preview img {
  max-width: 250px;
  max-height: 250px;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin-top: 5px;
}
.buttons { display: flex; justify-content: flex-end; margin-top: 20px; }
button { margin-left: 10px; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; }
button[type="submit"] { background-color: #4CAF50; color: white; }
button[type="button"] { background-color: #f44336; color: white; }
</style>
