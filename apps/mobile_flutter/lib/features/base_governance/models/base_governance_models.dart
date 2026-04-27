import '../../governance/domain/models/governance_models.dart';

typedef JsonMap = Map<String, dynamic>;

String _readString(Object? value) {
  if (value is String) {
    return value.trim();
  }

  return '';
}

List<String> _readStringList(Object? rawValue) {
  if (rawValue is! List) {
    return const [];
  }

  return rawValue
      .whereType<Object?>()
      .map((item) => item?.toString().trim() ?? '')
      .where((value) => value.isNotEmpty)
      .toList(growable: false);
}

JsonMap _readJsonMap(Object? rawValue) {
  if (rawValue is Map) {
    return rawValue.cast<String, dynamic>();
  }

  return const <String, dynamic>{};
}

List<T> _readList<T>(Object? rawValue, T Function(JsonMap json) parser) {
  if (rawValue is! List) {
    return const [];
  }

  return rawValue
      .whereType<Map>()
      .map((item) => parser(item.cast<String, dynamic>()))
      .toList(growable: false);
}

class BaseGovernanceListResult<T> {
  const BaseGovernanceListResult({
    required this.items,
    required this.pagination,
  });

  final List<T> items;
  final PaginationInfo pagination;
}

class BaseGovernanceRole {
  const BaseGovernanceRole({
    required this.roleId,
    required this.tenantId,
    required this.key,
    required this.name,
    required this.permissionKeys,
    required this.companyIds,
    required this.establishmentIds,
    required this.costCenterIds,
    required this.status,
    required this.version,
    required this.createdAt,
    required this.createdBy,
    this.description,
    this.updatedAt,
    this.updatedBy,
  });

  final String roleId;
  final String tenantId;
  final String key;
  final String name;
  final String? description;
  final List<String> permissionKeys;
  final List<String> companyIds;
  final List<String> establishmentIds;
  final List<String> costCenterIds;
  final GovernanceRecordStatus status;
  final int version;
  final String createdAt;
  final String createdBy;
  final String? updatedAt;
  final String? updatedBy;

  factory BaseGovernanceRole.fromJson(JsonMap json) {
    return BaseGovernanceRole(
      roleId: _readString(json['roleId']),
      tenantId: _readString(json['tenantId']),
      key: _readString(json['key']),
      name: _readString(json['name']),
      description: (_readString(json['description'])).isEmpty
          ? null
          : _readString(json['description']),
      permissionKeys: _readStringList(json['permissionKeys']),
      companyIds: _readStringList(json['companyIds']),
      establishmentIds: _readStringList(json['establishmentIds']),
      costCenterIds: _readStringList(json['costCenterIds']),
      status: GovernanceRecordStatus.fromWire(_readString(json['status'])),
      version: json['version'] as int? ?? 0,
      createdAt: _readString(json['createdAt']),
      createdBy: _readString(json['createdBy']),
      updatedAt: (_readString(json['updatedAt'])).isEmpty
          ? null
          : _readString(json['updatedAt']),
      updatedBy: (_readString(json['updatedBy'])).isEmpty
          ? null
          : _readString(json['updatedBy']),
    );
  }

  bool get isActive => status == GovernanceRecordStatus.active;
}

class CreateBaseGovernanceRoleInput {
  const CreateBaseGovernanceRoleInput({
    required this.key,
    required this.name,
    required this.permissionKeys,
    required this.companyIds,
    required this.establishmentIds,
    required this.costCenterIds,
    required this.status,
    this.description,
  });

  final String key;
  final String name;
  final String? description;
  final List<String> permissionKeys;
  final List<String> companyIds;
  final List<String> establishmentIds;
  final List<String> costCenterIds;
  final GovernanceRecordStatus status;

  JsonMap toJson() {
    return {
      'key': key,
      'name': name,
      'description': description,
      'permissionKeys': permissionKeys,
      'companyIds': companyIds,
      'establishmentIds': establishmentIds,
      'costCenterIds': costCenterIds,
      'status': status.wireName,
    };
  }
}

