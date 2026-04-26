import assert from 'node:assert/strict';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';

import {
  emulatorConfig,
  readFirestoreRules,
  readStorageRules,
  seedOrganizations,
  seedUsers,
} from './emulator-shared.mjs';

const [firestoreHost, firestorePortText] = emulatorConfig.firestoreHost.split(':');
const [storageHost, storagePortText] = emulatorConfig.storageHost.split(':');

export async function runEmulatorRulesTest() {
  const testEnv = await initializeTestEnvironment({
    projectId: emulatorConfig.projectId,
    firestore: {
      host: firestoreHost,
      port: Number(firestorePortText),
      rules: await readFirestoreRules(),
    },
    storage: {
      host: storageHost,
      port: Number(storagePortText),
      rules: await readStorageRules(),
    },
  });

  try {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      for (const organization of seedOrganizations) {
        await setDoc(doc(db, 'organizations', organization.id), organization);
      }

      for (const user of seedUsers) {
        await setDoc(doc(db, 'users', user.id), user);
      }
    });

    const operatorClaims = {
      tenantId: 'tenant_demo',
      role: 'operator',
      roleKeys: ['operator'],
      permissionKeys: ['users.read'],
      moduleKeys: ['dashboard', 'users'],
    };

    const operatorContext = testEnv.authenticatedContext(
      'user_operator',
      operatorClaims,
    );
    const operatorDb = operatorContext.firestore();
    const operatorStorage = operatorContext.storage(emulatorConfig.storageBucket);

    const ownOrganizationSnapshot = await assertSucceeds(
      getDoc(doc(operatorDb, 'organizations', 'tenant_demo')),
    );
    assert.equal(ownOrganizationSnapshot.exists(), true);

    await assertFails(getDoc(doc(operatorDb, 'organizations', 'tenant_ops')));
    await assertSucceeds(getDoc(doc(operatorDb, 'users', 'user_admin')));
    await assertFails(getDoc(doc(operatorDb, 'users', 'user_external')));

    await assertSucceeds(
      uploadString(
        ref(
          operatorStorage,
          `organizations/tenant_demo/uploads/rules-smoke-${Date.now()}.csv`,
        ),
        'month,total\n2026-04,12\n',
        'raw',
        {
          contentType: 'text/csv',
          customMetadata: {
            tenantId: 'tenant_demo',
            uploadedBy: 'user_operator',
          },
        },
      ),
    );

    await assertFails(
      uploadString(
        ref(
          operatorStorage,
          `organizations/tenant_ops/uploads/denied-${Date.now()}.csv`,
        ),
        'month,total\n2026-04,99\n',
        'raw',
        {
          contentType: 'text/csv',
          customMetadata: {
            tenantId: 'tenant_ops',
            uploadedBy: 'user_operator',
          },
        },
      ),
    );

    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonymousDb, 'organizations', 'tenant_demo')));

    console.log('[test-emulator-rules] Regras Firestore/Storage validadas.');
  } finally {
    await testEnv.cleanup();
  }
}

runEmulatorRulesTest().catch((error) => {
  console.error('[test-emulator-rules] Falha nos smoke tests de rules.');
  console.error(error);
  process.exit(1);
});
