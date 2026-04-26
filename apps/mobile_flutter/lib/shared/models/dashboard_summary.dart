import 'dashboard_metric.dart';

class DashboardSummary {
  const DashboardSummary({
    required this.headline,
    required this.metrics,
    required this.notices,
  });

  final String headline;
  final List<DashboardMetric> metrics;
  final List<String> notices;
}

