import 'package:eixoone_mobile/core/network/network_status.dart';
import 'package:eixoone_mobile/core/network/network_status_provider.dart';
import 'package:eixoone_mobile/features/app_shell/presentation/pages/audit_page.dart';
import 'package:eixoone_mobile/features/app_shell/presentation/pages/roles_page.dart';
import 'package:eixoone_mobile/features/app_shell/presentation/pages/settings_page.dart';
import 'package:eixoone_mobile/features/auth/presentation/controllers/auth_providers.dart';
import 'package:eixoone_mobile/features/governance/domain/models/governance_permissions.dart';
import 'package:eixoone_mobile/features/governance/presentation/pages/company_form_page.dart';
import 'package:eixoone_mobile/features/governance/presentation/pages/companies_page.dart';
import 'package:eixoone_mobile/features/governance/presentation/pages/consolidation_page.dart';
import 'package:eixoone_mobile/features/governance/presentation/pages/governance_overview_page.dart';
import 'package:eixoone_mobile/features/governance/presentation/pages/grants_page.dart';
import 'package:eixoone_mobile/shared/models/app_user.dart';
import 'package:eixoone_mobile/shared/models/auth_session.dart';
import 'package:eixoone_mobile/shared/models/organization_summary.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('overview page shows loading then governance metrics', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(
        session: _adminSession(),
        child: const GovernanceOverviewPage(),
      ),
    );

    expect(
      find.text('Carregando visao geral de governanca...'),
      findsOneWidget,
    );

    await tester.pumpAndSettle();

    expect(find.text('Empresas ativas'), findsOneWidget);
    expect(find.text('Acoes principais'), findsOneWidget);
    expect(find.text('Empresa Demo LTDA'), findsWidgets);
  });

  testWidgets('companies page shows no-permission state when read is blocked', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(
        session: _readOnlyGovernanceSession(),
        child: const CompaniesPage(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Sem permissao para listar empresas'), findsOneWidget);
  });

  testWidgets('company form validates required fields inline', (tester) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _adminSession(), child: const CompanyFormPage()),
    );

    await tester.pumpAndSettle();
    await tester.tap(find.text('Salvar empresa'));
    await tester.pumpAndSettle();

    expect(find.text('Informe a razao social.'), findsOneWidget);
    expect(find.text('Informe a raiz cadastral da empresa.'), findsOneWidget);
  });

  testWidgets('grants page loads users and selected grant', (tester) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _adminSession(), child: const GrantsPage()),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    expect(find.text('Usuarios do tenant'), findsOneWidget);
    expect(find.text('Grant de user_admin'), findsOneWidget);
    expect(find.text('Empresa padrao'), findsOneWidget);
    expect(find.text('Papeis atribuidos'), findsOneWidget);
    expect(find.text('Overrides de permissao'), findsOneWidget);
  });

  testWidgets('roles page loads seeded roles and permission catalog', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _adminSession(), child: const RolesPage()),
    );

    await tester.pumpAndSettle();

    expect(find.text('Catalogo de perfis'), findsOneWidget);
    expect(find.text('Administrador da plataforma'), findsWidgets);
    expect(find.text('Novo perfil'), findsOneWidget);
    expect(find.text('Catalogo'), findsOneWidget);
  });

  testWidgets('roles page blocks operator without role catalog permission', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _operatorSession(), child: const RolesPage()),
    );

    await tester.pumpAndSettle();

    expect(find.text('Sem permissao para papeis'), findsOneWidget);
  });

  testWidgets('audit page renders seeded administrative trail', (tester) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _adminSession(), child: const AuditPage()),
    );

    await tester.pumpAndSettle();

    expect(find.text('Eventos visiveis'), findsOneWidget);
    expect(find.text('role.created'), findsOneWidget);
    expect(find.text('grant.updated'), findsOneWidget);
  });

  testWidgets('settings page loads seeded administrative settings', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _adminSession(), child: const SettingsPage()),
    );

    await tester.pumpAndSettle();

    expect(find.text('Catalogo de configuracoes'), findsOneWidget);
    expect(find.text('Serie de faturamento'), findsOneWidget);
    expect(find.text('Restaurar padrao'), findsOneWidget);
  });

  testWidgets('settings page blocks operator without permission', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(session: _operatorSession(), child: const SettingsPage()),
    );

    await tester.pumpAndSettle();

    expect(find.text('Sem permissao para configuracoes'), findsOneWidget);
  });

  testWidgets('consolidation page stays read-only for operator profile', (
    tester,
  ) async {
    await _setDesktopSurface(tester);
    await tester.pumpWidget(
      _TestHarness(
        session: _operatorSession(),
        child: const ConsolidationPage(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Seu perfil esta em leitura consolidada'), findsOneWidget);
    expect(find.text('Nova run formal'), findsNothing);
  });
}

Future<void> _setDesktopSurface(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(1440, 2000));
  addTearDown(() => tester.binding.setSurfaceSize(null));
}

class _TestHarness extends StatelessWidget {
  const _TestHarness({required this.session, required this.child});

  final AuthSession session;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final container = ProviderContainer(
      overrides: [
        networkStatusProvider.overrideWith(
          (ref) => Stream.value(NetworkStatus.online),
        ),
      ],
    );
    container.read(authSessionProvider.notifier).setSession(session);

    return UncontrolledProviderScope(
      container: container,
      child: MaterialApp(home: Scaffold(body: child)),
    );
  }
}

