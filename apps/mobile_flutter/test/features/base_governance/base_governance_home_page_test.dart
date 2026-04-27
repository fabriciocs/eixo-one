import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:eixoone_mobile/features/base_governance/pages/base_governance_home_page.dart';

void main() {
  testWidgets('renders base governance feature list', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: BaseGovernanceHomePage()));

    expect(find.text('Base e Governança'), findsOneWidget);
    expect(find.text('Perfis e permissões'), findsOneWidget);
    expect(find.text('Auditoria'), findsOneWidget);
  });
}
