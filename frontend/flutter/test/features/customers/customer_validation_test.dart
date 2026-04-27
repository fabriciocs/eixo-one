import 'package:flutter_test/flutter_test.dart';
import 'package:eixoone/features/customers/domain/customer.dart';

void main() {
  group('FG-010 validações de cliente', () {
    test('valida CPF verdadeiro', () {
      expect(isValidCpf('529.982.247-25'), isTrue);
    });

    test('rejeita CPF repetido', () {
      expect(isValidCpf('111.111.111-11'), isFalse);
    });

    test('valida CNPJ verdadeiro', () {
      expect(isValidCnpj('04.252.011/0001-10'), isTrue);
    });

    test('rejeita limite negativo', () {
      final draft = CustomerDraft(
        empresaId: 'empresa-123',
        tipoPessoa: CustomerPersonType.pj,
        nome: 'Cliente Teste Ltda',
        cpfCnpj: '04.252.011/0001-10',
        limiteCreditoCentavos: -1,
      );

      expect(validateCustomerDraft(draft), contains('Limite de crédito'));
    });

    test('rejeita HTML no nome', () {
      final draft = CustomerDraft(
        empresaId: 'empresa-123',
        tipoPessoa: CustomerPersonType.pj,
        nome: '<script>alert(1)</script>',
        cpfCnpj: '04.252.011/0001-10',
      );

      expect(validateCustomerDraft(draft), contains('HTML'));
    });
  });
}
