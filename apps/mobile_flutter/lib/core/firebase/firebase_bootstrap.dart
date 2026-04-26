import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../../firebase_options.dart';

enum FirebaseBootstrapStatus {
  configured,
  pendingConfiguration,
}

class FirebaseBootstrapState {
  const FirebaseBootstrapState({
    required this.status,
    required this.message,
    required this.usingEmulators,
  });

  final FirebaseBootstrapStatus status;
  final String message;
  final bool usingEmulators;

  bool get isConfigured => status == FirebaseBootstrapStatus.configured;
}

class FirebaseBootstrap {
  static bool _emulatorsConfigured = false;

  static Future<FirebaseBootstrapState> initialize() async {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );

      if (AppConfig.useFirebaseEmulators) {
        await _configureEmulators();
      }

      if (!kIsWeb) {
        FlutterError.onError =
            FirebaseCrashlytics.instance.recordFlutterFatalError;
        PlatformDispatcher.instance.onError = (error, stack) {
          FirebaseCrashlytics.instance.recordError(
            error,
            stack,
            fatal: true,
          );
          return true;
        };
      }

      return FirebaseBootstrapState(
        status: FirebaseBootstrapStatus.configured,
        message: AppConfig.useFirebaseEmulators
            ? 'Firebase conectado aos emuladores locais. Auth, Firestore e Storage estao apontando para o ambiente de desenvolvimento.'
            : 'Firebase conectado ao ambiente atual. Auth, Firestore e Storage ja podem ser integrados ao app.',
        usingEmulators: AppConfig.useFirebaseEmulators,
      );
    } catch (error) {
      return FirebaseBootstrapState(
        status: FirebaseBootstrapStatus.pendingConfiguration,
        message:
            'Nao foi possivel inicializar o Firebase neste ambiente: $error',
        usingEmulators: false,
      );
    }
  }

  static Future<void> _configureEmulators() async {
    if (_emulatorsConfigured) {
      return;
    }

    final host = AppConfig.firebaseEmulatorHost;

    await FirebaseAuth.instance.useAuthEmulator(
      host,
      AppConfig.firebaseAuthEmulatorPort,
    );
    FirebaseFirestore.instance.useFirestoreEmulator(
      host,
      AppConfig.firestoreEmulatorPort,
    );
    FirebaseStorage.instance.useStorageEmulator(
      host,
      AppConfig.storageEmulatorPort,
    );

    _emulatorsConfigured = true;
  }
}
