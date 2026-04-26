import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/firebase/firebase_bootstrap.dart';
import '../../../../design_system/components/loading_state.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({
    super.key,
    required this.firebaseState,
  });

  final FirebaseBootstrapState firebaseState;

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) {
        return;
      }
      context.go('/login');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: LoadingState(message: 'Preparando o EixoOne...'),
    );
  }
}
