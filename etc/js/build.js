
// packages node modules, other vendor js, and custom js using Browserify
// to run:
// $ node build.js

module.exports = {


    // Check if dependencies are installed
    checkDependencies: function () { 
        var checker;
        try {
            checker = require( 'browserify' );
        }
        catch( e ) {
            if ( e.code === 'browserify not found! please npm install -g browserify' ) {
            }
        }

        try {
            checker = require( 'lessc' );
        }
        catch( e ) {
            if ( e.code === 'less not found! please npm install -g less' ) {
            }
        }
    }

    browserify: function(paths, dependencies) {

        var browserify = require('browserify');
        var ractify = require('ractify');
        var fs = require('node-fs');

        var bundle = browserify();

        // Require vendor and custom libraries and make them available outside the bundle.

        dependencies.forEach(function(dependency) {
            if (dependency.expose) { 
                bundle.require(dependency.require, { expose: dependency.expose }); 
            }
            else { 
                bundle.require(dependency.require); 
            }
        });

        // Make .ract templates play nice
        bundle.transform(ractify);

        // Actually make bundle
        bundle
        .bundle({ 
            debug: true,
            entries: [paths.rootpath + 'junk.js'] ,
            // basedir: ['/Users/talia/Projects/moxies/mox/']
        })
        .pipe(fs.createWriteStream(paths.buildpath + '/testbundle.js'));
    }
};


