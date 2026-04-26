import 'package:flutter/foundation.dart';

enum FirebaseBootstrapStatus {
  configured,
  pendingConfiguration,
}

class FirebaseBootstrapState {
  const FirebaseBootstrapState({
    required this.status,
    required this.message,
  });

  final FirebaseBootstrapStatus status;
  final String message;

  bool get isConfigured => status == FirebaseBootstrapStatus.configured;
}

class FirebaseBootstrap {
  static Future<FirebaseBootstrapState> initialize() async {
    if (kDebugMode) {
      return const FirebaseBootstrapState(
        status: FirebaseBootstrapStatus.pendingConfiguration,
        message:
            'Firebase ainda nao foi conectado. Execute flutterfire configure antes de ativar login, Firestore e Storage.',
      );
    }

    return const FirebaseBootstrapState(
      status: FirebaseBootstrapStatus.pendingConfiguration,
      message:
          'Firebase pendente de configuracao para este ambiente. Gere firebase_options.dart com flutterfire configure.',
    );
  }
}
