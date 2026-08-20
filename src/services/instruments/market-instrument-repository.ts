import type { ExchangeMasterRow } from "@/lib/instruments/exchange-master";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function persistExchangeInstrument(
  ingestionJobId: string,
  row: ExchangeMasterRow,
): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("upsert_instrument_from_exchange_row", {
    p_ingestion_job_id: ingestionJobId,
    p_payload: row,
  });

  if (error) {
    throw new Error(`Instrument persistence failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Instrument persistence returned no instrument id.");
  }

  return data as string;
}
