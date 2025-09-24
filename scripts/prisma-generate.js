const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

try {
  if (isProd) {
    // On serverless/CI like Vercel, skip bundling native engines
    run('npx prisma generate --no-engine');
  } else {
    // Local development: generate with engines for the current platform
    run('npx prisma generate');
  }
  console.log('✅ Prisma client generated (' + (isProd ? 'no-engine' : 'with engines') + ')');
} catch (e) {
  console.error('❌ Prisma generate failed:', e?.message || e);
  process.exit(1);
}


