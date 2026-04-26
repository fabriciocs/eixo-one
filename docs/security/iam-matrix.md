# IAM Matrix

| Principal | Papel | Recurso | Justificativa |
| --- | --- | --- | --- |
| `eixoone-api-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/logging.logWriter` | projeto | Emitir logs estruturados da API |
| `eixoone-api-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/monitoring.metricWriter` | projeto | Publicar metricas da API |
| `eixoone-api-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/datastore.user` | projeto | Ler e escrever no Firestore via Admin SDK |
| `eixoone-api-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/storage.objectUser` | projeto | Acessar objetos autorizados no Storage |
| `eixoone-functions-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/logging.logWriter` | projeto | Emitir logs das funcoes orientadas a evento |
| `eixoone-functions-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/monitoring.metricWriter` | projeto | Publicar metricas das funcoes |
| `eixoone-functions-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/datastore.user` | projeto | Operacoes Admin em Firestore |
| `eixoone-functions-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/storage.objectUser` | projeto | Operacoes Admin em Storage |
| `eixoone-ci-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/cloudbuild.builds.builder` | projeto | Executar builds e validacoes |
| `eixoone-ci-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/artifactregistry.writer` | repositorio `eixoone-api-dev` | Publicar imagens Docker |
| `eixoone-deploy-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/run.developer` | projeto | Deploy controlado em Cloud Run |
| `eixoone-deploy-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/cloudfunctions.developer` | projeto | Deploy controlado em Cloud Functions |
| `eixoone-deploy-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/iam.serviceAccountUser` | projeto | Associar service accounts em deploy |
| `eixoone-deploy-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/artifactregistry.reader` | repositorio `eixoone-api-dev` | Ler imagem da API no deploy |
| `eixoone-observability-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/logging.logWriter` | projeto | Rotinas auxiliares de diagnostico |
| `eixoone-observability-dev@PROJECT_ID.iam.gserviceaccount.com` | `roles/monitoring.metricWriter` | projeto | Rotinas auxiliares de metricas |

## Secrets com acesso dedicado

- `EIXOONE_FIREBASE_PROJECT_ID`: API e Functions
- `EIXOONE_API_ENV`: API e Functions
- `EIXOONE_JWT_AUDIENCE`: API
- `EIXOONE_WEBHOOK_SECRET`: API e Functions
- `EIXOONE_APP_CONFIG`: API e Functions
