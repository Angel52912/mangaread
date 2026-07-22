// ============================================================
// CONFIGURACIÓN DE SUPABASE - MangaReadV1
// ============================================================
// Rellena estos valores con los de TU proyecto de Supabase.
// Los encuentras en: Project Settings > API
//
// IMPORTANTE:
// - Usa siempre el "anon public key", NUNCA el "service_role key".
// - Este archivo puede subirse al repo (la anon key es pública
//   por diseño), pero el service_role key JAMÁS debe estar aquí
//   ni en ningún archivo del frontend.
// ============================================================

const SUPABASE_CONFIG = {
  url: "https://cgjvjkauhhcedjrhjoxn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnanZqa2F1aGhjZWRqcmhqb3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNDM4NjIsImV4cCI6MjA5OTkxOTg2Mn0.BOU2eiUdHN7AdO79tPXbZV7ZfHdlRa7LSaDiaFWGAW0",
  adminInviteCode: "CODIGO-ADMINISTRADOR-DE-PRUEBA",

  // Debe coincidir EXACTAMENTE (en minúsculas) con el correo
  // configurado en la función public.is_admin() del SQL.
  adminEmails: [
    "terreneitor1342@gmail.com"
  ],

  buckets: {
    covers: "covers",
    pdfs: "pdfs"
  }
};

// ============================================================
// CLIENTE DE SUPABASE
// ============================================================
// Requiere que en el HTML se haya cargado antes:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabaseClient = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Exponer en el objeto global para asegurar accesibilidad
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.supabaseClient = supabaseClient;
