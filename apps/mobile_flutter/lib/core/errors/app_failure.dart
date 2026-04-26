class AppFailure implements Exception {
  const AppFailure({
    required this.title,
    required this.message,
    this.retryable = false,
    this.code,
  });

  final String title;
  final String message;
  final bool retryable;
  final String? code;

  @override
  String toString() => '$title: $message';
}

