import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/form_section.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/primary_button.dart';
import '../../domain/login_credentials.dart';
import '../controllers/auth_providers.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() =>
      _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    try {
      await ref
          .read(authRepositoryProvider)
          .requestPasswordReset(_emailController.text);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Se o e-mail existir, enviaremos um link de redefinicao.',
          ),
        ),
      );
      context.go('/login');
    } on AppFailure catch (error) {
      setState(() {
        _failure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const NetworkStatusBanner(),
                FormSection(
                  title: 'Recuperar acesso',
                  description:
                      'Envie um e-mail valido para receber o fluxo de redefinicao. O feedback acontece na propria pagina.',
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            labelText: 'E-mail',
                            prefixIcon: Icon(Icons.mail_outline),
                          ),
                          validator: LoginCredentials.validateEmail,
                        ),
                        const SizedBox(height: 16),
                        if (_failure != null) ...[
                          ErrorState(failure: _failure!),
                          const SizedBox(height: 16),
                        ],
                        PrimaryButton(
                          label: 'Enviar link de redefinicao',
                          icon: Icons.send_outlined,
                          isLoading: _isSubmitting,
                          onPressed: _submit,
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => context.go('/login'),
                          child: const Text('Voltar para login'),
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
