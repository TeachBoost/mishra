/*
 *  compile_html.js
 *  Compiles the app/base/template.html to the respective
 *  build/<module>/index.html file.
 *
 *  To run:
 *  $> node etc/js/compile_html.js
 */
'use strict';

var fs = require( 'fs' )
  , mkdirp = require( 'mkdirp' )
  , _ = require( 'underscore' )
  , mustache = require( 'mustache' );

var scriptPath = __dirname;

var config = JSON.parse(
        fs.readFileSync( scriptPath + '/../config.json', 'utf8' ) )
  , defaults = JSON.parse(
        fs.readFileSync( scriptPath + '/../defaults.json', 'utf8' ) )
  , settings = _.extend( defaults, config );

var templatePath = scriptPath + '/../template.mustache'
  , modulePath = scriptPath + '/' + settings.devPaths.modulePath
  , buildPath = scriptPath + '/' +
        settings.devPaths.buildPath.replace( '/public', '' );

// NOTE: buildPath is the correct destination for these files?

var modules = _.keys( settings.modules );
var data = {
    'versionPath' : 'build'
};

// Clean up the settings JSON a bit
_.each( settings.settings, function ( value, key ) {
    data[key] = value.value;
});

renderModule();

function renderModule () {
    console.log( '\n\n=====================================================' );
    var template = '';

    _.each( modules, function ( module ) {

        data.module = module;

        // Create the directory where the rendered  HTML will live,
        // if the directory doesn't already exist

        mkdirp( buildPath + module );

        // Set up asset version path if enabled
        if ( settings.settings.useAssetVersion.value === 'yes' ) {
            var assetVersionFile = fs.readFileSync( scriptPath +
                '/../../asset_version', 'utf8' );

            data.versionPath += '/' + assetVersionFile;
        }

        // Check if there's a module template
        if ( fs.existsSync( modulePath + module + '/index.shtml' ) ) {
            // Render the template at that path
            template = fs.readFileSync( modulePath + module +
                '/index.mustache', 'utf-8' );

            console.log( 'Rendering ' + module + ' template' );
        }
        else {
            // Render the default base template
            template = fs.readFileSync( templatePath, 'utf-8' );
            console.log( 'Rendering default template: ' +
                module + ' module has no unique template)' );
        }

        template = mustache.render( template, data );
        fs.writeFileSync( buildPath + module + '/index.html', template );

    });
    console.log( '=====================================================\n\n' );

}
