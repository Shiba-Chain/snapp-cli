/**
 * postinstall.js
 */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const util = require('util');
const gittar = require('gittar');

const shExec = util.promisify(sh.exec);

(async () => {
  await warmNpmCache();
  await warmGittarCache();
})();

/**
 * Warm NPM cache for the dependencies used by our project templates so that
 * `npm i` or `npm ci` can work offline when called by `snapp project <name>`,
 * if user has no internet when they run the project command for the first time.
 */
async function warmNpmCache() {
  console.log('  Warm NPM cache for project template deps.');

  // cwd is the root dir where snapp-cli's package.json is located.
  const tsProj = fs.readFileSync(
    path.join('templates', 'project-ts', 'package.json'),
    'utf8'
  );

  let tsProjDeps = {
    ...JSON.parse(tsProj).dependencies,
    ...JSON.parse(tsProj).devDependencies,
  };

  const allUniqueDeps = { ...tsProjDeps };

  let toCache = [];
  for (const pkgName in allUniqueDeps) {
    toCache.push(`${pkgName}@${allUniqueDeps[pkgName]}`);
  }

  try {
    for await (const pkgWithVersion of toCache) {
      await shExec(`npm cache add ${pkgWithVersion}`);
    }
    console.log('    Done.');
  } catch (err) {
    console.error(err);
  }
}

async function warmGittarCache() {
  console.log('  Warm cache for project template.');

  try {
    const src = 'github:o1-labs/snapp-cli#main';
    await gittar.fetch(src);
  } catch (err) {
    console.error(err);
  }
}
