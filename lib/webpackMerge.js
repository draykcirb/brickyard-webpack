/* modified from https://github.com/survivejs/webpack-merge */

const isArray = Array.isArray;
const isPlainObject = require('lodash').isPlainObject;
const merge = require('lodash').mergeWith;
const isEqual = require('lodash').isEqual;
const omit = require('lodash').omit;

const loaderNameRegExp = /^([^?]+)/ig;

function mergeLoaders(currentLoaders, newLoaders) {
    return newLoaders.reduce((mergedLoaders, loader) => {
        if (mergedLoaders.every(l => loader.match(loaderNameRegExp)[0] !== l.match(loaderNameRegExp)[0])) {
            mergedLoaders.push(loader);
        }
        return mergedLoaders;
    }, currentLoaders);
}

/**
 * Check equality of two values using lodash's isEqual
 * Arrays need to be sorted for equality checking
 * but clone them first so as not to disrupt the sort order in tests
 */
function isSameValue(a, b) {
    const [propA, propB] = [a, b].map(function (value) {
        return isArray(value) ? value.slice().sort() : value;
    });

    return isEqual(propA, propB);
}

function reduceLoaders(mergedLoaderConfigs, newConfig) {
    const existingConfig = mergedLoaderConfigs.find(loader => String(loader.test) === String(newConfig.test));

    if (existingConfig) {
        /**
         * When both loaders have different `include` or `exclude`
         * properties, concat them
         */
        if ((newConfig.include && !isSameValue(existingConfig.include, newConfig.include)) ||
          (newConfig.exclude && !isSameValue(existingConfig.exclude, newConfig.exclude))) {
            mergedLoaderConfigs.push(newConfig);
            return mergedLoaderConfigs
        }

        if (newConfig.loaders) {
            const existingLoaders = existingConfig.loader ? [existingConfig.loader] : existingConfig.loaders || [];

            existingConfig.loaders = mergeLoaders(newConfig.loaders, existingLoaders);
            delete existingConfig.loader
        }

        if (newConfig.loader) {
            if (existingConfig.loader) existingConfig.loader = newConfig.loader

            if (existingConfig.loaders) {
                existingConfig.loaders = mergeLoaders([newConfig.loader], existingConfig.loaders);
            }
        }

        Object.assign(existingConfig, omit(newConfig, 'test', 'loaders', 'loader'))

        return mergedLoaderConfigs;
    }

    mergedLoaderConfigs.push(newConfig)

    return mergedLoaderConfigs;
}

function joinArrays(customizer, a, b, key) {
    if (isArray(a) && isArray(b)) {
        const customResult = customizer(a, b, key);

        if (!b.length) {
            return [];
        }

        if (customResult) {
            return customResult;
        }

        return a.concat(b);
    }

    if (isPlainObject(a) && isPlainObject(b)) {
        if (!Object.keys(b).length) {
            return {};
        }

        return merge({}, a, b, joinArrays.bind(null, customizer));
    }

    return b;
}

module.exports = function mergeConfig(...args) {
    return merge({}, ...args, joinArrays.bind(null, () => {
    }));
};

module.exports.smart = function webpackMerge(...args) {
    return merge({}, ...args, joinArrays.bind(null, function (a, b, key) {
        if (isLoader(key)) {
            return b.reduce(reduceLoaders, a.slice());
        }
    }));
};

function isLoader(key) {
    return ['loaders', 'preLoaders', 'postLoaders'].indexOf(key) >= 0;
}
