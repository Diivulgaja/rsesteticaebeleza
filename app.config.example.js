(function () {
  const baseConfig = {
    whatsappNumber: '5548996207529',
    businessName: 'RôSouza Beleza e Estética',
    address: 'Rua Álvaro Cardoso 116 - 88070-250',
    businessTimezone: 'America/Sao_Paulo',
    pendingHoldMinutes: 15,
    supabaseUrl: 'COLE_AQUI_SUA_SUPABASE_URL',
    supabaseAnonKey: 'COLE_AQUI_SUA_SUPABASE_ANON_KEY'
};
  const mergedConfig = Object.assign({}, window.__RS_RUNTIME_CONFIG__ || {}, window.__APP_CONFIG__ || {}, window.CONFIG || {}, window.APP_CONFIG || {}, baseConfig);

  window.APP_CONFIG = mergedConfig;
  window.CONFIG = mergedConfig;
  window.__APP_CONFIG__ = mergedConfig;
  window.__RS_RUNTIME_CONFIG__ = mergedConfig;
})();