AuthSession _adminSession() {
  return AuthSession(
    user: const AppUser(
      id: 'user_admin',
      email: 'admin@eixo.one',
      displayName: 'Admin EixoOne',
      permissionKeys: [
        GovernancePermissions.companyRead,
        GovernancePermissions.companyCreate,
        GovernancePermissions.companyUpdate,
        GovernancePermissions.establishmentRead,
        GovernancePermissions.establishmentCreate,
        GovernancePermissions.establishmentUpdate,
        GovernancePermissions.userScopeManage,
        GovernancePermissions.contextSwitch,
        GovernancePermissions.consolidationRead,
        GovernancePermissions.consolidationRun,
        GovernancePermissions.consolidatedRead,
        'roles.read',
        'roles.manage',
        'settings.read',
        'settings.manage',
        'audit.read',
      ],
      moduleKeys: ['dashboard', 'governance', 'roles', 'audit'],
    ),
    organizations: const [
      OrganizationSummary(
        id: 'tenant_demo',
        name: 'Tenant Demo',
        roleLabel: 'Platform admin',
      ),
    ],
    selectedOrganizationId: 'tenant_demo',
  );
}

AuthSession _operatorSession() {
  return AuthSession(
    user: const AppUser(
      id: 'user_operator',
      email: 'operador@eixo.one',
      displayName: 'Operador EixoOne',
      permissionKeys: [
        GovernancePermissions.companyRead,
        GovernancePermissions.establishmentRead,
        GovernancePermissions.contextSwitch,
        GovernancePermissions.consolidatedRead,
      ],
      moduleKeys: ['dashboard', 'governance'],
    ),
    organizations: const [
      OrganizationSummary(
        id: 'tenant_demo',
        name: 'Tenant Demo',
        roleLabel: 'Operator',
      ),
    ],
    selectedOrganizationId: 'tenant_demo',
  );
}

AuthSession _readOnlyGovernanceSession() {
  return AuthSession(
    user: const AppUser(
      id: 'user_operator',
      email: 'operador@eixo.one',
      displayName: 'Operador EixoOne',
      permissionKeys: [
        GovernancePermissions.contextSwitch,
        GovernancePermissions.consolidatedRead,
      ],
      moduleKeys: ['dashboard', 'governance'],
    ),
    organizations: const [
      OrganizationSummary(
        id: 'tenant_demo',
        name: 'Tenant Demo',
        roleLabel: 'Operator',
      ),
    ],
    selectedOrganizationId: 'tenant_demo',
  );
}
