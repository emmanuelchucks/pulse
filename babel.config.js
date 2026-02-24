/** @param {import("@babel/core").ConfigAPI} api */
export default function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [["inline-import", { extensions: [".sql"] }]],
  };
}
