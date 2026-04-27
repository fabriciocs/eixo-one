# FG-007 - Matriz de rastreabilidade

- Criar templates -> contratos + endpoint `POST /notifications/templates` + formulario Flutter
- Disparar por evento -> endpoint `POST /notifications/send` + envio manual MVP
- Registrar envio -> `NotificationDelivery` + listagem de entregas
- Reenviar falhas -> endpoint de retry + acao na tela
- Consentimento -> campo `consentGranted` + status `suppressed`
