//
// Main build file
//
// references: https://travismaynard.com/writing/getting-started-with-gulp
//             https://github.com/greypants/gulp-starter/wiki/What-is-Browserify%3F
//             https://github.com/sindresorhus/del
//             http://stackoverflow.com/questions/21224252/looking-for-way-to-copy-files-in-gulp-and-rename-based-on-parent-directory
//

var gulp = require('gulp');
var del = require('del');
var deamdify = require('deamdify');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var stylus = require('gulp-stylus');
//var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');

// For build metadata (specs, coverage, linting)
var buildDir = 'build';

// For runtime outputs (copies of all served documents, code, resources)
var distDir = 'dist';

// Default task
//gulp.task('default', ['clean', 'check', 'sass', 'stylus', 'copy', 'browserify']);
gulp.task('default', ['build']);
gulp.task('watch', ['default', 'watchkchanges']);

// Clean
gulp.task('clean', function(cb) {
    del(['dist', 'build'], cb);
});

// Static analysis
gulp.task('check', ['clean'], function() {
    return gulp.src('js/*.js;')
               .pipe(jshint())
               .pipe(jshint.reporter('default'));

});

// Sass -> CSS transform & copy
gulp.task('sass', ['clean'], function() {
    return gulp.src('css/*.sass')
               .pipe(sass())
               .pipe(gulp.dest(destDir + '/css'));
});

// Stylus -> CSS transform & copy
gulp.task('stylus', ['clean'], function() {
    return gulp.src('css/*.styl')
               .pipe(stylus())
               .pipe(gulp.dest(destDir + '/css'));
});

// Copy over all runtime files to the distribution / staging area
gulp.task('copy', ['clean'], function() {
    gulp.src(['html/*.html'])
        .pipe(gulp.dest(distDir));
    gulp.src(['css/*.css'])
        .pipe(gulp.dest(distDir + '/css'));
    gulp.src(['resources/*'])
        .pipe(gulp.dest(distDir + '/resources'));
});

// Browserify
gulp.task('browserify', ['check'], function() {
    return browserify({entries: 'js/main.js',
                       transform: 'deamdify',
                       debug: true})         // Required to get useful source maps
           .bundle()                         // vinyl makes the bundle compatible with gulp
        .pipe(source('app.js'))              // destination name
        .pipe(buffer())                      // vinyl-buffer streams to allow source maps to function
        .pipe(sourcemaps.init({loadMaps: true}))
//        .pipe(uglify())
        .pipe(sourcemaps.write('./'))        // output sourcemaps to same directory for debugging
        .pipe(gulp.dest(distDir + '/js'))    // output results
});

gulp.task('build', ['copy', 'browserify']);

// Watch files for changes
gulp.task('watch-changes', function() {
    gulp.watch('js/*.js', ['check', 'browserify']);
    gulp.watch('css/*.sass', ['sass']);
    gulp.watch('css/*.styl', ['stylus']);
    gulp.watch('css/*.css', ['copy']);
    gulp.watch('html/*.html', ['copy']);
});
