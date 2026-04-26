import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AppConfig {
  static const appName = 'EixoOne';
  static const slogan = 'Gestao conectada. Decisoes claras.';
  static const contractVersion = 'v1';
  static const minTouchTarget = Size(44, 44);
  static const useFirebaseEmulators = bool.fromEnvironment(
    'USE_FIREBASE_EMULATORS',
    defaultValue: kDebugMode,
  );
  static const useFirebaseRepositories = bool.fromEnvironment(
    'USE_FIREBASE_REPOSITORIES',
    defaultValue: true,
  );
  static const firebaseEmulatorHostOverride = String.fromEnvironment(
    'FIREBASE_EMULATOR_HOST',
    defaultValue: '',
  );
  static const firebaseAuthEmulatorPort = int.fromEnvironment(
    'FIREBASE_AUTH_EMULATOR_PORT',
    defaultValue: 9099,
  );
  static const firestoreEmulatorPort = int.fromEnvironment(
    'FIRESTORE_EMULATOR_PORT',
    defaultValue: 8088,
  );
  static const storageEmulatorPort = int.fromEnvironment(
    'STORAGE_EMULATOR_PORT',
    defaultValue: 9199,
  );

  static String get firebaseEmulatorHost {
    if (firebaseEmulatorHostOverride.isNotEmpty) {
      return firebaseEmulatorHostOverride;
    }

    if (kIsWeb) {
      return '127.0.0.1';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return '10.0.2.2';
      default:
        return '127.0.0.1';
    }
  }
}
