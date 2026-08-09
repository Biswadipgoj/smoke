// metro.config.js
//
// The one non-default bit: expo-sqlite ships a WebAssembly build for web, and
// Metro has to be told that .wasm is an asset or the web bundle can't resolve
// it. Native builds don't need this, but leaving web broken while app.json
// declares a web target would be a trap for whoever runs `expo export` next.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
