import { createClient } from '@supabase/supabase-js';

const URL = 'https://ukklbhnolkexdodzeqtq.supabase.co'
const API_KEY = 'sb_publishable_WEnqaRFfVaDcV0qLhZ1nAw_s2AyTJ5I'

export const supabase = createClient(URL, API_KEY)