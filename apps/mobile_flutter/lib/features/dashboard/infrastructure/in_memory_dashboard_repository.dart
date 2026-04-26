import '../../../core/errors/app_failure.dart';
import '../../../shared/models/dashboard_metric.dart';
import '../../../shared/models/dashboard_summary.dart';
import '../application/dashboard_repository.dart';

class InMemoryDashboardRepository implements DashboardRepository {
  const InMemoryDashboardRepository();

  @override
  Future<DashboardSummary> fetchSummary(String organizationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 450));

    if (organizationId == 'tenant_blocked') {
      throw const AppFailure(
        title: 'Dashboard indisponivel',
        message:
            'A organizacao selecionada ainda nao concluiu a sincronizacao inicial. Tente novamente em alguns minutos.',
        retryable: true,
      );
    }

    return const DashboardSummary(
      headline: 'Resumo operacional da organizacao atual com indicadores priorizados para tomada de decisao.',
      metrics: [
        DashboardMetric(
          title: 'Vendas do dia',
          value: 'R\$ 24.500',
          subtitle: 'Atualizacao incremental preparada para Firestore.',
        ),
        DashboardMetric(
          title: 'Pedidos em aberto',
          value: '18',
          subtitle: 'Fila operacional com prioridade alta para hoje.',
        ),
        DashboardMetric(
          title: 'Alertas',
          value: '5',
          subtitle: 'Eventos criticos que exigem acompanhamento do time.',
        ),
      ],
      notices: [
        'Paginas devem preferir leituras paginadas e agregados precomputados para reduzir custo no Firestore.',
        'Acoes sensiveis devem sair da UI e passar pela API Node.js com auditoria e idempotencia.',
      ],
    );
  }
}

