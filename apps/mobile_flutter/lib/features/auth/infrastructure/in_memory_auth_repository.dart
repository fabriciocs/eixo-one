import '../../../core/errors/app_failure.dart';
import '../../../shared/models/app_user.dart';
import '../../../shared/models/auth_session.dart';
import '../../../shared/models/organization_summary.dart';
import '../application/auth_repository.dart';
import '../domain/login_credentials.dart';

class InMemoryAuthRepository implements AuthRepository {
  const InMemoryAuthRepository();

  @override
  Future<AuthSession?> restoreSession() async {
    return null;
  }

  @override
  Future<AuthSession> signIn(LoginCredentials credentials) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));

    if (credentials.normalizedEmail == 'bloqueado@eixo.one') {
      throw const AppFailure(
        title: 'Acesso indisponivel',
        message:
            'Esta conta esta bloqueada. Fale com o administrador da organizacao para revisar permissoes.',
        retryable: false,
        code: 'ACCOUNT_LOCKED',
      );
    }

    if (credentials.password != '12345678') {
      throw const AppFailure(
        title: 'Falha no login',
        message:
            'Nao foi possivel autenticar com as credenciais informadas. Revise e tente novamente.',
        retryable: true,
        code: 'INVALID_CREDENTIALS',
      );
    }

    if (credentials.normalizedEmail == 'operador@eixo.one') {
      return AuthSession(
        user: const AppUser(
          id: 'user_operator',
          email: 'operador@eixo.one',
          displayName: 'Operador EixoOne',
          permissionKeys: [
            'governance.company.read',
            'governance.establishment.read',
            'governance.context.switch',
            'reporting.consolidated.read',
          ],
          moduleKeys: ['dashboard', 'governance'],
        ),
        organizations: const [
          OrganizationSummary(
            id: 'tenant_demo',
            name: 'EixoOne Demo',
            roleLabel: 'Operador',
          ),
        ],
        selectedOrganizationId: 'tenant_demo',
      );
    }

    return AuthSession(
      user: AppUser(
        id: 'user_admin',
        email: credentials.normalizedEmail,
        displayName: 'Admin EixoOne',
        permissionKeys: const [
          'users.read',
          'users.manage',
          'roles.read',
          'roles.manage',
          'settings.read',
          'settings.manage',
          'audit.read',
          'governance.company.read',
          'governance.company.create',
          'governance.company.update',
          'governance.company.activate',
          'governance.company.inactivate',
          'governance.company.archive',
          'governance.establishment.read',
          'governance.establishment.create',
          'governance.establishment.update',
          'governance.establishment.activate',
          'governance.establishment.inactivate',
          'governance.establishment.archive',
          'governance.user_scope.manage',
          'governance.context.switch',
          'governance.sharing.policy.manage',
          'governance.consolidation.read',
          'governance.consolidation.run',
          'reporting.consolidated.read',
        ],
        moduleKeys: const [
          'dashboard',
          'users',
          'roles',
          'audit',
          'governance',
        ],
      ),
      organizations: const [
        OrganizationSummary(
          id: 'tenant_demo',
          name: 'EixoOne Demo',
          roleLabel: 'Administrador',
        ),
        OrganizationSummary(
          id: 'tenant_ops',
          name: 'Operacao Piloto',
          roleLabel: 'Supervisor',
        ),
      ],
      selectedOrganizationId: 'tenant_demo',
    );
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));

    if (!email.trim().contains('@')) {
      throw const AppFailure(
        title: 'E-mail invalido',
        message: 'Informe um e-mail valido para receber o link de redefinicao.',
      );
    }
  }

  @override
  Future<void> signOut() async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
  }
}
