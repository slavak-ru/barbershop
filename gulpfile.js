/*
* First attemp the automatic buildig of the project
* Next targets:
* gulpfile decomposition to the task-jsfiles with lazy style (https://www.youtube.com/watch?v=Qc6go3cNuRk&index=12&list=PLDyvV36pndZFLTE13V4qNWTZbeipNhCgQ)
* use PostCss with Stylus and others inside the PostCss (mybee) 
* use in public minification and rename css file
*/
"use strict";

// plugins connections
const gulp = require("gulp");
const sass = require("gulp-sass");
const postcss = require('gulp-postcss');
//    concat = require("gulp-concat");
const debug = require("gulp-debug");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const newer = require("gulp-newer");
const notify = require("gulp-notify");
const plumber = require("gulp-plumber"); // Prevent pipe breaking caused by errors from gulp plugins
const autoprefixer = require('autoprefixer');
const imagemin = require("gulp-imagemin"); //Minify PNG, JPEG, GIF and SVG images
const svgstore = require("gulp-svgstore"); // Combine svg files into one with <symbol> elements.
const svgmin = require("gulp-svgmin"); // Minify SVG
const minify = require("gulp-csso"); // Minify CSS
const rename = require("gulp-rename"); // plugin to rename files easily
const mqpacker = require("css-mqpacker"); // Pack same CSS media query rules into one using PostCSS
const browserSync = require('browser-sync').create();
const gulpif = require('gulp-if'); // gulp-if
const argv = require('yargs').argv; // build interactive command line tools, by parsing arguments and generating an elegant user interface
    
// test task
gulp.task("test", function() {
        return console.log('HELLO WORLD');
    }
);

// clean production folder
gulp.task("clean", function () {
    return del("production/**");
});

// sass
gulp.task("sass", function () {

    return gulp.src("develop/sass/style.scss", {base: "develop/sass"})
//      return gulp.src("develop/**/*.scss")
        .pipe(plumber({
            errorHandler: notify.onError(function(err){
                return {
                    title: "Sass",
                    message: err.message
                };
            })
        }))
        .pipe(gulpif(argv.dev, sourcemaps.init()))
        .pipe(gulpif(argv.dev, debug({title: "src"})))
//        .pipe(sourcemaps.init())
//        .pipe(debug({title: "src"}))
        .pipe(sass())
        .pipe(debug({title: "sass"}))
//        .pipe(concat("style.css"))
//        .pipe(debug({title: "concat"}))
        .pipe(postcss([
            autoprefixer({browsers: [
                "last 2 versions"
            ]}),
            mqpacker({
                sort: true
            })
        ]))
        .pipe(debug({title: "autoprefixer"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("production/css"))
        .pipe(gulpif(argv.production, minify()))
        .pipe(gulpif(argv.production, debug({title: "minify"})))
//        .pipe(gulpif(argv.production,rename("style.min.css")))
//        .pipe(gulpif(argv.production, debug({title: "rename"})))
        .pipe(gulp.dest("production/css"));

});

gulp.task("symbols", function() {
    return gulp.src("develop/img/icons/**/*.svg", {base: "develop"}, {since: gulp.lastRun("symbols")})
//        .pipe(svgmin())
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("symbols.svg"))
        .pipe(gulp.dest("production/img"))
        .pipe(debug({title: "symbols"}));
});

gulp.task("images", function() {
    return gulp.src(["develop/img/**/*.{png,jpg,gif}", "develop/img/*.svg"], {base: "develop"}, {since: gulp.lastRun("images")})
        // .pipe(imagemin([
        //     imagemin.optipng({optimizationLevel: 3}),
        //     imagemin.jpegtran({progressive: true})
        // ]))
        .pipe(gulp.dest("production"))
        .pipe(debug({title: "images"}));
});

gulp.task("assets", function () {
        
    return gulp.src(["develop/*.html", "develop/fonts/**/*.{woff2,woff}", "develop/js/**", "develop/pages/**"], {base: "develop"}, {since: gulp.lastRun("assets")})
        .pipe(newer("production"))
        .pipe(gulp.dest("production"))
        .pipe(debug({title: "assets"}));

});

gulp.task("favic", function () {
        
    return gulp.src("develop/img/favic/*.*")
        .pipe(newer("production"))
        .pipe(gulp.dest("production"))
        .pipe(debug({title: "favic"}));

});

gulp.task("build", gulp.series("clean", gulp.parallel("sass", "symbols", "images", "assets", "favic"))); // gulp.series работает только в gulp4. clean - почему-то выполнтся последним


gulp.task("watch", function () {
    gulp.watch("develop/sass/**/*.*", gulp.series("sass"));
    gulp.watch("develop/img/**/*.*", gulp.series("images", "symbols"));
    gulp.watch(["develop/*.html", "develop/fonts/**", "develop/img/**", "develop/js/**", "develop/pages/**"], gulp.series("assets"));
});


// Static server
gulp.task("serve", function () {
     browserSync.init({
         server: "production"
     });

     browserSync.watch("production/**/*.*").on("change", browserSync.reload);
});


gulp.task("default", gulp.series("build", gulp.parallel("watch", "serve")));

// gulp.task("dev", gulp.series("build", gulp.parallel("watch"))
// );