var gulp = require('gulp');
var shell = require('gulp-shell');

var server = require('../../spec/test-server/server.js');

gulp.task('kill-test-server', ['test'], function (cb) {
    server.StopServer();
    cb();
});

