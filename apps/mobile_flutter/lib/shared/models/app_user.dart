class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.permissionKeys,
    required this.moduleKeys,
  });

  final String id;
  final String email;
  final String displayName;
  final List<String> permissionKeys;
  final List<String> moduleKeys;

  bool hasPermission(String permissionKey) {
    return permissionKeys.contains(permissionKey);
  }
}

