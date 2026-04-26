# Design System Flutter

## Direcao visual

- Material Design 3
- Claro, profissional, modular e sem excesso decorativo
- Mobile-first com adaptacao para tablet e desktop

## Tokens

- Cores em `design_system/tokens/app_colors.dart`
- Radius em `design_system/tokens/app_radius.dart`
- Espacamento em `design_system/tokens/app_spacing.dart`
- Breakpoints em `design_system/tokens/app_breakpoints.dart`

## Componentes base

- `AppCard`
- `PrimaryButton`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `StatusBadge`
- `ActionBar`
- `FilterBar`
- `FormSection`
- `NetworkStatusBanner`

## Regras de UX

- Fluxos principais por paginas, nao modais.
- Erros proximos ao contexto.
- Retry quando a falha for recuperavel.
- Confirmacao explicita para acoes irreversiveis.
- Area minima de toque de `44x44`.
- Textos claros e labels semanticos.

## Estado atual do app

- Login validado.
- Recuperacao de senha com feedback inline.
- Selecao de organizacao antes do dashboard.
- Dashboard com loading, erro, retry e banner de conectividade.
