var gulp = require('gulp'),
    browserify = require('browserify'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    derequire = require('gulp-derequire'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    gulpif = require('gulp-if'),
    notifier = require('../helpers/notifier'),
    config = require('../config').scripts;

gulp.task('scripts', function (cb) {

    var queue = config.bundles.length;

    var buildThis = function (bundle) {

        var pack = browserify({
            entries: bundle.src,
            standalone: bundle.global,
            extensions: config.extensions
        });

        pack.external('jquery');
        pack.external('bootstrap');
        pack.external('undo');

        var build = function () {
            return (
                pack
                    .bundle()
                    .pipe(source(bundle.destFile))
                    .pipe(derequire())
                    .pipe(gulpif(bundle.saveToDist, gulp.dest(bundle.destDistDir)))
                    .pipe(gulpif(bundle.compress, buffer()))
                    .pipe(gulpif(bundle.compress, uglify()))
                    .pipe(gulpif(bundle.compress, rename({suffix: '.min'})))
                    .pipe(header(config.banner))
                    .pipe(gulpif(bundle.saveToDist, gulp.dest(bundle.destDistDir)))
                    .on('end', handleQueue)
            );

        };

        var handleQueue = function () {
            notifier(bundle.destFile);
            if (queue) {
                queue--;
                if (queue === 0) cb();
            }
        };

        return build();
    };
    config.bundles.forEach(buildThis);

});