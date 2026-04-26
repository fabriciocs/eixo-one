import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'network_status.dart';

class NetworkStatusService {
  NetworkStatusService({
    Connectivity? connectivity,
  }) : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  Stream<NetworkStatus> watch() async* {
    yield _mapResults(await _connectivity.checkConnectivity());
    yield* _connectivity.onConnectivityChanged.map(_mapResults);
  }

  NetworkStatus _mapResults(List<ConnectivityResult> results) {
    if (results.contains(ConnectivityResult.none)) {
      return NetworkStatus.offline;
    }

    if (results.contains(ConnectivityResult.mobile) ||
        results.contains(ConnectivityResult.vpn)) {
      return NetworkStatus.constrained;
    }

    return NetworkStatus.online;
  }
}

final networkStatusServiceProvider = Provider<NetworkStatusService>((ref) {
  return NetworkStatusService();
});

final networkStatusProvider = StreamProvider<NetworkStatus>((ref) {
  return ref.watch(networkStatusServiceProvider).watch();
});

