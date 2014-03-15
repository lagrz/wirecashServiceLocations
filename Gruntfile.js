'use strict';
module.exports = function (grunt) {


    grunt.initConfig({
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
                    port: 8000,
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('test', ['connect', 'qunit']);

};
