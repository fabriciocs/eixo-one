# FG-007 - Arquitetura e modelagem

- `NotificationTemplate`
  - identifica canal, evento, corpo, assunto, escopo, consentimento e retry
- `NotificationDelivery`
  - identifica template, destinatario, status, tentativas, erro e timestamps
- Contratos compartilhados em `packages/shared_contracts` para backend e app Flutter.
