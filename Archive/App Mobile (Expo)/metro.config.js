const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// `three` ships separate ESM and CJS builds, and its `exports` map sends `import` to
// three.module.js but `require` to three.cjs. Our code `import`s it while React Three Fiber's native
// build `require`s it, so Metro bundled TWO copies - and R3F patches `TextureLoader` (to load through
// expo-asset instead of `document`) only on its own copy, so ours threw "document doesn't exist".
// Pinning every `three` import to one file gives a single instance.
const threeCjs = path.resolve(__dirname, 'node_modules/three/build/three.cjs');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeCjs };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
