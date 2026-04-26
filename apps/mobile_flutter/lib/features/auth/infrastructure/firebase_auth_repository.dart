import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../core/errors/app_failure.dart';
import '../../../shared/models/app_user.dart';
import '../../../shared/models/auth_session.dart';
import '../../../shared/models/organization_summary.dart';
import '../application/auth_repository.dart';
import '../domain/login_credentials.dart';

class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  @override
  Future<AuthSession?> restoreSession() async {
    final user = _auth.currentUser;
    if (user == null) {
      return null;
    }

    try {
      return await _buildSession(user);
    } catch (_) {
      await _auth.signOut();
      rethrow;
    }
  }

  @override
  Future<AuthSession> signIn(LoginCredentials credentials) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: credentials.normalizedEmail,
        password: credentials.password,
      );

      final user = credential.user;
      if (user == null) {
        throw const AppFailure(
          title: 'Falha no login',
          message:
              'Nao foi possivel autenticar com as credenciais informadas. Revise e tente novamente.',
          retryable: true,
          code: 'INVALID_CREDENTIALS',
        );
      }

      return _buildSession(user);
    } on FirebaseAuthException catch (error) {
      throw _mapAuthError(error);
    }
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (error) {
      throw _mapAuthError(error);
    }
  }

  @override
  Future<void> signOut() {
    return _auth.signOut();
  }

  Future<AuthSession> _buildSession(User user) async {
    final tokenResult = await user.getIdTokenResult(true);
    final claims = tokenResult.claims ?? const <String, Object?>{};
    final userSnapshot = await _firestore.collection('users').doc(user.uid).get();

    if (!userSnapshot.exists) {
      throw const AppFailure(
        title: 'Perfil indisponivel',
        message:
            'Seu perfil ainda nao foi provisionado neste ambiente. Fale com a administracao da plataforma.',
        retryable: true,
        code: 'USER_PROFILE_NOT_FOUND',
      );
    }

    final userData = userSnapshot.data() ?? const <String, Object?>{};
    final tenantId = _readString(claims['tenantId']) ?? _readString(userData['tenantId']);

    if (tenantId == null || tenantId.isEmpty) {
      throw const AppFailure(
        title: 'Contexto da organizacao ausente',
        message:
            'Nao foi possivel identificar a organizacao deste usuario. Revise as claims e o cadastro do perfil.',
        retryable: false,
        code: 'TENANT_CONTEXT_NOT_FOUND',
      );
    }

    final roleKeys = _preferNonEmpty(
      _readStringList(claims['roleKeys']),
      _readStringList(userData['roleKeys']),
    );
    final permissionKeys = _preferNonEmpty(
      _readStringList(claims['permissionKeys']),
      _readStringList(userData['permissionKeys']),
    );
    final moduleKeys = _preferNonEmpty(
      _readStringList(claims['moduleKeys']),
      _readStringList(userData['moduleKeys']),
    );

    final organizationSnapshot =
        await _firestore.collection('organizations').doc(tenantId).get();
    final organizationData =
        organizationSnapshot.data() ?? const <String, Object?>{};
    final organizationName =
        _readString(organizationData['name']) ?? 'Organizacao principal';

    return AuthSession(
      user: AppUser(
        id: user.uid,
        email: user.email?.trim() ?? _readString(userData['email']) ?? '',
        displayName:
            _readString(userData['displayName']) ??
            user.displayName?.trim() ??
            'Usuario EixoOne',
        permissionKeys: permissionKeys,
        moduleKeys: moduleKeys,
      ),
      organizations: [
        OrganizationSummary(
          id: tenantId,
          name: organizationName,
          roleLabel: _resolveRoleLabel(roleKeys),
        ),
      ],
      selectedOrganizationId: tenantId,
    );
  }

  AppFailure _mapAuthError(FirebaseAuthException error) {
    switch (error.code) {
      case 'invalid-email':
        return const AppFailure(
          title: 'E-mail invalido',
          message: 'Informe um e-mail valido para continuar.',
          code: 'INVALID_EMAIL',
        );
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return const AppFailure(
          title: 'Falha no login',
          message:
              'Nao foi possivel autenticar com as credenciais informadas. Revise e tente novamente.',
          retryable: true,
          code: 'INVALID_CREDENTIALS',
        );
      case 'too-many-requests':
        return const AppFailure(
          title: 'Tentativas em excesso',
          message:
              'Muitas tentativas foram detectadas. Aguarde um instante antes de tentar novamente.',
          retryable: true,
          code: 'TOO_MANY_REQUESTS',
        );
      case 'network-request-failed':
        return const AppFailure(
          title: 'Conexao instavel',
          message:
              'Nao foi possivel falar com o servidor de autenticacao. Verifique sua rede e tente novamente.',
          retryable: true,
          code: 'NETWORK_REQUEST_FAILED',
        );
      default:
        return AppFailure(
          title: 'Falha de autenticacao',
          message:
              'O acesso nao pode ser concluido neste momento. Codigo: ${error.code}.',
          retryable: true,
          code: error.code,
        );
    }
  }

  static String? _readString(Object? value) {
    if (value is String) {
      final normalized = value.trim();
      if (normalized.isNotEmpty) {
        return normalized;
      }
    }

    return null;
  }

  static List<String> _readStringList(Object? value) {
    if (value is Iterable) {
      return value
          .whereType<Object?>()
          .map(_readString)
          .whereType<String>()
          .toList(growable: false);
    }

    return const [];
  }

  static List<String> _preferNonEmpty(
    List<String> primary,
    List<String> secondary,
  ) {
    return primary.isNotEmpty ? primary : secondary;
  }

  static String _resolveRoleLabel(List<String> roleKeys) {
    if (roleKeys.contains('platform_admin')) {
      return 'Administrador';
    }

    if (roleKeys.contains('operator')) {
      return 'Operador';
    }

    if (roleKeys.contains('supervisor')) {
      return 'Supervisor';
    }

    return 'Usuario autorizado';
  }
}
