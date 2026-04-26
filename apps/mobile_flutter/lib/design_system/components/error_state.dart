import 'package:flutter/material.dart';

import '../../core/errors/app_failure.dart';
import 'primary_button.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    required this.failure,
    this.onRetry,
  });

  final AppFailure failure;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56),
            const SizedBox(height: 16),
            Text(
              failure.title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              failure.message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null && failure.retryable) ...[
              const SizedBox(height: 20),
              PrimaryButton(
                label: 'Tentar novamente',
                icon: Icons.refresh,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

