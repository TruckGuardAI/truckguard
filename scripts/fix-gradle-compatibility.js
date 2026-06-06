#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REACT_NATIVE_GRADLE_PLUGIN_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

const ORIGINAL_VERSION = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }';
const FIXED_VERSION = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }';

function fixFoojayResolverVersion() {
  try {
    if (!fs.existsSync(REACT_NATIVE_GRADLE_PLUGIN_PATH)) {
      console.log('❌ React Native Gradle Plugin settings file not found');
      return false;
    }

    let content = fs.readFileSync(REACT_NATIVE_GRADLE_PLUGIN_PATH, 'utf8');
    
    if (content.includes('version("0.5.0")')) {
      content = content.replace(ORIGINAL_VERSION, FIXED_VERSION);
      fs.writeFileSync(REACT_NATIVE_GRADLE_PLUGIN_PATH, content, 'utf8');
      console.log('✅ Fixed foojay-resolver-convention version from 0.5.0 to 1.0.0');
      return true;
    } else if (content.includes('version("1.0.0")')) {
      console.log('✅ foojay-resolver-convention already fixed (version 1.0.0)');
      return true;
    } else {
      console.log('⚠️  Unexpected foojay-resolver-convention version found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fixing foojay-resolver-convention:', error.message);
    return false;
  }
}

if (require.main === module) {
  console.log('🔧 Fixing Gradle compatibility issues...');
  const success = fixFoojayResolverVersion();
  process.exit(success ? 0 : 1);
}

module.exports = { fixFoojayResolverVersion };