import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://czfnciphatxjjzothonq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Zm5jaXBoYXR4amp6b3Rob25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDIwMjQsImV4cCI6MjA3OTQxODAyNH0.aAXhQtJGUUai8SPbyvpk6y5yLtdaEBHMh2GF7ads9tI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);