# FG-007 - Especificacao tecnica backend

- Endpoints adicionados:
  - `GET /v1/governance/notifications/templates`
  - `POST /v1/governance/notifications/templates`
  - `GET /v1/governance/notifications/deliveries`
  - `POST /v1/governance/notifications/send`
  - `POST /v1/governance/notifications/deliveries/:deliveryId/retry`
- Permissoes:
  - `notifications.read`
  - `notifications.manage`
- Persistencia:
  - `notification_templates`
  - `notification_deliveries`
