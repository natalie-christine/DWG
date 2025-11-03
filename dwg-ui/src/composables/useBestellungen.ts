import { supabase } from "../lib/supabase";

export async function loadBestellungen(offset=0, limit=25){
  return await supabase
    .from('v_bestellungen_list')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

export async function updateBestellungStatus(id: string, status: string){
  return await supabase.from('bestellungen').update({ status }).eq('id', id);
}

export async function setBestellungStatusMitLager(bestellId: string, newStatus: string){
    // ruft die DB-Logik in einer Transaktion-semantik auf
    const { error } = await supabase.rpc('set_bestellung_status', {
      p_bestell_id: bestellId,
      p_new_status: newStatus
    });
    return { error };
  }
  
