/**
 * compile_html.js
 * Compiles the app/base/template.html to the respective
 * build/<module>/index.html file.
 *
 * To run:
 * $> node etc/js/compile_html.js
 */
'use strict';

var fs = require( 'fs' )
  , mkdirp = require( 'mkdirp' )
  , _ = require( 'underscore' )
  , mustache = require( 'mustache' )
  , colors = require( 'colors' );

// set up paths and config
var scriptPath = __dirname
  , config = JSON.parse(
        fs.readFileSync(
            scriptPath + '/../config.json',
            'utf8'
        ))
  , defaults = JSON.parse(
        fs.readFileSync(
            scriptPath + '/../defaults.json',
            'utf8'
        ))
  , settings = _.extend( defaults, config )
  , templatePath = scriptPath + '/../template.mustache'
  , modulePath = scriptPath + '/' + settings.devPaths.modulePath
  , buildPath = scriptPath + '/' +
        settings.devPaths.buildPath.replace( '/public', '' )
  , modules = _.keys( settings.modules )
  , data = [];

// Clean up the settings JSON a bit
_.each( settings.settings, function ( value, key ) {
    data[ key ] = value.value;
});

var compileHTML = function () {
    var template = '';
    // iterate through modules
    _.each( modules, function ( module ) {
        data.module = module;

        // Create the directory where the rendered HTML will live,
        // if the directory doesn't already exist
        mkdirp( buildPath + module );

        // Set up asset version path
        if ( settings.settings.useAssetVersion.value === 'yes' ) {
            var assetVersion = fs.readFileSync(
                scriptPath + '/../../asset_version',
                'utf8' );
            data.versionPath = assetVersion;
        }
        else {
            data.versionPath = 'public';
        }

        // Check if there's a module template
        if ( fs.existsSync( modulePath + module + '/index.mustache' ) ) {
            // Render the template at that path
            template = fs.readFileSync(
                modulePath + module + '/index.mustache', 'utf-8' );
            console.log( 'Rendering ' + module + ' template' );
        }
        else {
            // Render the default base template
            template = fs.readFileSync( templatePath, 'utf-8' );
            console.log( 'Rendering default template for ' + module );
        }

        template = mustache.render( template, data );
        fs.writeFileSync( buildPath + module + '/index.html', template );
    });

    console.log( 'Success!'.bold.green )
}();