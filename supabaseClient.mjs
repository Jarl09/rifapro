import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jdjidfnzicrogwzwjzml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkamlkZm56aWNyb2d3endqem1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3ODcyMSwiZXhwIjoyMDkwNDU0NzIxfQ.HTDN83HaMJNZ-Tnj-coKNxVhmPqWU-fE3zYP2hSznZc'

export const supabase = createClient(supabaseUrl, supabaseKey)