import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import {
  applyEmulatorEnvironment,
  emulatorConfig,
  readSeedStorageContent,
  seedAuthUsers,
  seedGovernanceCompanies,
  seedGovernanceConsolidationRuns,
  seedGovernanceContexts,
  seedGovernanceEstablishments,
  seedGovernanceGrants,
  seedGovernanceSharingPolicies,
  seedOrganizations,
  seedStorageObject,
  seedUsers,
} from './emulator-shared.mjs';

function isUserNotFound(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String(error.code) === 'auth/user-not-found'
  );
}

export async function seedEmulators() {
  applyEmulatorEnvironment();

  const app =
    getApps()[0] ??
    initializeApp({
      projectId: emulatorConfig.projectId,
      storageBucket: emulatorConfig.storageBucket,
    });

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const bucket = getStorage(app).bucket(emulatorConfig.storageBucket);

  let createdUsers = 0;
  let updatedUsers = 0;

  for (const user of seedAuthUsers) {
    try {
      await auth.getUser(user.uid);
      await auth.updateUser(user.uid, {
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        disabled: user.disabled,
      });
      updatedUsers += 1;
    } catch (error) {
      if (!isUserNotFound(error)) {
        throw error;
      }

      await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        disabled: user.disabled,
      });
      createdUsers += 1;
    }

    await auth.setCustomUserClaims(user.uid, user.claims);
  }

  const batch = firestore.batch();

  for (const organization of seedOrganizations) {
    batch.set(
      firestore.collection('organizations').doc(organization.id),
      organization,
      { merge: true },
    );
  }

  for (const user of seedUsers) {
    batch.set(firestore.collection('users').doc(user.id), user, { merge: true });
  }

  for (const company of seedGovernanceCompanies) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(company.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('companies')
        .doc(company.companyId),
      company,
      { merge: true },
    );
  }

  for (const establishment of seedGovernanceEstablishments) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(establishment.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('establishments')
        .doc(establishment.establishmentId),
      establishment,
      { merge: true },
    );
  }

  for (const grant of seedGovernanceGrants) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(grant.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('user_scope_grants')
        .doc(grant.userId),
      grant,
      { merge: true },
    );
  }

  for (const context of seedGovernanceContexts) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(context.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('user_contexts')
        .doc(context.userId),
      context,
      { merge: true },
    );
  }

  for (const policy of seedGovernanceSharingPolicies) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(policy.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('sharing_policies')
        .doc(policy.policyId),
      policy,
      { merge: true },
    );
  }

  for (const run of seedGovernanceConsolidationRuns) {
    batch.set(
      firestore
        .collection('tenants')
        .doc(run.tenantId)
        .collection('domains')
        .doc('governance')
        .collection('consolidation_runs')
        .doc(run.runId),
      run,
      { merge: true },
    );
  }

  await batch.commit();

  const storageFile = bucket.file(seedStorageObject.path);
  const [storageExists] = await storageFile.exists();

  if (!storageExists) {
    const content = await readSeedStorageContent();
    await storageFile.save(content, {
      resumable: false,
      contentType: seedStorageObject.contentType,
      metadata: {
        metadata: seedStorageObject.metadata,
      },
    });
  }

  console.log('[seed-emulators] Seed concluido.');
  console.log(
    `[seed-emulators] Auth users criados=${createdUsers} atualizados=${updatedUsers}.`,
  );
  console.log(
    `[seed-emulators] Firestore organizations=${seedOrganizations.length} users=${seedUsers.length}.`,
  );
  console.log(
    `[seed-emulators] Governance companies=${seedGovernanceCompanies.length} establishments=${seedGovernanceEstablishments.length} grants=${seedGovernanceGrants.length}.`,
  );
  console.log(
    `[seed-emulators] Storage bucket=${emulatorConfig.storageBucket} object=${seedStorageObject.path}.`,
  );
}

const invokedFromCli = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (invokedFromCli) {
  seedEmulators().catch((error) => {
    console.error('[seed-emulators] Falha ao semear emuladores.');
    console.error(error);
    process.exit(1);
  });
}
