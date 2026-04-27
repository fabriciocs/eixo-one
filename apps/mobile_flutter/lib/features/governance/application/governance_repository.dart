import '../../../shared/models/auth_session.dart';
import '../domain/models/governance_commands.dart';
import '../domain/models/governance_models.dart';

abstract class GovernanceRepository {
  Future<AccessibleScopesSummary> fetchAccessibleScopes(AuthSession session);
  Future<UserContext> fetchUserContext(AuthSession session);
  Future<UserContext> switchContext(
    AuthSession session,
    SwitchOperationalContextInput input,
  );

  Future<GovernanceListResult<Company>> listCompanies(
    AuthSession session,
    CompanyFilters filters,
  );
  Future<Company> getCompany(AuthSession session, String companyId);
  Future<Company> createCompany(
    AuthSession session,
    CreateCompanyInput input,
  );
  Future<Company> updateCompany(
    AuthSession session,
    String companyId,
    UpdateCompanyInput input,
  );

  Future<GovernanceListResult<Establishment>> listEstablishments(
    AuthSession session,
    EstablishmentFilters filters,
  );
  Future<Establishment> getEstablishment(
    AuthSession session,
    String establishmentId,
  );
  Future<Establishment> createEstablishment(
    AuthSession session,
    CreateEstablishmentInput input,
  );
  Future<Establishment> updateEstablishment(
    AuthSession session,
    String establishmentId,
    UpdateEstablishmentInput input,
  );

  Future<GovernanceListResult<GovernanceUserSummary>> listUsers(
    AuthSession session,
    GovernanceUserFilters filters,
  );
  Future<UserScopeGrant> getUserScopeGrant(
    AuthSession session,
    String userId,
  );
  Future<UserScopeGrant> upsertUserScopeGrant(
    AuthSession session,
    String userId,
    UpsertUserScopeGrantInput input,
  );

  Future<ConsolidatedOverview> getConsolidatedOverview(AuthSession session);
  Future<GovernanceListResult<ConsolidationRun>> listConsolidationRuns(
    AuthSession session,
    ConsolidationRunFilters filters,
  );
  Future<ConsolidationRun> createConsolidationRun(
    AuthSession session,
    CreateConsolidationRunInput input,
  );

  Future<GovernanceListResult<SharingPolicy>> listSharingPolicies(
    AuthSession session,
  );
}
