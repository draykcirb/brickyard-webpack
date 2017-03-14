/* eslint global-require:0 */
const path = require('path')
const webpack = require('webpack')
const autoPrefixer = require('autoprefixer')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

function generate(config) {
    const commonConfig = {
        context: path.resolve(process.cwd(), config.pluginStore),
        output: {
            path: config.outputAssetsPath
        },
        module: {
            loaders: [
                // **********************************
                // special for jquery
                // **********************************
                {
                    test: /jquery$/,
                    loader: 'expose-loader?$!expose-loader?jQuery'
                },

                // babel transpile js
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: `babel-loader?cacheDirectory=${path.resolve('.babel-cache/')}`
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                'window.jQuery': 'jquery'
            }),
            new ProgressBarPlugin(),
            new FriendlyErrorsPlugin(),
            new webpack.LoaderOptionsPlugin({
                postcss: {
                    plugins() {
                        const pluginList = [
                            autoPrefixer({
                                browsers: [
                                    'last 2 versions',
                                    '> 1%',
                                    'not ie <= 8'
                                ],
                                add: true
                            }),
                            require('postcss-normalize-charset')
                        ]

                        if (config.lint) {
                            pluginList.push(
                              require('stylelint')({ /* your options */ }),
                              require('postcss-reporter')({ clearMessages: true })
                            )
                        }

                        return pluginList
                    }
                }
            })
        ],
        resolve: {
            descriptionFiles: ['package.json', '.bower.json'],
            modules: [
                path.resolve(process.cwd(), 'node_modules'),
                path.join(config.outputBase, 'bower_components'),
                path.resolve(process.cwd(), config.pluginStore)
            ]
        }
    }

    if (config.lint) {
        // eslint
        commonConfig.module.rules.unshift({
            test: /\.js$/,
            enforce: 'pre',
            exclude: /(node_modules|bower_components)/,
            loader: 'eslint-loader',
            query: {
                emitError: true,
                emitWarning: false,
                quiet: false,
                failOnWarning: false,
                failOnError: true
            }
        })
    }

    return commonConfig
}

module.exports = generate
