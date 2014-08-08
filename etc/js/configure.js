/*
 *  configure.js
 *  Copies environment file to config file (must be JSON)
 *
 *  To run:
 *  $> node etc/js/configure.js <profile>
 */

'use strict';

// Set environment based on [current path (user)]

var fs = require( 'fs' )
  , Prompt = require( 'prompt-improved' );

var scriptPath = __dirname
  , envPath = scriptPath + '/../env/';

if ( process.argv.length > 2 ){
    makeConfig( process.argv[2] );

} else {
    var prompt = new Prompt({
        prefix: '[?] ',
        prefixTheme : Prompt.chalk.green,
        textTheme   : Prompt.chalk.bold.green
    } );

    prompt.ask( [ {
        question: 'What is the name of your config file?\n',
        key: 'answer',
        required: true,
        default: 'development',
        boolean: false
    } ],
        function( err, res ) {
        if ( err ) { return console.error( err ); }
        console.log( 'Response: ' + res.answer );
        makeConfig( res.answer + '.json' );
    } );

}

function makeConfig( fileName ) {
    envPath += fileName;

    // Check if profile exists
    if ( fs.existsSync( envPath ) ) {
        console.log( 'Attempting to create config from ' + fileName );
        // Copy the file to config
        fs.createReadStream( envPath )
            .pipe( fs.createWriteStream( scriptPath + '/../config.json' ) );
        console.log( 'Config file created from ' + fileName );
    } else {
        console.log( 'ERROR: Environment file ' + fileName + ' not found' );
    }
}
