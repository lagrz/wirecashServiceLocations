/*global module*/

module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        buildFile: 'wcServiceLocations',
        qunit: {
            all: {
                options: {
                    urls: [
                        'http://localhost:8000/test/index.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    hostname: '*',
                    base: '.'
                }
            }
        },
        jshint: {
            src: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: ['js/**/*.js']
            }
        },
        concat: {
            options: {
                separator: '\r\n\r\n'
            },
            js: {
                files: {
                    'build/<%=buildFile%>.js': [
                        'js/wcTemplate.js',
                        'js/wcGMapsAPILoader.js',
                        'js/wcGMaps.js',
                        'js/wcPaginator.js',
                        'js/wcServiceLocation.js',
                        'js/wcServiceLocationsView.js'
                    ]
                }
            },
            angular: {
                files:{
                    'build/ngLocations.js': [
                        'js/wcTemplate.js',
                        'js/wcGMapsAPILoader.js',
                        'js/wcGMaps.js',
                        'js/wcPaginator.js',
                        'js/wcServiceLocation.js',
                        'js/wcServiceLocationsView.js',
                        'js/wcTemplates.js',
                        'js/ngLocations.js'
                    ]
                }
            }
        },
        uglify: {
            options: {
                sourceMap: false,
                preserveComments: false,
                mangle: false,
                report: 'min'
            },
            dist: {
                files: {
                    'build/<%=buildFile%>.min.js': ['build/<%=buildFile%>.js']
                }
            }
        },
        jsdoc : {
            dist : {
                src: ['js/*.js', 'DOC.md'],
                options: {
                    destination: 'doc/dist',
                    configure: 'doc/jaguarjs-jsdoc-master/conf.json',
                    template: 'doc/jaguarjs-jsdoc-master',
                    'private': false
                }
            }
        },
        handlebars: {
            compile: {
                options: {
                    namespace: 'WC.locationsTPL',
                    processName: function(filePath){
                        return filePath.split('/')[1].replace('.hbs','');
                    }
                },
                files: {
                    'js/wcTemplates.js': ['templates/*.hbs']
                }
            }
        }
    });

    [
        'grunt-contrib-qunit',
        'grunt-contrib-jshint',
        'grunt-contrib-connect',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-jsdoc',
        'grunt-contrib-handlebars'
    ].forEach(
        function (task) {
            grunt.loadNpmTasks(task);
        });

    grunt.registerTask('build', ['concat', 'uglify']);

    grunt.registerTask('default', ['jshint', 'connect', 'qunit']);

    grunt.registerTask('angular', ['handlebars', 'concat']);
};
