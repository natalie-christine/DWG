// src/services/dashboardStats.ts
import { supabase } from "../lib/supabase";

const LOW_STOCK_THRESHOLD = 5;

export async function getArtikelStats() {
  const { count: total, error: totalError } = await supabase
    .from("artikel")
    .select("*", { count: "exact", head: true });

  if (totalError) throw totalError;

  const { count: lowStock, error: lowError } = await supabase
    .from("artikel")
    .select("*", { count: "exact", head: true })
    .lte("stock_tot", LOW_STOCK_THRESHOLD);

  if (lowError) throw lowError;

  return {
    total: total ?? 0,
    lowStock: lowStock ?? 0,
    threshold: LOW_STOCK_THRESHOLD,
  };
}

export async function getKundenCount() {
  const { count, error } = await supabase
    .from("kunden")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getAngeboteCount() {
  const { count, error } = await supabase
    .from("angebote")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getBestellungenCount(options?: { statuses?: string[] }) {
  let q = supabase
    .from("bestellungen")
    .select("*", { count: "exact", head: true });

  // Optional: nur bestimmte Stati zählen (z.B. "Neu", "Ausgelöst", "Bestätigt")
  if (options?.statuses?.length) {
    q = q.in("status", options.statuses);
  }

  const { count, error } = await q;

  if (error) throw error;
  return count ?? 0;
}
