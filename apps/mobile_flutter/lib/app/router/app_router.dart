import 'package:go_router/go_router.dart';

import '../../core/firebase/firebase_bootstrap.dart';
import '../../core/layout/app_shell.dart';
import '../../features/app_shell/presentation/pages/audit_page.dart';
import '../../features/app_shell/presentation/pages/modules_page.dart';
import '../../features/app_shell/presentation/pages/notifications_page.dart';
import '../../features/app_shell/presentation/pages/profile_page.dart';
import '../../features/app_shell/presentation/pages/roles_page.dart';
import '../../features/app_shell/presentation/pages/settings_page.dart';
import '../../features/app_shell/presentation/pages/users_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/select_organization_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/governance/presentation/governance_routes.dart';
import '../../features/governance/presentation/pages/company_details_page.dart';
import '../../features/governance/presentation/pages/company_form_page.dart';
import '../../features/governance/presentation/pages/companies_page.dart';
import '../../features/governance/presentation/pages/consolidation_page.dart';
import '../../features/governance/presentation/pages/establishment_form_page.dart';
import '../../features/governance/presentation/pages/governance_overview_page.dart';
import '../../features/governance/presentation/pages/grants_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';

GoRouter buildAppRouter(FirebaseBootstrapState firebaseState) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => SplashPage(firebaseState: firebaseState),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/select-organization',
        builder: (context, state) => const SelectOrganizationPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => DashboardPage(
              firebaseState: firebaseState,
            ),
          ),
          GoRoute(
            path: GovernanceRoutes.overview,
            builder: (context, state) => const GovernanceOverviewPage(),
          ),
          GoRoute(
            path: GovernanceRoutes.companies,
            builder: (context, state) => const CompaniesPage(),
          ),
          GoRoute(
            path: GovernanceRoutes.companyNew,
            builder: (context, state) => const CompanyFormPage(),
          ),
          GoRoute(
            path: '/governance/companies/:companyId',
            builder: (context, state) => CompanyDetailsPage(
              companyId: state.pathParameters['companyId'] ?? '',
            ),
          ),
          GoRoute(
            path: '/governance/companies/:companyId/edit',
            builder: (context, state) => CompanyFormPage(
              companyId: state.pathParameters['companyId'],
            ),
          ),
          GoRoute(
            path: GovernanceRoutes.grants,
            builder: (context, state) => const GrantsPage(),
          ),
          GoRoute(
            path: GovernanceRoutes.consolidation,
            builder: (context, state) => const ConsolidationPage(),
          ),
          GoRoute(
            path: GovernanceRoutes.establishmentNew,
            builder: (context, state) => EstablishmentFormPage(
              initialCompanyId: state.uri.queryParameters['companyId'],
            ),
          ),
          GoRoute(
            path: '/governance/establishments/:establishmentId/edit',
            builder: (context, state) => EstablishmentFormPage(
              establishmentId: state.pathParameters['establishmentId'],
            ),
          ),
          GoRoute(
            path: '/modules',
            builder: (context, state) => const ModulesPage(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
          GoRoute(
            path: '/users',
            builder: (context, state) => const UsersPage(),
          ),
          GoRoute(
            path: '/roles',
            builder: (context, state) => const RolesPage(),
          ),
          GoRoute(
            path: '/audit',
            builder: (context, state) => const AuditPage(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsPage(),
          ),
        ],
      ),
    ],
  );
}
