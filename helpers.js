const validateProjectName = require('validate-npm-package-name');
const fs = require('fs-extra');

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

module.exports = { validateNpmName, getPkgManager, isFolderEmpty};