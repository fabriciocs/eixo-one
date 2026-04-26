import 'package:eixoone_mobile/app/app.dart';
import 'package:eixoone_mobile/core/firebase/firebase_bootstrap.dart';
import 'package:eixoone_mobile/features/auth/presentation/pages/login_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders EixoOne login flow from splash', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: EixoOneApp(
          firebaseState: FirebaseBootstrapState(
            status: FirebaseBootstrapStatus.pendingConfiguration,
            message: 'Firebase pendente.',
            usingEmulators: false,
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('EixoOne'), findsWidgets);
    expect(find.byKey(const Key('login-submit-button')), findsOneWidget);
  });

  testWidgets('shows validation messages on login form', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: LoginPage(),
        ),
      ),
    );

    await tester.enterText(
      find.byKey(const Key('login-email-field')),
      'email-invalido',
    );
    await tester.enterText(
      find.byKey(const Key('login-password-field')),
      '123',
    );
    await tester.tap(find.byKey(const Key('login-submit-button')));
    await tester.pumpAndSettle();

    expect(find.text('Digite um e-mail valido.'), findsOneWidget);
    expect(find.text('Use pelo menos 8 caracteres.'), findsOneWidget);
  });
}
