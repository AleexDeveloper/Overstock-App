import { createClient } from '@supabase/supabase-js';

// Pega aquí tus datos
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://asfipfdppiijjfelsngm.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_Stm-TD1bvj1QgWbimr5eMA_tPPnGBzS';
export const supabase = createClient(supabaseUrl, supabaseKey);