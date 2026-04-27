import 'package:flutter/material.dart';

import '../../../../design_system/components/status_badge.dart';
import '../../../../design_system/tokens/app_colors.dart';
import '../../domain/models/governance_models.dart';

class GovernanceStatusBadge extends StatelessWidget {
  const GovernanceStatusBadge({
    super.key,
    required this.status,
  });

  final GovernanceRecordStatus status;

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      label: status.label,
      color: switch (status) {
        GovernanceRecordStatus.active => AppColors.success,
        GovernanceRecordStatus.draft => AppColors.warning,
        GovernanceRecordStatus.inactive => AppColors.secondary,
        GovernanceRecordStatus.archived => AppColors.error,
      },
    );
  }
}
