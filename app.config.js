(function () {
  const baseConfig = {
    whatsappNumber: '5548996207529',
    businessName: 'RôSouza Beleza e Estética',
    address: 'Rua Álvaro Cardoso 116 - 88070-250',
    businessTimezone: 'America/Sao_Paulo',
    pendingHoldMinutes: 15,
    supabaseUrl: 'https://gbkgghlwidkmhzewckoc.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia2dnaGx3aWRrbWh6ZXdja29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjA3ODYsImV4cCI6MjA5MDgzNjc4Nn0.vodpJYpEi_947fB2xCVT4f6KrabyIo7jICI2SypYSKI'
};
  const mergedConfig = Object.assign({}, window.__RS_RUNTIME_CONFIG__ || {}, window.__APP_CONFIG__ || {}, window.CONFIG || {}, window.APP_CONFIG || {}, baseConfig);

  window.APP_CONFIG = mergedConfig;
  window.CONFIG = mergedConfig;
  window.__APP_CONFIG__ = mergedConfig;
  window.__RS_RUNTIME_CONFIG__ = mergedConfig;
})();
