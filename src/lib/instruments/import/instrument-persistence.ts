import type { ExchangeMasterRow } from "../exchange-master";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type PersistImportResult = {
  batchId: string;
  processed: number;
  persisted: number;
  failed: number;
};

export async function persistInstrumentImport(
  rows: ExchangeMasterRow[],
  source: "NSE" | "BSE",
): Promise<PersistImportResult> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: batch, error: batchError } = await supabase
    .from("instrument_import_batches")
    .insert({ source, status: "RUNNING", total_rows: rows.length })
    .select("id")
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? "Failed to create import batch");

  let persisted = 0;
  let failed = 0;

  for (const row of rows) {
    const { data: importRow, error: rowError } = await supabase
      .from("instrument_import_rows")
      .insert({
        batch_id: batch.id,
        source,
        status: "PENDING",
        raw_payload: row,
      })
      .select("id")
      .single();

    if (rowError || !importRow) {
      failed += 1;
      continue;
    }

    const { data, error } = await supabase.rpc("resolve_and_upsert_instrument", {
      p_batch_id: batch.id,
      p_row_id: importRow.id,
      p_normalized: { ...row, source },
    });

    if (error || !data) failed += 1;
    else persisted += 1;
  }

  const status = failed === 0 ? "COMPLETED" : persisted > 0 ? "COMPLETED_WITH_ERRORS" : "FAILED";
  await supabase
    .from("instrument_import_batches")
    .update({ status, processed_rows: rows.length, successful_rows: persisted, failed_rows: failed, completed_at: new Date().toISOString() })
    .eq("id", batch.id);

  return { batchId: batch.id, processed: rows.length, persisted, failed };
}
