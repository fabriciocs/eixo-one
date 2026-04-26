import '../../../shared/models/auth_session.dart';
import '../domain/login_credentials.dart';

abstract class AuthRepository {
  Future<AuthSession?> restoreSession();
  Future<AuthSession> signIn(LoginCredentials credentials);
  Future<void> requestPasswordReset(String email);
  Future<void> signOut();
}
