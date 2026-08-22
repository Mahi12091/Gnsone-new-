const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase credentials are required');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
async function count(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { ...headers, Prefer: 'count=exact' } });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  const range = r.headers.get('content-range') || '';
  const total = Number(range.split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}
const checks = {
  shareholding_periods: await count('shareholding_periods?select=shareholding_period_id'),
  shareholding_values: await count('shareholding_values?select=shareholding_value_id'),
  corporate_actions: await count('corporate_actions?select=corporate_action_id'),
  company_peers: await count('company_peers?select=company_peer_id')
};
console.log(JSON.stringify(checks));
if (checks.shareholding_values === 0) process.exitCode = 2;
