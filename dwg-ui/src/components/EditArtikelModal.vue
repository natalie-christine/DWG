<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import Swal from "sweetalert2";

const props = defineProps({
  artikel: { type: Object, required: true }
});
const emit = defineEmits(["close", "save"]);

const localArtikel = reactive({ ...props.artikel });
let originalArtikel = { ...props.artikel };
const selectedFile = ref(null);
const imagePreview = ref(null);

watch(
  () => props.artikel,
  (newVal) => {
    Object.assign(localArtikel, newVal);
    originalArtikel = { ...newVal };
    imagePreview.value = getImageUrl(localArtikel.image_url);
  },
  { deep: true }
);

onMounted(() => {
  imagePreview.value = getImageUrl(localArtikel.image_url);
});

function onFileChange(event) {
  selectedFile.value = event.target.files[0];
  if (selectedFile.value) {
    imagePreview.value = URL.createObjectURL(selectedFile.value);
  }
}

function getImageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from("artikel-bilder").getPublicUrl(path);
  return data?.publicUrl || null;
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
    }).then(result => {
      if (result.isConfirmed) emit("close");
    });
  } else {
    emit("close");
  }
}

async function saveChanges() {
  try {
    // --- Pflichtfelder prüfen ---
    if (!localArtikel.name) throw new Error("Name ist erforderlich.");
    if (!localArtikel.code_nr) throw new Error("Code-Nr ist erforderlich.");

    // --- Duplikatsprüfung (nur bei Neuanlage oder geänderter code_nr) ---
    const isNew = !localArtikel.id;
    if (isNew || localArtikel.code_nr !== originalArtikel.code_nr) {
      const { data: dup } = await supabase
        .from("artikel")
        .select("id")
        .eq("code_nr", localArtikel.code_nr);

      if (dup && dup.length > 0) {
        throw new Error("Diese Code-Nr existiert bereits.");
      }
    }

    // --- Bild hochladen falls neu ---
    let imagePath = localArtikel.image_url;
    if (selectedFile.value) {
      const safeFileName = `picture/${localArtikel.code_nr}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("artikel-bilder")
        .upload(safeFileName, selectedFile.value, { upsert: true });
      if (uploadError) throw uploadError;
      imagePath = safeFileName;
    }

    // --- Einfügen oder Aktualisieren ---
    if (isNew) {
      const { data, error } = await supabase
  .from("artikel")
  .insert([
    {
      name: localArtikel.name,
      code_nr: localArtikel.code_nr,
      sales_price: localArtikel.sales_price || 0,
      stock_tot: localArtikel.stock_tot || 0,
      unit: localArtikel.unit || "",
      category: localArtikel.category || "",
      image_url: imagePath
    }
  ])
  .select()
  .single();

      if (error) throw error;
      localArtikel.id = data.id;
    } else {
      const { error: dbError } = await supabase
        .from("artikel")
        .update({
          name: localArtikel.name,
          code_nr: localArtikel.code_nr,
          sales_price: localArtikel.sales_price,
          stock_tot: localArtikel.stock_tot,
          unit: localArtikel.unit,
          category: localArtikel.category,
          image_url: imagePath
        })
        .eq("id", localArtikel.id);
      if (dbError) throw dbError;
    }

    emit("save", { ...localArtikel, image_url: imagePath });
    emit("close");

    await Swal.fire({
      title: "Gespeichert",
      text: isNew ? "Artikel erfolgreich angelegt." : "Änderungen gespeichert.",
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
      <h2>{{ localArtikel.id ? "Artikel bearbeiten" : "Neuen Artikel anlegen" }}</h2>

      <form @submit.prevent="saveChanges">
        <div class="form-row">
          <label>ID:</label>
          <input type="text" v-model="localArtikel.id" disabled placeholder="(neu)" />

          <label>Name:</label>
          <input type="text" v-model="localArtikel.name" required />

          <label>Code-Nr:</label>
          <input type="text" v-model="localArtikel.code_nr" required />

          <label>Preis:</label>
          <input type="number" v-model="localArtikel.sales_price" step="0.01" />

          <label>Lagerstand:</label>
          <input type="number" v-model="localArtikel.stock_tot" />

          <label>Einheit:</label>
          <input type="text" v-model="localArtikel.unit" />

          <label>Kategorie:</label>
          <input type="text" v-model="localArtikel.category" />
        </div>

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
