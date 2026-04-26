import '../../../shared/models/dashboard_summary.dart';

abstract class DashboardRepository {
  Future<DashboardSummary> fetchSummary(String organizationId);
}

