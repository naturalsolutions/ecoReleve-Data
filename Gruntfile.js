module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
            options: {
                nospawn: true,
                livereload: true
            },
            jst: {
                files: [
                    'app/templates/**/*.ejs'
                ],
                tasks: ['jst']
            },
            
            css: {
                files: 'app/styles/**/*.less',
                tasks: ['less']
            },                                          
			livereload: {
                files: [
                    '*.html',
                    'app/styles/{,*/}*.css',
                    'app/scripts/{,*/}*.js',
                ]
            }
        },		
        clean: {
            dist: ['build'],
        },   
        jshint: {
            all: [
                'Gruntfile.js',
                'app/**/*.js',
                'app/modules/**/*.js',
            ]
        },                 
		requirejs: {
            compile: {
                options: {
                    baseUrl: "app",
                    mainConfigFile: "app/main.js",
                    include: "main",
                    name: "../bower_components/almond/almond",
                    out: "build/prod.js"
                }
            } 
        },
        less: {
            dist: {
                files: {
                    'app/styles/main.css' : 'app/styles/main.less'
                }
            }
        },      
        
        jst: {
            compile: {
                files: {
                    'build/templates.js': ['app/templates/**/*.ejs']
                }
            }
        },
        jasmine: {
            all:{
                src : 'app/modules/{,*/}*.js',
                options: {
                    keepRunner: true,
                    specs : 'test/**/*.js',
                    vendor : [
                        'bower_components/jquery/dist/jquery.js',
                        'bower_components/lodash/dist/lodash.js',
                        'bower_components/backbone/backbone.js',
                        'bower_components/marionette/lib/core/backbone.marionette.js',
                        'bower_components/backbone.babysitter/lib/backbone.babysitter.js',
                        'bower_components/backbone.wreqr/lib/backbone.wreqr.js',
                        'bower_components/bootstrap/dist/js/bootstrap.js',      
                    ]
                }
            }
        }, 
        cssmin: {
            dist: {
                files: {
                    'app/styles/main.css': [
                        'build/styles/{,*/}*.css',
                        'app/styles/{,*/}*.css'
                    ]
                }
            }
        },  
        fileblocks: {  
            options: {
                templates: {
                    'js': '<script data-main="app/main" src="${file}"></script>',
                },
                removeFiles : true
            },                    
            prod: {
                src: 'index.html',
                blocks: {
                    'app': { src: 'build/prod.js' }
                }
            },
            develop: {
                src: 'index.html',
                blocks: {
                    'app': { src: 'bower_components/requirejs/require.js' }
                }
            },             
        },
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');	
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-file-blocks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
	
    grunt.registerTask('build', [
        'jshint',
        'clean:dist',
        'jst',
        'less',
        'requirejs',
        'cssmin',
        'jasmine',
    ]);

    grunt.registerTask('develop', ['build', 'fileblocks:develop', 'watch']);

    grunt.registerTask('release', ['build', 'fileblocks:prod']);
};