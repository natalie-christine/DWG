import { supabase } from "../lib/supabase";

export async function loadAngebote(offset=0, limit=25){
  return await supabase
    .from('v_angebote_list')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

export async function updateAngebotStatus(id: string, status: string){
  return await supabase.from('angebote').update({ status }).eq('id', id);
}
