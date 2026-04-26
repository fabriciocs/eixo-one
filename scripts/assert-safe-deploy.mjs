const target = process.argv[2];

if (!target) {
  console.error('[deploy] Informe o ambiente alvo: staging ou production.');
  process.exit(1);
}

if (!['staging', 'production'].includes(target)) {
  console.error(`[deploy] Ambiente invalido: ${target}`);
  process.exit(1);
}

if (target === 'production' && process.env.ALLOW_PROD_DEPLOY !== 'true') {
  console.error(
    '[deploy] Deploy de producao bloqueado. Defina ALLOW_PROD_DEPLOY=true de forma explicita.',
  );
  process.exit(1);
}

console.log(`[deploy] Ambiente ${target} liberado para deploy.`);
