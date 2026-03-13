import { createClient } from '@supabase/supabase-js';

// Pega aquí tus datos
const supabaseUrl = 'https://asfipfdppiijjfelsngm.supabase.co';
const supabaseKey = 'sb_publishable_Stm-TD1bvj1QgWbimr5eMA_tPPnGBzS';

export const supabase = createClient(supabaseUrl, supabaseKey);