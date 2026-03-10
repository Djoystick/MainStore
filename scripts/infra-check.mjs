#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const envLocalPath = path.join(rootDir, '.env.local');

const PUBLIC_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const SERVER_ENV = ['SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'APP_SESSION_SECRET'];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      return;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  });

  return result;
}

function readEnvValue(name, localEnv) {
  const fromProcess = process.env[name];
  if (fromProcess && fromProcess.trim()) {
    return fromProcess.trim();
  }
  const fromLocal = localEnv[name];
  if (fromLocal && fromLocal.trim()) {
    return fromLocal.trim();
  }
  return '';
}

function getMissing(names, localEnv) {
  return names.filter((name) => !readEnvValue(name, localEnv));
}

function printSection(title) {
  process.stdout.write(`\n${title}\n`);
}

function printProfile(profileName, requiredEnv, localEnv) {
  const missing = getMissing(requiredEnv, localEnv);
  const state = missing.length === 0 ? 'OK' : 'MISSING';
  process.stdout.write(`- ${profileName}: ${state}\n`);
  if (missing.length > 0) {
    process.stdout.write(`  missing: ${missing.join(', ')}\n`);
  }
  return missing.length === 0;
}

function main() {
  const localEnv = parseEnvFile(envLocalPath);
  const strict = process.argv.includes('--strict');

  printSection('MainStore Infra Check');
  process.stdout.write(`- .env.local found: ${fs.existsSync(envLocalPath) ? 'yes' : 'no'}\n`);
  process.stdout.write(`- strict mode: ${strict ? 'on' : 'off'}\n`);

  printSection('Env Groups');
  process.stdout.write(`- public: ${PUBLIC_ENV.join(', ')}\n`);
  process.stdout.write(`- server-only: ${SERVER_ENV.join(', ')}\n`);

  printSection('Profiles');
  const storefrontOk = printProfile('Storefront live data', PUBLIC_ENV, localEnv);
  const userFlowOk = printProfile(
    'Telegram session + favorites/cart/checkout/orders',
    [...PUBLIC_ENV, ...SERVER_ENV],
    localEnv,
  );
  const adminOk = printProfile(
    'Admin CRUD and order management',
    [...PUBLIC_ENV, 'SUPABASE_SERVICE_ROLE_KEY', 'APP_SESSION_SECRET'],
    localEnv,
  );

  const hasFailures = !(storefrontOk && userFlowOk && adminOk);
  if (hasFailures) {
    printSection('Next Step');
    process.stdout.write(
      '- Fill missing variables in .env.local and mirror them in Vercel Project Settings -> Environment Variables.\n',
    );
  }

  if (strict && hasFailures) {
    process.exitCode = 1;
  }
}

main();
