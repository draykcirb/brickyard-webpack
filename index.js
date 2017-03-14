/* eslint global-require:0, import/no-extraneous-dependencies:0, import/no-unresolved:0 */
const path = require('path')
const _ = require('lodash')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const butil = require('brickyard3/lib/util')
const glob = require('glob')
const webpackMerge = require('webpack-merge')

const commonPreset = require('./preset/common')

let ExtractTextPlugin = null
const smartMerge = webpackMerge.smartStrategy({
    'module.rules.loaders': 'prepend',
    'module.rules.use': 'prepend',
    'module.loaders.loaders': 'prepend'
})

try {
    ExtractTextPlugin = require('extract-text-webpack-plugin')
} catch (e) {
    // nothing
}

module.exports = {
    factories: [],
    configs: [],
    registerFactory(factory) {
        if (_.isFunction(factory)) {
            this.factories.push(factory)
        }
    },
    makeConfig(runtime) {
        // config collecting
        const commonWebpackConfig = commonPreset(runtime.config)

        this.configs.push(commonWebpackConfig)

        this.factories.forEach((factory) => {
            this.configs.push(factory(runtime.config, commonWebpackConfig))
        })

        let targetWebpackConfig = smartMerge(...this.configs)

        this.configs.length = 0

        this.configs.push(...this.retrievePluginConfig(runtime, targetWebpackConfig))

        targetWebpackConfig = smartMerge(targetWebpackConfig, ...this.configs)

        targetWebpackConfig.plugins.push(
            defineGlobalVars(runtime.config, targetWebpackConfig.debug),
            ...createEntries(runtime.plugins)
        )

        moveETP2End(targetWebpackConfig)

        return targetWebpackConfig
    },
    retrievePluginConfig(runtime, commonWebpackConfig) {
        const pattern = butil.getFileGlobPattern('', _.map(runtime.plugins, 'raw.path'), 'webpack.config.js')

        return _.chain(glob.sync(pattern))
            .map((_path) => {
                const pluginConf = require(_path)

                return _.isFunction(pluginConf) ? pluginConf(runtime.config, commonWebpackConfig) : pluginConf
            })
            .value()
    }
}

/**
 * mutate. The etps should behind CommonsChunkPlugin
 * @param config
 */
function moveETP2End(config) {
    if (!ExtractTextPlugin) return

    const etps = config.plugins.filter(val => val instanceof ExtractTextPlugin)

    _.chain(config.plugins)
        .pullAll(etps)
        .push(...etps)
        .value()
}

// ==========================================================

/**
 * create html entries based on each plugin's declaration
 * @param {Array} plugins
 * @returns {Array}
 */
function createEntries(plugins) {
    return _.chain(plugins)
        .map(function (plugin) {
            let entry = _.get(plugin, 'raw.plugin.entry')

            if (!Array.isArray(entry)) {
                entry = [entry]
            }

            return entry.reduce(function (result, value) {
                if (value) {
                    result.push(createEntry(path.join(plugin.path, value)))
                }
                return result
            }, [])
        })
        .flatten()
        .compact()
        .value()
}

/**
 * create the html entry file with target template file, using HtmlWebpackPlugin
 * @param _path
 */
function createEntry(_path) {
    return new HtmlWebpackPlugin({
        filename: 'index.html',
        template: _path,
        chunksSortMode: 'dependency'
    })
}

/**
 * define globals variables for injecting them into source scope
 * @param runtimeConfig
 * @param isDebug
 * @returns {object}
 */
function defineGlobalVars(runtimeConfig, isDebug) {
    const globals = Object.assign({}, runtimeConfig.globals, {
        APP_DEBUG_MODE: isDebug || !!runtimeConfig.debuggable
    })

    return new webpack.DefinePlugin(globals)
}
