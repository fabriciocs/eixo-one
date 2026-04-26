# Modelo Inicial de Dados

## Colecoes

### `organizations`

- Campos: `id`, `name`, `status`, `moduleKeys`, `ownerUserId`, `createdAt`, `updatedAt`, `version`
- Acesso: leitura pelo tenant atual; escrita via backend

### `users`

- Campos: `id`, `tenantId`, `email`, `displayName`, `status`, `roleKeys`, `permissionKeys`, `moduleKeys`, `lastLoginAt`, `createdAt`, `updatedAt`, `version`
- Acesso: proprio usuario ou perfis com `users.read`

### `roles`

- Campos: `tenantId`, `key`, `label`, `permissionKeys`, `createdAt`, `updatedAt`, `version`
- Acesso: `roles.read`

### `permissions`

- Campos: `moduleKey`, `key`, `label`, `description`
- Acesso: leitura autenticada

### `modules`

- Campos: `key`, `label`, `route`, `enabled`, `order`
- Acesso: leitura autenticada

### `audit_logs`

- Campos: `tenantId`, `actorUserId`, `entityType`, `entityId`, `action`, `before`, `after`, `metadata`, `createdAt`
- Acesso: `audit.read`

### `settings`

- Campos: `tenantId`, `namespace`, `data`, `updatedAt`, `updatedBy`, `version`
- Acesso: `settings.read`

### `notifications`

- Campos: `tenantId`, `userId`, `status`, `title`, `body`, `readAt`, `createdAt`
- Acesso: somente o proprio usuario

### `files`

- Campos: `tenantId`, `path`, `name`, `contentType`, `size`, `uploadedBy`, `createdAt`, `entityType`, `entityId`
- Acesso: conforme `files.read`

### `integrations`

- Campos: `tenantId`, `provider`, `status`, `lastSyncAt`, `lastError`, `configMasked`
- Acesso: `integrations.read`

### `idempotency_records`

- Campos: `tenantId`, `scope`, `fingerprint`, `responseBody`, `createdAt`
- Acesso: backend only
