const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const Dotenv = require("dotenv-webpack");

const isDevServer = process.argv.includes("serve");
console.log("Is dev server", isDevServer);

const plugins = [
  new HtmlWebpackPlugin({
    filename: isDevServer ? "index.html" : "../docs/index.html",
    template: "src/index.html",
  }),
  new CopyPlugin({
    patterns: [{ from: "src/assets", to: "" }],
  }),
  new Dotenv({
    path: "./variables.env",
  }),
  // new BundleAnalyzerPlugin(),
];

// Only use the service worker in production
if (!isDevServer) {
  plugins.push(new GenerateSW({ maximumFileSizeToCacheInBytes: 50000000 })); // 50MB
}

module.exports = {
  mode: "production",
  devtool: isDevServer ? "eval-source-map" : "source-map",
  output: {
    path: isDevServer
      ? path.resolve(__dirname, "dev")
      : path.resolve(__dirname, "docs"), // Because this is where github pages likes it
    filename: "bundle.js",
  },
  plugins,
  devServer: {
    port: 3030,
    devMiddleware: {
      writeToDisk: true,
    },
    server: {
      //type: "https",
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // .js and .jsx files
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-typescript"],
          },
        },
        exclude: /node_modules\/(?!ts-whammy)/,
      },
      {
        test: /\.(sa|sc|c)ss$/, // styles files
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
      {
        test: /\.worker\.ts$/,
        use: { loader: "worker-loader" },
      },
    ],
  },
};
