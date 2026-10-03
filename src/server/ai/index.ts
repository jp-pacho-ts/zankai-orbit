import 'server-only';
import { createClient } from '../../lib/supabase/server';
import { generateBoard, breakdownTask } from './gemini';
import { createAiHandlers } from './handlers';

export const aiHandlers = createAiHandlers({ createClient, generateBoard, breakdownTask });