class UpdateBaseGovernanceRoleInput {
  const UpdateBaseGovernanceRoleInput({
    required this.expectedVersion,
    this.key,
    this.name,
    this.description,
    this.permissionKeys,
    this.companyIds,
    this.establishmentIds,
    this.costCenterIds,
    this.status,
  });

  final int expectedVersion;
  final String? key;
  final String? name;
  final String? description;
  final List<String>? permissionKeys;
  final List<String>? companyIds;
  final List<String>? establishmentIds;
  final List<String>? costCenterIds;
  final GovernanceRecordStatus? status;

  JsonMap toJson() {
    return {
      'expectedVersion': expectedVersion,
      if (key != null) 'key': key,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (permissionKeys != null) 'permissionKeys': permissionKeys,
      if (companyIds != null) 'companyIds': companyIds,
      if (establishmentIds != null) 'establishmentIds': establishmentIds,
      if (costCenterIds != null) 'costCenterIds': costCenterIds,
      if (status != null) 'status': status!.wireName,
    };
  }
}

class PermissionCatalogEntry {
  const PermissionCatalogEntry({
    required this.key,
    required this.label,
    required this.description,
    required this.moduleKey,
    required this.actionKey,
    required this.scopeTypes,
  });

  final String key;
  final String label;
  final String description;
  final String moduleKey;
  final String actionKey;
  final List<String> scopeTypes;

  factory PermissionCatalogEntry.fromJson(JsonMap json) {
    return PermissionCatalogEntry(
      key: _readString(json['key']),
      label: _readString(json['label']),
      description: _readString(json['description']),
      moduleKey: _readString(json['moduleKey']),
      actionKey: _readString(json['actionKey']),
      scopeTypes: _readStringList(json['scopeTypes']),
    );
  }
}

class BaseGovernanceAuditEvent {
  const BaseGovernanceAuditEvent({
    required this.contractVersion,
    required this.tenantId,
    required this.actorUserId,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.severity,
    required this.correlationId,
    required this.requestId,
    required this.metadata,
    required this.createdAt,
    this.before,
    this.after,
  });

  final String contractVersion;
  final String tenantId;
  final String actorUserId;
  final String entityType;
  final String entityId;
  final String action;
  final String severity;
  final String correlationId;
  final String requestId;
  final JsonMap? before;
  final JsonMap? after;
  final JsonMap metadata;
  final String createdAt;

  factory BaseGovernanceAuditEvent.fromJson(JsonMap json) {
    return BaseGovernanceAuditEvent(
      contractVersion: _readString(json['contractVersion']),
      tenantId: _readString(json['tenantId']),
      actorUserId: _readString(json['actorUserId']),
      entityType: _readString(json['entityType']),
      entityId: _readString(json['entityId']),
      action: _readString(json['action']),
      severity: _readString(json['severity']),
      correlationId: _readString(json['correlationId']),
      requestId: _readString(json['requestId']),
      before: json['before'] == null ? null : _readJsonMap(json['before']),
      after: json['after'] == null ? null : _readJsonMap(json['after']),
      metadata: _readJsonMap(json['metadata']),
      createdAt: _readString(json['createdAt']),
    );
  }
}

enum SettingScopeType {
  global('GLOBAL', 'Global'),
  tenant('TENANT', 'Tenant'),
  company('COMPANY', 'Empresa'),
  establishment('ESTABLISHMENT', 'Estabelecimento');

  const SettingScopeType(this.wireName, this.label);

  final String wireName;
  final String label;

  static SettingScopeType fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => SettingScopeType.tenant,
    );
  }
}

enum SettingValueType {
  string('string'),
  number('number'),
  boolean('boolean'),
  json('json');

  const SettingValueType(this.wireName);

  final String wireName;

  static SettingValueType fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => SettingValueType.string,
    );
  }
}

class BaseGovernanceSetting {
  const BaseGovernanceSetting({
    required this.settingKey,
    required this.tenantId,
    required this.moduleKey,
    required this.category,
    required this.label,
    required this.scopeType,
    required this.valueType,
    required this.value,
    required this.defaultValue,
    required this.sensitive,
    required this.status,
    required this.version,
    required this.createdAt,
    required this.createdBy,
    this.description,
    this.companyId,
    this.establishmentId,
    this.updatedAt,
    this.updatedBy,
  });

