import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/supabase/types';
import type { GenerateBoardRequest, GenerateBoardResponse, BreakdownTaskResponse, OrbitApiError } from '../../types/orbit';
import { generatedBoardSchema, taskBreakdownSchema, generateBoardRequestSchema, breakdownTaskRequestSchema } from './schemas';

export interface AiDependencies {
  createClient: () => Promise<SupabaseClient<Database>>;
  generateBoard: (input: GenerateBoardRequest) => Promise<GenerateBoardResponse>;
  breakdownTask: (context: { title: string; description: string | null }) => Promise<BreakdownTaskResponse>;
}

const messages = {
  auth: 'Please sign in to ask Orbit for help.',
  input: 'Please check your request and try again.',
  quota: 'You’ve used your board creations. Upgrade your plan to create more with Orbit.',
  unavailable: 'Orbit couldn’t help just now. Please try again in a moment.',
  task: 'We couldn’t find that task. Please select a task from your board and try again.',
};

function json(body: GenerateBoardResponse | BreakdownTaskResponse | OrbitApiError, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

export function createAiHandlers(deps: AiDependencies) {
  return {
    async generateBoard(request: Request): Promise<Response> {
      try {
        const client = await deps.createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return json({ message: messages.auth }, 401);
        const input = generateBoardRequestSchema.safeParse(await readJson(request));
        if (!input.success) return json({ message: messages.input }, 400);
        const { data: profile, error } = await client.from('profiles')
          .select('ai_monthly_generations, max_ai_generations').eq('id', user.id).single();
        if (error || !profile) return json({ message: messages.unavailable }, 503);
        if (profile.ai_monthly_generations >= profile.max_ai_generations)
          return json({ message: messages.quota }, 403);
        const board = generatedBoardSchema.parse(await deps.generateBoard(input.data));
        // The precheck saves model calls; this atomic RPC decides concurrent success.
        // Do not retry an ambiguous RPC failure, which could charge a second time.
        const quota = await client.rpc('consume_board_generation_quota');
        if (quota.error) return json({ message: messages.unavailable }, 503);
        if (quota.data === false) return json({ message: messages.quota }, 403);
        if (quota.data !== true) return json({ message: messages.unavailable }, 503);
        return json(board);
      } catch {
        return json({ message: messages.unavailable }, 503);
      }
    },
    async breakdownTask(request: Request): Promise<Response> {
      try {
        const client = await deps.createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return json({ message: messages.auth }, 401);
        const input = breakdownTaskRequestSchema.safeParse(await readJson(request));
        if (!input.success) return json({ message: messages.input }, 400);
        const { data: task, error } = await client.from('tasks')
          .select('title, description').eq('id', input.data.taskId).eq('user_id', user.id).maybeSingle();
        if (error) return json({ message: messages.unavailable }, 503);
        if (!task) return json({ message: messages.task }, 400);
        // Stored data is authoritative; caller-supplied title/description are never used.
        const result = taskBreakdownSchema.parse(await deps.breakdownTask(task));
        return json(result);
      } catch {
        return json({ message: messages.unavailable }, 503);
      }
    },
  };
}
