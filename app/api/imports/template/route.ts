import { getCurrentUser } from '@/lib/auth';
import { IMPORT_TYPES, type ImportTypeKey } from '@/lib/import-config';

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  const url = new URL(req.url);
  const type = (url.searchParams.get('type') || 'INVENTORY_MOVEMENT') as ImportTypeKey;
  const cfg = IMPORT_TYPES[type];
  if (!cfg) return new Response('Invalid import type', { status: 400 });
  const headers = [...cfg.required, ...cfg.optional];
  const csv = '\ufeff' + headers.map((h) => `"${h}"`).join(',') + '\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="beabridge-template-${type.toLowerCase()}.csv"`,
    },
  });
}
