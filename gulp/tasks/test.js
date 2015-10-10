var gulp = require('gulp');
var Server = require('karma').Server;
var isTravis = process.env.TRAVIS || false;

/**
 * Run test once and exit
 */
gulp.task('test', function (cb) {
    var server = new Server({
        configFile: __dirname + '/../../karma.config.js',
        singleRun: isTravis
    });
    server.start();
    server.on("browser_complete", function () {
        console.log('testing completed');
        cb();
    });
});