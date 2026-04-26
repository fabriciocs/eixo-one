import 'app_user.dart';
import 'organization_summary.dart';

class AuthSession {
  const AuthSession({
    required this.user,
    required this.organizations,
    required this.selectedOrganizationId,
  });

  final AppUser user;
  final List<OrganizationSummary> organizations;
  final String? selectedOrganizationId;

  OrganizationSummary? get selectedOrganization {
    for (final organization in organizations) {
      if (organization.id == selectedOrganizationId) {
        return organization;
      }
    }

    return organizations.isEmpty ? null : organizations.first;
  }

  AuthSession copyWith({
    AppUser? user,
    List<OrganizationSummary>? organizations,
    String? selectedOrganizationId,
  }) {
    return AuthSession(
      user: user ?? this.user,
      organizations: organizations ?? this.organizations,
      selectedOrganizationId:
          selectedOrganizationId ?? this.selectedOrganizationId,
    );
  }
}

