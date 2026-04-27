import '../domain/customer.dart';

class CustomerPage {
  const CustomerPage({
    required this.items,
    this.nextCursor,
  });

  final List<Customer> items;
  final String? nextCursor;
}

class CustomerFilters {
  const CustomerFilters({
    required this.empresaId,
    this.filialId,
    this.query,
    this.status,
    this.tipoPessoa,
    this.tag,
    this.pageSize = 25,
    this.cursor,
  });

  final String empresaId;
  final String? filialId;
  final String? query;
  final CustomerStatus? status;
  final CustomerPersonType? tipoPessoa;
  final String? tag;
  final int pageSize;
  final String? cursor;
}

abstract class CustomersRepository {
  Future<CustomerPage> list(CustomerFilters filters);
  Future<Customer> getById(String customerId);
  Future<Customer> create(CustomerDraft draft);
  Future<Customer> update(String customerId, int version, CustomerDraft draft);
  Future<Customer> changeStatus(String customerId, int version, CustomerStatus status, String reason);
  Future<void> softDelete(String customerId, int version);
}

class CustomerApiException implements Exception {
  const CustomerApiException({
    required this.code,
    required this.message,
    this.fieldErrors = const {},
    this.correlationId,
  });

  final String code;
  final String message;
  final Map<String, String> fieldErrors;
  final String? correlationId;

  @override
  String toString() => 'CustomerApiException($code, $message)';
}
