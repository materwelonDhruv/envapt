const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
console.log('Repo root:', repoRoot);

const packages = ['envapt', 'envapt-superimg', 'envapt-nezlephant', 'nezlephant'];

function run(cmd, cwd) {
  console.log('=>', cmd, 'in', cwd);
  const parts = cmd.split(' ');
  const res = spawnSync(parts[0], parts.slice(1), { cwd, stdio: 'inherit', shell: true });
  if (res.status !== 0) throw new Error(`Command failed: ${cmd} (cwd: ${cwd})`);
}

(async () => {
  try {
    console.log('\n== Install dependencies for each package ==');
    for (const p of packages) {
      const dir = path.join(repoRoot, p);
      if (!fs.existsSync(dir)) { console.log('skip', p); continue; }
      run('npm install', dir);
    }

    console.log('\n== Link core packages via file installs ==');
    const envaptDir = path.join(repoRoot, 'envapt');
    for (const consumer of ['envapt-superimg', 'envapt-nezlephant']) {
      const cDir = path.join(repoRoot, consumer);
      if (!fs.existsSync(cDir)) continue;
      run(`npm install --no-save file:${envaptDir}`, cDir);
    }
    const nezDir = path.join(repoRoot, 'nezlephant');
    const envaptNezDir = path.join(repoRoot, 'envapt-nezlephant');
    if (fs.existsSync(envaptNezDir) && fs.existsSync(nezDir)) {
      run(`npm install --no-save file:${nezDir}`, envaptNezDir);
    }

    console.log('\n== Build packages ==');
    for (const p of packages) {
      const dir = path.join(repoRoot, p);
      if (!fs.existsSync(dir)) continue;
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.build) run('npm run build', dir);
        else if (fs.existsSync(path.join(dir, 'tsconfig.json'))) run('npx tsc -p tsconfig.json', dir);
      }
    }

    console.log('\n== Run tests for envapt ==');
    const envaptDir2 = path.join(repoRoot, 'envapt');
    if (fs.existsSync(envaptDir2)) {
      const runTests = fs.existsSync(path.join(envaptDir2, 'scripts', 'run-tests-clean.ps1'))
        ? '.\\scripts\\run-tests-clean.ps1'
        : 'npm test';
      run(runTests, envaptDir2);
    }

    console.log('\nAll done.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
