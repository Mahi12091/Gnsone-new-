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
  const retrievedAt = new Date().toISOString();

  const { data: batch, error: batchError } = await supabase
    .from("instrument_import_batches")
    .insert({
      source,
      source_version: "application-import",
      source_retrieved_at: retrievedAt,
      status: "RUNNING",
      total_rows: rows.length,
      valid_rows: rows.length,
      inserted_rows: 0,
      updated_rows: 0,
      skipped_rows: 0,
      failed_rows: 0,
      started_at: retrievedAt,
    })
    .select("id")
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? "Failed to create import batch");

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const { data: importRow, error: rowError } = await supabase
      .from("instrument_import_rows")
      .insert({
        batch_id: batch.id,
        row_number: index + 1,
        status: "VALID",
        raw_payload: row,
        normalized_payload: row,
      })
      .select("id")
      .single();

    if (rowError || !importRow) {
      failed += 1;
      if (errors.length < 20) errors.push(`row ${index + 1}: ${rowError?.message ?? "failed to create import row"}`);
      continue;
    }

    const { data: instrumentId, error } = await supabase.rpc("resolve_and_upsert_instrument", {
      p_batch_id: batch.id,
      p_row_id: importRow.id,
      p_normalized: { ...row, source },
    });

    if (error || !instrumentId) {
      failed += 1;
      if (errors.length < 20) errors.push(`row ${index + 1}: ${error?.message ?? "instrument upsert failed"}`);
      continue;
    }

    const { data: persistedRow } = await supabase
      .from("instrument_import_rows")
      .select("status")
      .eq("id", importRow.id)
      .single();

    if (persistedRow?.status === "INSERTED") inserted += 1;
    else if (persistedRow?.status === "UPDATED") updated += 1;
    else failed += 1;
  }

  const status = failed === 0 ? "SUCCESS" : inserted + updated > 0 ? "PARTIAL" : "FAILED";
  await supabase
    .from("instrument_import_batches")
    .update({
      status,
      inserted_rows: inserted,
      updated_rows: updated,
      skipped_rows: 0,
      failed_rows: failed,
      error_summary: errors.length ? errors.join("\n") : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  return { batchId: batch.id, processed: rows.length, persisted: inserted + updated, failed };
}
