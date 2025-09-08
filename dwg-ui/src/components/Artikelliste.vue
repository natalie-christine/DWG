<script setup>
import { supabase } from '../supabase.js';
import { ref, onMounted } from 'vue';

const artikel = ref([]);

onMounted(async () => {
  const { data, error } = await supabase.from('artikel').select('*');
  if (error) console.error(error);
  else artikel.value = data;
});
</script>
