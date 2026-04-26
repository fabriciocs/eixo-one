# Cost Control

## Protecoes recomendadas

- Budget com alertas em `50%`, `75%`, `90%` e `100%`.
- `Cloud Run` com `min-instances=0` em dev e staging.
- `Cloud Run` com `max-instances` baixo por ambiente ate haver carga real.
- `Cloud Functions` apenas para eventos pequenos e sem loops.
- Retencao de logs reduzida quando o ambiente sair de investigacao ativa.
- Paginação obrigatoria em consultas Firestore.
- Proibir buckets publicos e monitorar trafego de saida.

## Comandos uteis

```powershell
gcloud beta billing accounts list --format="table(name,displayName,open)"
gcloud services list --enabled --project eixoone-dev --format="value(config.name)"
gcloud artifacts repositories list --project eixoone-dev --location=southamerica-east1
```

## Budget

Nao foi criado automaticamente para evitar custo e porque depende de permissoes de billing. Quando habilitado, usar notificacoes em `50%`, `75%`, `90%` e `100%`.

## Firestore e Functions

- Evite consultas sem indice.
- Evite listeners desnecessarios em colecoes amplas.
- Evite triggers que reescrevem o mesmo documento.
- Prefira consolidacao por lotes a escrita reativa em cascata.
