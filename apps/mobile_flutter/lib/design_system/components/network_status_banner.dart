import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/network_status.dart';
import '../../core/network/network_status_provider.dart';

class NetworkStatusBanner extends ConsumerWidget {
  const NetworkStatusBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final networkStatus = ref.watch(networkStatusProvider);

    return networkStatus.when(
      data: (status) {
        if (status == NetworkStatus.online) {
          return const SizedBox.shrink();
        }

        final isOffline = status == NetworkStatus.offline;

        return MaterialBanner(
          content: Text(
            isOffline
                ? 'Voce esta offline. O app vai priorizar dados ja carregados e permitir nova tentativa quando a conexao voltar.'
                : 'Sua conexao parece instavel. Aguarde o retorno das acoes antes de reenviar dados.',
          ),
          leading: Icon(
            isOffline ? Icons.wifi_off_outlined : Icons.network_check_outlined,
          ),
          actions: const [
            SizedBox.shrink(),
          ],
        );
      },
      error: (error, stackTrace) => const SizedBox.shrink(),
      loading: () => const SizedBox.shrink(),
    );
  }
}
