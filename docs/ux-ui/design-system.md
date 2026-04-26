# EixoOne UI Foundation

## 7. Design system Flutter com Material 3

### Direcao visual

- profissional
- claro
- moderno
- confiavel
- modular
- limpo
- sem excesso de sombras

### Design tokens iniciais

#### Cores

- `primary`: `#2457C5`
- `secondary`: `#2F6F73`
- `tertiary`: `#7A4FC2`
- `surface`: `#F8FAFC`
- `surfaceContainer`: `#EEF2F7`
- `error`: `#BA1A1A`
- `success`: `#1B7F4C`
- `warning`: `#A05A00`

#### Tipografia

- `display`: telas institucionais e dashboard hero
- `headline`: titulos de pagina
- `title`: cards, secoes e dialogos secundarios
- `body`: formularios, listas e texto operacional
- `label`: botoes, badges e filtros

#### Espacamento

- `xs`: `4`
- `sm`: `8`
- `md`: `12`
- `lg`: `16`
- `xl`: `24`
- `xxl`: `32`

#### Radius

- `sm`: `8`
- `md`: `12`
- `lg`: `16`
- `xl`: `24`

#### Elevation

- `0`: base
- `1`: cards leves
- `2`: superficies elevadas
- `3`: paineis e drawers

#### Breakpoints

- `mobile`: `< 600`
- `tablet`: `600-1023`
- `desktop`: `>= 1024`

### Componentes base

- `AppShell`
- `NavigationShell`
- `ResponsivePage`
- `ActionBar`
- `FilterBar`
- `FormSection`
- `StatusBadge`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `AppCard`
- `PrimaryButton`

### Arquivo
`apps/mobile_flutter/lib/main.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'app/app.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const EixoOneApp());
}
```

### Arquivo
`apps/mobile_flutter/lib/app/app.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../core/theme/app_theme.dart';
import 'router/app_router.dart';

class EixoOneApp extends StatelessWidget {
  const EixoOneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'EixoOne',
      debugShowCheckedModeBanner: false,
      routerConfig: appRouter,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
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
```

### Arquivo
`apps/mobile_flutter/lib/core/theme/app_theme.dart`

```dart
import 'package:flutter/material.dart';

class AppTheme {
  static const _seed = Color(0xFF2457C5);
  static const _surface = Color(0xFFF8FAFC);
  static const _surfaceContainer = Color(0xFFEEF2F7);

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _seed,
      brightness: Brightness.light,
      primary: const Color(0xFF2457C5),
      secondary: const Color(0xFF2F6F73),
      tertiary: const Color(0xFF7A4FC2),
      surface: _surface,
      error: const Color(0xFFBA1A1A),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _surface,
      cardTheme: const CardThemeData(
        color: _surfaceContainer,
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _seed,
        brightness: Brightness.dark,
      ),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/app/router/app_router.dart`

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/layout/app_shell.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';

final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardPage(),
        ),
      ],
    ),
  ],
);
```

### Arquivo
`apps/mobile_flutter/lib/core/layout/app_shell.dart`

```dart
import 'package:flutter/material.dart';

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final isDesktop = width >= 1024;
    final isTablet = width >= 600 && width < 1024;

    final navigation = NavigationRail(
      selectedIndex: 0,
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard),
          label: Text('Dashboard'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.grid_view_outlined),
          selectedIcon: Icon(Icons.grid_view),
          label: Text('Modulos'),
        ),
      ],
    );

    if (isDesktop || isTablet) {
      return Scaffold(
        body: Row(
          children: [
            navigation,
            const VerticalDivider(width: 1),
            Expanded(child: child),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('EixoOne')),
      drawer: Drawer(child: navigation),
      body: child,
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/features/auth/presentation/pages/login_page.dart`

```dart
import 'package:flutter/material.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'EixoOne',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Gestao conectada. Decisoes claras.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                const TextField(
                  decoration: InputDecoration(
                    labelText: 'E-mail',
                    prefixIcon: Icon(Icons.alternate_email),
                  ),
                ),
                const SizedBox(height: 16),
                const TextField(
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Senha',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () {},
                  child: const Text('Entrar'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {},
                  child: const Text('Esqueci minha senha'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/features/dashboard/presentation/pages/dashboard_page.dart`

```dart
import 'package:flutter/material.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Resumo operacional da organizacao atual.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: const [
                _MetricCard(title: 'Vendas do dia', value: 'R\$ 24.500'),
                _MetricCard(title: 'Pedidos em aberto', value: '18'),
                _MetricCard(title: 'Alertas', value: '5'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
  });

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 240,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              const SizedBox(height: 12),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/design_system/components/app_card.dart`

```dart
import 'package:flutter/material.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/design_system/components/primary_button.dart`

```dart
import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      icon: Icon(icon ?? Icons.check),
      label: Text(label),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/design_system/components/empty_state.dart`

```dart
import 'package:flutter/material.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inbox_outlined, size: 48),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
```

### Arquivo
`apps/mobile_flutter/lib/design_system/components/loading_state.dart`

```dart
import 'package:flutter/material.dart';

class LoadingState extends StatelessWidget {
  const LoadingState({super.key, this.message = 'Carregando...'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(message),
        ],
      ),
    );
  }
}
```

### Acessibilidade obrigatoria

- contraste AA como base
- foco visivel
- area minima de toque de `44x44`
- labels semanticos em inputs e botoes
- mensagens de erro claras e proximas do campo
- navegacao por teclado em web e desktop
- nao depender so de cor para comunicar estado

### Observacao importante

`firebase_options.dart` deve ser gerado pelo `flutterfire configure`. Nao invente credenciais manualmente para producao.
