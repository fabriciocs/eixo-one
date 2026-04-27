class GovernancePermissions {
  static const companyRead = 'governance.company.read';
  static const companyCreate = 'governance.company.create';
  static const companyUpdate = 'governance.company.update';
  static const establishmentRead = 'governance.establishment.read';
  static const establishmentCreate = 'governance.establishment.create';
  static const establishmentUpdate = 'governance.establishment.update';
  static const userScopeManage = 'governance.user_scope.manage';
  static const contextSwitch = 'governance.context.switch';
  static const sharingPolicyManage = 'governance.sharing.policy.manage';
  static const consolidationRead = 'governance.consolidation.read';
  static const consolidationRun = 'governance.consolidation.run';
  static const consolidatedRead = 'reporting.consolidated.read';

  static const managementActions = <String>[
    companyCreate,
    companyUpdate,
    establishmentCreate,
    establishmentUpdate,
    userScopeManage,
    consolidationRun,
  ];
}
