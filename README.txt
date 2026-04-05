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
