const {src, dest, task, series, watch, parallel} = require('gulp');
const rm = require('gulp-rm');
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const autoprefixer = require('gulp-autoprefixer');
const px2rem = require('gulp-smile-px2rem');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const babel = require("gulp-babel");
const uglify = require('gulp-uglify');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const gulpif = require('gulp-if');

const env = process.env.NODE_ENV;
const config = require('./gulp.config');

task('clean', () => {
  return src(`${config.DIST_PATH}/**/*`, {read: false}).pipe(rm());
});

task('copy:html', () => {
  return src(`${config.SRC_PATH}/*.html`)
    .pipe(dest(config.DIST_PATH))
    .pipe(reload({stream: true}));
});

task('styles', () => {
  return src(config.SYLES_LIBS, 'src/styles/main.scss')
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(concat('main.min.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(px2rem())
    .pipe(gulpif(env === 'dev', autoprefixer({
			cascade: false
		})))
    .pipe(gulpif(env === 'prod', gcmq()))
    .pipe(gulpif(env === 'prod', cleanCSS({compatibility: 'ie8'})))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(dest(config.DIST_PATH))
    .pipe(reload({stream: true}));

});

task('script', () => {
  return src(config.JS_LIBS, 'src/script/*.js')
  .pipe(gulpif(env === 'dev', sourcemaps.init()))
  .pipe(concat('main.min.js', {newLine: ';'}))
  .pipe(gulpif(env === 'prod', babel({
    presets: ['@babel/preset-env']
  })))
  .pipe(gulpif(env === 'prod', uglify()))
  .pipe(gulpif(env === 'dev', sourcemaps.write()))
  .pipe(dest(config.DIST_PATH))
  .pipe(reload({stream: true}));
});

task('icons', () => {
  return src(`${config.SRC_PATH}/images/icons/*.svg`)
  .pipe(svgo({
    plugins: [
      { 
        removeAttrs: {
          attrs: '(fill|stroke|style|width|data.*)'
        }
      }
    ]
  }))
  .pipe(svgSprite({
    mode: {
      symbol: {
        sprite: '../sprite.svg'
      }
    }
  }))
  .pipe(dest(`${config.DIST_PATH}/images/icons`));
});

task('server', () => {
  browserSync.init({
      server: {
          baseDir: `./${config.DIST_PATH}`
      },
      open: false
  });
});

task('watch', () => {
  watch('./src/styles/**/*.scss', series('styles'));
  watch('./src/*.html', series('copy:html'));
  watch('./src/script/*.js', series('script'));
  watch('./src/images/icons/*.svg', series('icons'));
});

task('default', series('clean', parallel('copy:html','styles', 'script', 'icons'), parallel('watch' ,'server')));

task('build', series('clean', parallel('copy:html','styles', 'script', 'icons')));

