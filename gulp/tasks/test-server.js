var gulp = require('gulp');
var shell = require('gulp-shell');

var server = require('../../spec/test-server/server.js');

gulp.task('test-server', function () {
    return server.StartServer();
});

