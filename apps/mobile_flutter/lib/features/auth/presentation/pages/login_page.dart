import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/form_section.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/primary_button.dart';
import '../../../../shared/utils/debouncer.dart';
import '../../domain/login_credentials.dart';
import '../controllers/auth_providers.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'admin@eixo.one');
  final _passwordController = TextEditingController(text: '12345678');
  late final Debouncer _debouncer;

  @override
  void initState() {
    super.initState();
    _debouncer = Debouncer(const Duration(milliseconds: 150));
  }

  @override
  void dispose() {
    _debouncer.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await ref.read(loginControllerProvider.notifier).signIn(
          LoginCredentials(
            email: _emailController.text,
            password: _passwordController.text,
          ),
        );

    final state = ref.read(loginControllerProvider);
    if (!mounted) {
      return;
    }

    if (!state.hasError) {
      context.go('/select-organization');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loginState = ref.watch(loginControllerProvider);
    final failure = loginState.asError?.error;

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  AppConfig.appName,
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  AppConfig.slogan,
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                const NetworkStatusBanner(),
                FormSection(
                  title: 'Entrar',
                  description:
                      'Use uma conta autorizada. O formulario valida os dados antes de qualquer tentativa de envio.',
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          key: const Key('login-email-field'),
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'E-mail',
                            hintText: 'voce@empresa.com',
                            prefixIcon: Icon(Icons.alternate_email),
                          ),
                          validator: LoginCredentials.validateEmail,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          key: const Key('login-password-field'),
                          controller: _passwordController,
                          obscureText: true,
                          textInputAction: TextInputAction.done,
                          decoration: const InputDecoration(
                            labelText: 'Senha',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                          validator: LoginCredentials.validatePassword,
                          onFieldSubmitted: (_) => _debouncer.run(_submit),
                        ),
                        const SizedBox(height: 16),
                        if (failure is AppFailure) ...[
                          ErrorState(failure: failure),
                          const SizedBox(height: 16),
                        ],
                        PrimaryButton(
                          key: const Key('login-submit-button'),
                          label: 'Entrar',
                          icon: Icons.login,
                          isLoading: loginState.isLoading,
                          onPressed: () => _debouncer.run(_submit),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => context.go('/forgot-password'),
                          child: const Text('Esqueci minha senha'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
