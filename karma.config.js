module.exports = function(config) {
    config.set({
        browsers: ['PhantomJS', 'Chrome'],

        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },
        singleRun: false,
        files: [
            "./bower_components/jquery/dist/jquery.js",
            "./bower_components/bootstrap/dist/js/bootstrap.min.js",
            "./bower_components/undo/undo.js",
            { pattern: 'test-context.js', watched: false }
        ],
        frameworks: ['jasmine'],
        preprocessors: {
            'test-context.js': ['webpack']
        },
        webpack: {
            module: {
                loaders: [
                    { test: /\.js/, exclude: /node_modules/, loader: 'babel-loader' }
                ]
            },
            watch: true
        },
        webpackServer: {
            noInfo: true
        }
    });
};