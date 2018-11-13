//
// Main build file
//
const browsersync = require('browser-sync').create();
const del = require('del');
const gulp = require('gulp');
const merge = require('merge-stream');
const plumber = require('gulp-plumber');
const webpack = require('webpack');
const webpackstream = require('webpack-stream');
const webpackconfig = require('./webpack.config.js');

// For build metadata (specs, coverage, linting)
const buildDir = 'build';

// For runtime outputs (copies of all served documents, code, resources)
const distDir = 'dist';

function clean() {
    return del(['dist', 'build']);
}

function copy() {
    let html = gulp.src(['html/*.html']).pipe(gulp.dest(distDir));
    let css = gulp.src(['css/*.css']).pipe(gulp.dest(distDir + '/css'));
    let resources = gulp.src(['resources/*']).pipe(gulp.dest(distDir + '/resources'));
    return merge(html, css, resources);
}

function javascript() {
    return gulp.src(['./js/**/*'])
               .pipe(plumber())
               .pipe(webpackstream(webpackconfig), webpack)
               //.pipe(uglify())
               .pipe(gulp.dest(distDir + '/js'))
               .pipe(browsersync.stream());
}


exports.clean = clean;
exports.build = gulp.series(copy, javascript);
exports.default = gulp.series(clean, exports.build);