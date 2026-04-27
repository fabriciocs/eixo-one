# FG-007 - Definicao funcional

- Fluxos principais:
  - listar templates por canal/status
  - criar template administrativo
  - disparar notificacao manual a partir de um template ativo
  - listar entregas
  - reprocessar entrega com falha
- Regras:
  - template precisa estar `active` para envio
  - template com consentimento obrigatorio pode suprimir envio
  - retry respeita limite de tentativas
