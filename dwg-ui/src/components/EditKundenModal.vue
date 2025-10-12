<script setup>
import { ref, watch } from "vue";
import { supabase } from "../lib/supabase";

const props = defineProps({
  kunde: { type: Object, required: true },
});

const emit = defineEmits(["close", "save"]);

const form = ref({
  id: null,
  nummer: "",
  anrede: "",
  kontaktperson: "",
  firma: "",
  email: "",
  telefon_privat: "",
  telefon_mobil: "",
  strasse: "",
  plz: "",
  ort: "",
  land: "",
});

const loading = ref(false);
const errorMessage = ref("");

// Props → Form übernehmen
watch(
  () => props.kunde,
  (val) => {
    if (val) {
      form.value = {
        id: val.id || null,
        nummer: val.nummer || "",
        anrede: val.anrede || "",
        kontaktperson: val.kontaktperson || "",
        firma: val.firma || "",
        email: val.email || "",
        telefon_privat: val.telefon_privat || "",
        telefon_mobil: val.telefon_mobil || "",
        strasse: val.strasse || "",
        plz: val.plz || "",
        ort: val.ort || "",
        land: val.land || "",
      };
    }
  },
  { immediate: true }
);

// Speichern in Supabase
async function saveKunde() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { error } = await supabase
      .from("kunden")
      .update({
        anrede: form.value.anrede,
        kontaktperson: form.value.kontaktperson,
        firma: form.value.firma,
        email: form.value.email,
        telefon_privat: form.value.telefon_privat,
        telefon_mobil: form.value.telefon_mobil,
        strasse: form.value.strasse,
        plz: form.value.plz,
        ort: form.value.ort,
        land: form.value.land,
      })
      .eq("id", form.value.id);

    if (error) throw error;
    emit("save");
    emit("close");
  } catch (err) {
    console.error(err);
    errorMessage.value = err.message || "Fehler beim Speichern";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <h2>Kunde bearbeiten</h2>

      <div class="form">
        <label>Anrede</label>
        <input v-model="form.anrede" type="text" />

        <label>Kontaktperson</label>
        <input v-model="form.kontaktperson" type="text" />

        <label>Firma</label>
        <input v-model="form.firma" type="text" />

        <label>Kundennummer</label>
        <input v-model="form.nummer" type="text" readonly />

        <label>Email</label>
        <input v-model="form.email" type="email" />

        <label>Telefon (privat)</label>
        <input v-model="form.telefon_privat" type="text" />

        <label>Telefon (mobil)</label>
        <input v-model="form.telefon_mobil" type="text" />

        <label>Straße</label>
        <input v-model="form.strasse" type="text" />

        <label>PLZ</label>
        <input v-model="form.plz" type="text" />

        <label>Ort</label>
        <input v-model="form.ort" type="text" />

        <label>Land</label>
        <input v-model="form.land" type="text" />

        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

        <div class="actions">
          <button class="btn cancel" @click="emit('close')">Abbrechen</button>
          <button class="btn save" :disabled="loading" @click="saveKunde">
            {{ loading ? "Speichere..." : "Speichern" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  width: 800px;
  max-width: 95%;
  max-height: 80%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  overflow: auto;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
label {
  font-weight: bold;
  margin-top: 0.5rem;
}
input {
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
input[readonly] {
  background: #f3f3f3;
  color: #666;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}
.cancel {
  background: #ccc;
}
.save {
  background: #2d7be0;
  color: #fff;
}
.error {
  color: red;
  margin-top: 0.5rem;
}
</style>
