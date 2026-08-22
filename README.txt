Estrutura do projeto
- index.html
- styles.css
- app.js
- app.config.example.js

Como configurar
1. Duplique app.config.example.js e renomeie para app.config.js
2. Preencha supabaseUrl e supabaseAnonKey
3. Publique todos os arquivos juntos na mesma pasta

Observações importantes
- O front-end continua visível no navegador. O que protege o projeto é manter regras críticas e segredos fora do front.
- Não coloque service_role ou qualquer chave secreta no app.config.js.
- Restrinja as chaves públicas por domínio no painel do provedor.


Novidades desta versão
- customer-area.js: login Google + área da cliente + avaliações autenticadas
- sql/customer_auth_reviews_upgrade.sql: ajuste complementar no banco para vincular agendamentos pelo WhatsApp e moderar respostas das avaliações


Correção desta versão
- Rode sql/customer_reviews_site_admin_fix_v5.sql no Supabase para alinhar o envio da avaliação do site com a moderação do painel admin.
