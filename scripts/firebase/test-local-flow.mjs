import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  applyEmulatorEnvironment,
  emulatorConfig,
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
  const adminApp =
    getApps()[0] ??
    initializeApp({
      projectId: emulatorConfig.projectId,
    });
  const firestore = getFirestore(adminApp);

  try {
    const adminSignInResponse = await signInWithPassword(
      'admin@eixo.one',
      '12345678',
    );
    assert.equal(typeof adminSignInResponse.idToken, 'string');
    assert.ok(adminSignInResponse.idToken.length > 20);

    const operatorSignInResponse = await signInWithPassword(
      'operador@eixo.one',
      '12345678',
    );
    assert.equal(typeof operatorSignInResponse.idToken, 'string');
    assert.ok(operatorSignInResponse.idToken.length > 20);

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
        authorization: `Bearer ${adminSignInResponse.idToken}`,
      },
    });
    assert.equal(meResponse.statusCode, 200);
    assert.equal(meResponse.json().data.id, 'user_admin');
    assert.equal(meResponse.json().data.tenantId, 'tenant_demo');

    const usersResponse = await app.inject({
      method: 'GET',
      url: '/v1/users?page=1&pageSize=10',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
      },
    });
    assert.equal(usersResponse.statusCode, 200);
    assert.equal(usersResponse.json().data.items.length, 2);
    assert.ok(
      usersResponse
        .json()
        .data.items.every((item) => item.tenantId === 'tenant_demo'),
    );

    const companiesResponse = await app.inject({
      method: 'GET',
      url: '/v1/governance/companies?page=1&pageSize=10',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
      },
    });
    assert.equal(companiesResponse.statusCode, 200);
    assert.equal(companiesResponse.json().data.items.length, 2);

    const accessibleScopesResponse = await app.inject({
      method: 'GET',
      url: '/v1/governance/me/accessible-scopes',
      headers: {
        authorization: `Bearer ${operatorSignInResponse.idToken}`,
      },
    });
    assert.equal(accessibleScopesResponse.statusCode, 200);
    assert.deepEqual(
      accessibleScopesResponse.json().data.grant.allowedCompanyIds,
      ['cmp_demo'],
    );

    const contextResponse = await app.inject({
      method: 'GET',
      url: '/v1/governance/me/context',
      headers: {
        authorization: `Bearer ${operatorSignInResponse.idToken}`,
      },
    });
    assert.equal(contextResponse.statusCode, 200);
    assert.equal(
      contextResponse.json().data.activeEstablishmentId,
      'est_demo_branch',
    );

    const createCompanyPayload = {
      legalName: 'Nova Empresa Local LTDA',
      tradeName: 'Nova Local',
      companyRootRegistration: '11112222',
      countryCode: 'BR',
      legalNatureCode: '2062',
      openingDate: '2026-04-26',
      regimeTributario: 'LUCRO_REAL',
      defaultCurrency: 'BRL',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
    };
    const companyIdempotencyKey = 'local-flow-governance-company-001';

    const firstCreateCompanyResponse = await app.inject({
      method: 'POST',
      url: '/v1/governance/companies',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
        'x-idempotency-key': companyIdempotencyKey,
      },
      payload: createCompanyPayload,
    });
    assert.equal(firstCreateCompanyResponse.statusCode, 201);

    const secondCreateCompanyResponse = await app.inject({
      method: 'POST',
      url: '/v1/governance/companies',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
        'x-idempotency-key': companyIdempotencyKey,
      },
      payload: createCompanyPayload,
    });
    assert.equal(secondCreateCompanyResponse.statusCode, 201);
    assert.equal(
      secondCreateCompanyResponse.headers['x-idempotency-replayed'],
      'true',
    );
    assert.equal(
      secondCreateCompanyResponse.json().meta.idempotencyReplayed,
      true,
    );

    const createdCompanyId = firstCreateCompanyResponse.json().data.companyId;
    const createdCompanySnapshot = await firestore
      .collection('tenants')
      .doc('tenant_demo')
      .collection('domains')
      .doc('governance')
      .collection('companies')
      .doc(createdCompanyId)
      .get();
    assert.equal(createdCompanySnapshot.exists, true);
    assert.equal(
      createdCompanySnapshot.data()?.companyRootRegistration,
      createCompanyPayload.companyRootRegistration,
    );

    const idempotencySnapshot = await firestore
      .collection('idempotency_records')
      .where('scope', '==', `tenant_demo:company:create:${companyIdempotencyKey}`)
      .limit(1)
      .get();
    assert.equal(idempotencySnapshot.empty, false);

    const auditLogSnapshot = await firestore
      .collection('audit_logs')
      .where('entityId', '==', createdCompanyId)
      .limit(1)
      .get();
    assert.equal(auditLogSnapshot.empty, false);
    assert.equal(auditLogSnapshot.docs[0]?.data().action, 'company.created');

    const overviewResponse = await app.inject({
      method: 'GET',
      url: '/v1/governance/consolidated/overview',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
      },
    });
    assert.equal(overviewResponse.statusCode, 200);
    assert.equal(overviewResponse.json().data.activeCompanyCount, 2);

    const runsResponse = await app.inject({
      method: 'GET',
      url: '/v1/governance/consolidation-runs?page=1&pageSize=10',
      headers: {
        authorization: `Bearer ${adminSignInResponse.idToken}`,
      },
    });
    assert.equal(runsResponse.statusCode, 200);
    assert.equal(runsResponse.json().data.items.length >= 1, true);

    console.log(
      '[test-local-flow] Login, tenancy, governance, idempotencia e auditoria validados.',
    );
  } finally {
    await app.close();
  }
}

runLocalFlowTest().catch((error) => {
  console.error('[test-local-flow] Falha no fluxo local contra emuladores.');
  console.error(error);
  process.exit(1);
});
