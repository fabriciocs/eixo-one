# Evidencias de validacao

## Evidencias positivas

- Build TypeScript dos contratos executado com sucesso.
- Build TypeScript do backend executado com sucesso.
- Testes de integracao backend foram escritos para o fluxo de settings.
- Testes Flutter foram escritos para renderizacao e bloqueio por permissao.

## Evidencias negativas

- `vitest` nao executou no sandbox por `spawn EPERM`.
- `dart analyze` e `flutter test` excederam o tempo maximo do ambiente.
