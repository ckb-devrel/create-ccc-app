const validateProjectName = require('validate-npm-package-name');
const fs = require('fs-extra');
const spawn = require('cross-spawn');

function validateNpmName(name) {
  const nameValidation = validateProjectName(name)
  if (nameValidation.validForNewPackages) {
    return { valid: true }
  }

  return {
    valid: false,
    problems: [
      ...(nameValidation.errors || []),
      ...(nameValidation.warnings || []),
    ],
  }
}

function getPkgManager() {
  const userAgent = process.env.npm_config_user_agent || ''

  if (userAgent.startsWith('yarn')) {
    return 'yarn'
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm'
  }

  if (userAgent.startsWith('bun')) {
    return 'bun'
  }

  return 'npm'
}

function isFolderEmpty(folderPath) {
  const files = fs.readdirSync(folderPath);
  return files.length === 0;
}


/**
 * Spawn a package manager installation based on user preference.
 *
 * @returns A Promise that resolves once the installation is finished.
 */
async function install(
  /** Indicate which package manager to use. */
  packageManager,
) {
  const args = ['install']
  
  /**
   * Return a Promise that resolves once the installation is finished.
   */
  return new Promise((resolve, reject) => {
    /**
     * Spawn the installation process.
     */
    const child = spawn(packageManager, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ADBLOCK: '1',
        // we set NODE_ENV to development as pnpm skips dev
        // dependencies when production
        NODE_ENV: 'development',
        DISABLE_OPENCOLLECTIVE: '1',
      },
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject({ command: `${packageManager} ${args.join(' ')}` })
        return
      }
      resolve()
    })
  })
}

module.exports = { validateNpmName, getPkgManager, isFolderEmpty, install };