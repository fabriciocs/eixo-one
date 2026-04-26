import 'package:eixoone_mobile/app/app.dart';
import 'package:eixoone_mobile/core/firebase/firebase_bootstrap.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders EixoOne login title', (tester) async {
    await tester.pumpWidget(
      const EixoOneApp(
        firebaseState: FirebaseBootstrapState(
          status: FirebaseBootstrapStatus.pendingConfiguration,
          message: 'Firebase pendente.',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('EixoOne'), findsWidgets);
  });
}
