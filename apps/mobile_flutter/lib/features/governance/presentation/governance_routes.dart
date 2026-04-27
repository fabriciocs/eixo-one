class GovernanceRoutes {
  static const overview = '/governance';
  static const companies = '/governance/companies';
  static const companyNew = '/governance/companies/new';
  static String companyDetails(String companyId) => '/governance/companies/$companyId';
  static String companyEdit(String companyId) => '/governance/companies/$companyId/edit';
  static const grants = '/governance/grants';
  static const consolidation = '/governance/consolidation';
  static const establishmentNew = '/governance/establishments/new';
  static String establishmentEdit(String establishmentId) =>
      '/governance/establishments/$establishmentId/edit';
}
