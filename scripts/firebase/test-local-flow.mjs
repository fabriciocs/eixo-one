import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  applyEmulatorEnvironment,
  repoRoot,
  signInWithPassword,
} from './emulator-shared.mjs';
import { seedEmulators } from './seed-emulators.mjs';

export async function runLocalFlowTest() {
  applyEmulatorEnvironment({
    APP_ENV: 'development',
    DATA_MODE: 'firebase',
    PORT: '4100',
    CORS_ORIGIN: 'http://localhost:5000,http://127.0.0.1:5000',
  });

  await seedEmulators();

  const serverPath = path.join(repoRoot, 'backend', 'api_node', 'dist', 'server.js');
  if (!fs.existsSync(serverPath)) {
    throw new Error(
      'backend/api_node/dist/server.js nao encontrado. Rode "npm run build -w @eixoone/api-node" antes deste teste.',
    );
  }

  const { buildServer } = await import(pathToFileURL(serverPath).href);
  const app = await buildServer();

  try {
    const signInResponse = await signInWithPassword('admin@eixo.one', '12345678');
    assert.equal(typeof signInResponse.idToken, 'string');
    assert.ok(signInResponse.idToken.length > 20);

    const healthResponse = await app.inject({
      method: 'GET',
      url: '/health',
    });
    assert.equal(healthResponse.statusCode, 200);
    assert.equal(healthResponse.json().status, 'ok');

    const readyResponse = await app.inject({
      method: 'GET',
      url: '/ready',
    });
    assert.equal(readyResponse.statusCode, 200);
    assert.equal(readyResponse.json().status, 'ready');

    const meResponse = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: `Bearer ${signInResponse.idToken}`,
      },
    });
    assert.equal(meResponse.statusCode, 200);
    assert.equal(meResponse.json().data.id, 'user_admin');
    assert.equal(meResponse.json().data.tenantId, 'tenant_demo');

    const usersResponse = await app.inject({
      method: 'GET',
      url: '/v1/users?page=1&pageSize=10',
      headers: {
        authorization: `Bearer ${signInResponse.idToken}`,
      },
    });
    assert.equal(usersResponse.statusCode, 200);
    assert.equal(usersResponse.json().data.items.length, 2);
    assert.ok(
      usersResponse
        .json()
        .data.items.every((item) => item.tenantId === 'tenant_demo'),
    );

    console.log('[test-local-flow] Login, /me e leitura por tenant validados.');
  } finally {
    await app.close();
  }
}

runLocalFlowTest().catch((error) => {
  console.error('[test-local-flow] Falha no fluxo local contra emuladores.');
  console.error(error);
  process.exit(1);
});
