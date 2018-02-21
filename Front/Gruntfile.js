 module.exports = function(grunt) {
   grunt.initConfig({

     /*==========  Watch Tasks  ==========*/
     watch: {
       options: {
         nospawn: true,
         livereload: true
       },
       configFiles: {
         files: ['Gruntfile.js'],
         options: {
           reload: true
         }
       },
       jst: {
         files: [
         'app/**/*.html'
         ],
         tasks: ['jst']
       },
       css: {
         files: 'app/styles/**/*.less',
         tasks: ['less']
       },
       livereload: {
         files: [
         'build/*.js',
         'app/styles/**/*.css',
         'app/**/*.js',
         ]
       }
     },
     less: {
       dist: {
         files: {
           'app/styles/main.css': 'app/styles/main.less'
         },
         options: {
           compress: false,
           sourceMap: true,
           sourceMapFilename: 'app/styles/main.css.map',
           sourceMapURL: 'main.css.map'
         }
       }
     },
     autoprefixer: {
       dist: {
         files: {
           'app/styles/main.css': 'app/styles/main.css'
         }
       }
     },
     jst: {
       compile: {
         files: {
           'build/templates.js': ['app/**/*.html']
         }
       }
     },
     requirejs: {
         options: {
            optimize: 'none',
            baseUrl: 'app',
            mainConfigFile: 'app/main.js',
            include: 'main',
            out: 'build/prod.js',
            name: '../bower_components/requirejs/require',
            generateSourceMaps: true,
            preserveLicenseComments: false
         },
         dev: {
             options: {
                 build: false
             }
         },
         prod: {
             options: {
                 build: true
             }
         }
     },

     /*==========  Build Tasks  ==========*/
     clean: {
       dist: ['build'],
     },
     jshint: {
       all: [
       'Gruntfile.js',
       'app/**/*.js',
       ]
     },
     fileblocks: {
       options: {
         templates: {
           'js': '<script data-main="app/main" src="${file}"></script>',
         },
         removeFiles: true
       },
       prod: {
         src: 'index.html',
         blocks: {
           'app': {src: 'build/prod.js'}
         }
       },
       develop: {
         src: 'index.html',
         blocks: {
           'app': {src: 'bower_components/requirejs/require.js'}
         }
       },
     },

     cachebreaker: {
         prod: {
             options: {
                 match: ['build/prod.js'],
             },
             files: {
                 src: ['index.html']
             }
         },
     },

   });

   /*==========  Loaded Tasks  ==========*/

   grunt.loadNpmTasks('grunt-contrib-requirejs');

   grunt.loadNpmTasks('grunt-contrib-watch');

   grunt.loadNpmTasks('grunt-contrib-jst');

   grunt.loadNpmTasks('grunt-contrib-clean');

   grunt.loadNpmTasks('grunt-contrib-less');

   grunt.loadNpmTasks('grunt-contrib-jshint');

   grunt.loadNpmTasks('grunt-file-blocks');

   grunt.loadNpmTasks('grunt-cache-breaker');

   grunt.loadNpmTasks('grunt-contrib-uglify');

   /*==========  Regitred Tasks  ==========*/

   grunt.registerTask('build', [
   //'jshint',
   'clean:dist',
   'jst',
   'less',
   'requirejs:prod'
   ]);

   grunt.registerTask('dev', ['build', 'fileblocks:develop']);

   grunt.registerTask('release', ['build', 'fileblocks:prod', 'cachebreaker:prod']);
 };
