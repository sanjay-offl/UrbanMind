import { handle, type ApiResult } from '@/lib/api-helpers';
import { getAllDataSources } from '@/lib/services/dataSourceService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(): Promise<Response> {
  return handle((): ApiResult<unknown> => ({
    ok: true,
    data: {
      sources: getAllDataSources(),
      nationalTagline: 'From Citizen Voice to National Priorities',
      labels: {
        public: 'Public data',
        synthetic: 'Synthetic demo data',
        derived: 'Derived UrbanMind analytics',
        ai: 'AI generated interpretation',
      },
    },
  }));
}
