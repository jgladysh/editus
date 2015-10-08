var gulp = require('gulp');

gulp.task('build', ['clean', 'lint', 'bower'], function () {
    return gulp.start('bundle');

});

gulp.task('bundle', ['scripts', 'css', 'test-server', 'test', 'kill-test-server'], function () {
    return global.doBeep = true;
});
