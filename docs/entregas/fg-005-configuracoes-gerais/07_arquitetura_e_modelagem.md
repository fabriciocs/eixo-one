# Arquitetura e modelagem

## Entidade principal

`BaseGovernanceSetting`

- `settingKey`
- `tenantId`
- `moduleKey`
- `category`
- `label`
- `description`
- `scopeType`
- `companyId`
- `establishmentId`
- `valueType`
- `value`
- `defaultValue`
- `sensitive`
- `status`
- `version`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

## Chave logica

`tenantId + settingKey + scopeType + companyId + establishmentId`

## Seeds MVP

- `governance.numbering.invoice_series`
- `notifications.email.invoice_template`
- `governance.approvals.require_second_reviewer`
