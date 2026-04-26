import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/firebase/firebase_bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final firebaseState = await FirebaseBootstrap.initialize();

  runApp(
    ProviderScope(
      child: EixoOneApp(firebaseState: firebaseState),
    ),
  );
}
