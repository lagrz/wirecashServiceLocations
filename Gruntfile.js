/*global module*/

module.exports = function (grunt) {
    'use strict';

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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.registerTask('default', ['jshint', 'connect', 'qunit']);
};
