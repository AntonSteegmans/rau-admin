import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://njfnzjwrwjpzthuqeyfn.supabase.co'
const supabaseAnonKey = 'sb_publishable_4mIvFNM5nucskhDGvY9Z8g_SQx5yWPP'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
