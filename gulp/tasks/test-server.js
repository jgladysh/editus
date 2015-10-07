var gulp = require('gulp');
var shell = require('gulp-shell');

gulp.task('test-server', shell.task([
    'npm install',
    'node bin/www'
],{cwd:'spec/test-server/'}));