class BaseGovernanceRole {
  const BaseGovernanceRole({
    required this.id,
    required this.key,
    required this.name,
    required this.permissionKeys,
    required this.status,
  });

  final String id;
  final String key;
  final String name;
  final List<String> permissionKeys;
  final String status;

  factory BaseGovernanceRole.fromJson(Map<String, dynamic> json) {
    return BaseGovernanceRole(
      id: json['id'] as String,
      key: json['key'] as String,
      name: json['name'] as String,
      permissionKeys: List<String>.from(json['permissionKeys'] as List<dynamic>),
      status: json['status'] as String,
    );
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