  final String settingKey;
  final String tenantId;
  final String moduleKey;
  final String category;
  final String label;
  final String? description;
  final SettingScopeType scopeType;
  final String? companyId;
  final String? establishmentId;
  final SettingValueType valueType;
  final Object? value;
  final Object? defaultValue;
  final bool sensitive;
  final GovernanceRecordStatus status;
  final int version;
  final String createdAt;
  final String createdBy;
  final String? updatedAt;
  final String? updatedBy;

  factory BaseGovernanceSetting.fromJson(JsonMap json) {
    return BaseGovernanceSetting(
      settingKey: _readString(json['settingKey']),
      tenantId: _readString(json['tenantId']),
      moduleKey: _readString(json['moduleKey']),
      category: _readString(json['category']),
      label: _readString(json['label']),
      description: (_readString(json['description'])).isEmpty
          ? null
          : _readString(json['description']),
      scopeType: SettingScopeType.fromWire(_readString(json['scopeType'])),
      companyId: (_readString(json['companyId'])).isEmpty
          ? null
          : _readString(json['companyId']),
      establishmentId: (_readString(json['establishmentId'])).isEmpty
          ? null
          : _readString(json['establishmentId']),
      valueType: SettingValueType.fromWire(_readString(json['valueType'])),
      value: json['value'],
      defaultValue: json['defaultValue'],
      sensitive: json['sensitive'] as bool? ?? false,
      status: GovernanceRecordStatus.fromWire(_readString(json['status'])),
      version: json['version'] as int? ?? 0,
      createdAt: _readString(json['createdAt']),
      createdBy: _readString(json['createdBy']),
      updatedAt: (_readString(json['updatedAt'])).isEmpty
          ? null
          : _readString(json['updatedAt']),
      updatedBy: (_readString(json['updatedBy'])).isEmpty
          ? null
          : _readString(json['updatedBy']),
    );
  }
}

class UpdateBaseGovernanceSettingInput {
  const UpdateBaseGovernanceSettingInput({
    required this.scopeType,
    required this.value,
    required this.expectedVersion,
    this.companyId,
    this.establishmentId,
  });

  final SettingScopeType scopeType;
  final String? companyId;
  final String? establishmentId;
  final Object? value;
  final int expectedVersion;

  JsonMap toJson() {
    return {
      'scopeType': scopeType.wireName,
      if (companyId != null) 'companyId': companyId,
      if (establishmentId != null) 'establishmentId': establishmentId,
      'value': value,
      'expectedVersion': expectedVersion,
    };
  }
}

class ResetBaseGovernanceSettingInput {
  const ResetBaseGovernanceSettingInput({
    required this.scopeType,
    required this.expectedVersion,
    this.companyId,
    this.establishmentId,
  });

  final SettingScopeType scopeType;
  final String? companyId;
  final String? establishmentId;
  final int expectedVersion;

  JsonMap toJson() {
    return {
      'scopeType': scopeType.wireName,
      if (companyId != null) 'companyId': companyId,
      if (establishmentId != null) 'establishmentId': establishmentId,
      'expectedVersion': expectedVersion,
    };
  }
}

class CustomerSummary {
  const CustomerSummary({
    required this.id,
    required this.legalName,
    required this.document,
    required this.status,
  });

  final String id;
  final String legalName;
  final String document;
  final String status;

  factory CustomerSummary.fromJson(Map<String, dynamic> json) {
    return CustomerSummary(
      id: json['id'] as String,
      legalName: json['legalName'] as String,
      document: json['document'] as String,
      status: json['status'] as String,
    );
  }
}

List<PermissionCatalogEntry> readPermissionCatalogList(Object? rawValue) {
  return _readList(rawValue, PermissionCatalogEntry.fromJson);
}

List<BaseGovernanceAuditEvent> readAuditEventList(Object? rawValue) {
  return _readList(rawValue, BaseGovernanceAuditEvent.fromJson);
}

List<BaseGovernanceSetting> readSettingsList(Object? rawValue) {
  return _readList(rawValue, BaseGovernanceSetting.fromJson);
}
