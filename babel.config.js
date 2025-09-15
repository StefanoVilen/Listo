// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // o plugin do Reanimated **precisa ser o último** da lista
    plugins: ["react-native-reanimated/plugin"],
  };
};
