import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../core/config/app_config.dart';
import '../core/firebase/firebase_bootstrap.dart';
import '../core/theme/app_theme.dart';
import 'router/app_router.dart';

class EixoOneApp extends StatelessWidget {
  const EixoOneApp({
    super.key,
    required this.firebaseState,
  });

  final FirebaseBootstrapState firebaseState;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: buildAppRouter(firebaseState),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('pt', 'BR'),
        Locale('en'),
      ],
    );
  }
}
