/**
 * configure.js
 * Copies environment file to config file (must be JSON)
 *
 * To run:
 * $> node etc/js/configure.js <profile>
 */
'use strict';

var fs = require( 'fs' )
  , prompt = require( 'prompt' )
  , colors = require( 'colors' )
var scriptPath = __dirname
  , envPath = scriptPath + '/../env/';

// configure the prompt
prompt.message = '';
prompt.delimiter = '';

if ( process.argv.length > 2 ) {
    makeConfig( process.argv[ 2 ] );
}
else {
    // define prompt questions
    var schema = {
        properties: {
            environment: {
                description: "[?] What is the name of your environment?".green,
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Environment must be only letters, spaces, or dashes',
                required: true,
                default: 'development'
            }
        }
    };

    // start the prompt
    prompt.start();
    prompt.get( schema, function ( err, result ) {
        if ( err ) {
            return console.error( err );
        }
        makeConfig( result.environment );
    });
}

/**
 * Creates the configuration file for the environment
 */
function makeConfig( environment ) {
    var configFile = envPath + environment + '.json';

    // Check if profile exists
    if ( fs.existsSync( configFile ) ) {
        console.log( 'Attempting to create config at ' + configFile );
        // Copy the file to config
        fs.createReadStream( configFile )
            .pipe(
                fs.createWriteStream(
                    scriptPath + '/../config.json'
                ));
        console.log( 'Success!'.bold.green );
        return true;
    }
    else {
        console.log( ('ERROR: Environment file ' + configFile + ' not found!').blackBG.red.bold );
        return false;
    }
}