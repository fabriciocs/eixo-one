import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/firebase/firebase_bootstrap.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({
    super.key,
    required this.firebaseState,
  });

  final FirebaseBootstrapState firebaseState;

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    Future<void>(() async {
      await Future<void>.delayed(const Duration(milliseconds: 700));
      if (!mounted) {
        return;
      }

      var session = ref.read(authSessionProvider);
      if (session == null) {
        try {
          session = await ref.read(authRepositoryProvider).restoreSession();
          if (session != null) {
            ref.read(authSessionProvider.notifier).setSession(session);
          }
        } catch (_) {
          ref.read(authSessionProvider.notifier).clear();
          session = null;
        }
      }

      if (!mounted) {
        return;
      }

      context.go(session == null ? '/login' : '/dashboard');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: LoadingState(message: 'Preparando o EixoOne...'),
    );
  }
}
