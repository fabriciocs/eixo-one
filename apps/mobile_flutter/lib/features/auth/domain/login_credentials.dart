class LoginCredentials {
  const LoginCredentials({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;

  String get normalizedEmail => email.trim().toLowerCase();

  static String? validateEmail(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Informe seu e-mail corporativo.';
    }

    final emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailPattern.hasMatch(email)) {
      return 'Digite um e-mail valido.';
    }

    return null;
  }

  static String? validatePassword(String? value) {
    final password = value ?? '';

    if (password.isEmpty) {
      return 'Informe sua senha.';
    }

    if (password.length < 8) {
      return 'Use pelo menos 8 caracteres.';
    }

    return null;
  }
}
