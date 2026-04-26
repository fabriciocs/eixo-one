import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../shared/models/auth_session.dart';
import '../../application/auth_repository.dart';
import '../../domain/login_credentials.dart';
import '../../infrastructure/firebase_auth_repository.dart';
import '../../infrastructure/in_memory_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (AppConfig.useFirebaseRepositories && Firebase.apps.isNotEmpty) {
    return FirebaseAuthRepository();
  }

  return const InMemoryAuthRepository();
});

class AuthSessionController extends StateNotifier<AuthSession?> {
  AuthSessionController() : super(null);

  void setSession(AuthSession session) {
    state = session;
  }

  void selectOrganization(String organizationId) {
    final current = state;

    if (current == null) {
      return;
    }

    state = current.copyWith(selectedOrganizationId: organizationId);
  }

  void clear() {
    state = null;
  }
}

final authSessionProvider =
    StateNotifierProvider<AuthSessionController, AuthSession?>((ref) {
  return AuthSessionController();
});

class LoginController extends StateNotifier<AsyncValue<void>> {
  LoginController(
    this._repository,
    this._sessionController,
  ) : super(const AsyncData(null));

  final AuthRepository _repository;
  final AuthSessionController _sessionController;

  Future<void> signIn(LoginCredentials credentials) async {
    state = const AsyncLoading();

    try {
      final session = await _repository.signIn(credentials);
      _sessionController.setSession(session);
      state = const AsyncData(null);
    } on AppFailure catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    } catch (error, stackTrace) {
      state = AsyncError(
        const AppFailure(
          title: 'Falha inesperada',
          message:
              'Nao foi possivel concluir o login agora. Tente novamente em instantes.',
          retryable: true,
          code: 'UNEXPECTED_LOGIN_ERROR',
        ),
        stackTrace,
      );
    }
  }
}

final loginControllerProvider =
    StateNotifierProvider.autoDispose<LoginController, AsyncValue<void>>((ref) {
  return LoginController(
    ref.watch(authRepositoryProvider),
    ref.read(authSessionProvider.notifier),
  );
});
