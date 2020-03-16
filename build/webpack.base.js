const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin');
const { getStyleLoaders } = require('./utils');
const pkg = require('../package.json');

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

module.exports = (target) => {
  const isServer = target === 'server'
  const isClient = target === 'client'
  const targets = target === 'server' ? {
    node: pkg.engines.node.match(/(\d+\.?)+/)[0],
  } : {
    browsers: pkg.browserslist,
  }
  return {
    mode: "production",
    devtool: 'source-map', // 生产source-map，开发cheap-module-inline-source-map
    output: {
      publicPath: '/assets/',
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      modules: ['node_modules', 'src'],
      alias: {
        src: path.resolve(__dirname, '../src'),
        pages: path.resolve(__dirname, '../src/pages'),
        components: path.resolve(__dirname, '../src/components'),
      },
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.jsx?$/,
          include: path.resolve(__dirname, '../src'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      useBuiltIns: isClient ? "usage" : undefined,
                      corejs: isClient ? 3 : false,
                      targets: targets,
                    }
                  ],
                  "@babel/preset-react"
                ],
                plugins: [
                  "@loadable/babel-plugin",
                  "@babel/plugin-syntax-dynamic-import",
                  ["import", {
                    libraryName: "antd",
                    // libraryDirectory: "lib", //改成es会有问题
                    style: true // `style: true` 会加载 less 文件
                  }]
                ].filter(Boolean)
              }
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|ico)$/i,
          use: {
            loader: 'url-loader',
            options: {
              name: 'media/[name].[hash:8].[ext]',
              limit: 8192,
              emitFile: isClient,
            },
          },
        },
        {
          test: /\.(eot|ttf|svg|woff)$/i,
          use: {
            loader: 'file-loader',
            options: {
              name: 'media/[name].[hash:8].[ext]',
              emitFile: isClient,
            },
          },
        },
        {
          test: cssRegex,
          exclude: cssModuleRegex,
          use: getStyleLoaders({
            importLoaders: 1,
            sourceMap: false,
          }),
        },
        {
          test: cssModuleRegex,
          use: getStyleLoaders( {
            importLoaders: 1,
            sourceMap: false,
            modules: {
              localIdentName: '[hash:base64]',
            },
          }),
        },

        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: getStyleLoaders(
            {
              importLoaders: 2,
              sourceMap: false,
            },
            'less-loader',
            {
              modifyVars: {
                '@primary-color': '#1890FF',
              },
              javascriptEnabled: true,
            }),
        },
        {
          test: lessModuleRegex,
          use: getStyleLoaders(
            {
              importLoaders: 2,
              sourceMap: false,
              modules: {
                localIdentName: '[hash:base64]',
              },
            },
            'less-loader',
          ),
        }
      ]
    },
    stats: {
      colors: true,
      timings: true,
    },
    plugins: [
      new LoadablePlugin({
        writeToDisk: true,
        filename: `loadable-stats-${target}.json`
      }),

      new MiniCssExtractPlugin({
        filename: isServer ? 'node/static/css/[name].[contenthash:8].css' : 'static/css/[name].[contenthash:8].css',
        chunkFilename: isServer ? 'node/static/css/[name].[contenthash:8].chunk.css' : 'static/css/[name].[contenthash:8].chunk.css',
        // ignoreOrder: true,
      }),
      // new CompressionPlugin()
    ]
  }
}
