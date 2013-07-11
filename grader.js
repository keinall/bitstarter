#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var verbose = false; /* Enable for more fun with aysnc programming */
if (verbose) console.log("Verbose mode enabled (easier debugging).");

var fs = require('fs');
// now, restler stuff so we can pull URLs
var util = require('util');
var rest = require('restler');/* "Hi, I'm asynchronous, but shhhhh!" */

var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
//var URL_DEFAULT = "http://whispering-badlands-6738.herokuapp.com/"; 
var URL_DEFAULT = "none" ; // special market to avoid dowloading
//var DL_LOCATION = "~/bitstarter/testme.html"; // local copy of URL
var DL_LOCATION = "testme.html"; // full path might have been trouble

var assertFileExists = function(infile) {

    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLWorks = function(givenurl) {
/*
** TODO: actually check the URL, maybe, lol.
*/
   
    if ( givenurl == null ) {
	return "none"; // do nothing, unless we really have a URL
    } else {
	return givenurl;
    };
};

var downloadURL = function(givenurl, checksfile) {
    if (verbose) console.log("Attempting to download from URL: " + givenurl);

    rest.get(givenurl).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error retrieving URL:' + result.message);
	    process.exit(1);
	} else {
	    fs.writeFile(DL_LOCATION, result, function(err) {
		if (err) throw err;
		else {
		    if (verbose) console.log("Read url from %s to %s okay.", givenurl, DL_LOCATION);
		  // do rest of processing here 
		    display_results( checkHtmlFile( DL_LOCATION, checksfile ) );
		 };
	    });
	}
    });
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    if (verbose) console.log("Checking %s vs. %s.", htmlfile, checksfile);

    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }

    if (verbose) {
		console.log("Checking complete, returning results.");
//	console.log("Results are:" + out.length + " long.");
		var nProp = 0;
		for (var prop in out) {
			nProp ++;
			}
		console.log("Found " + nProp + " properties in output object.");
	};

    return out;
};

var checkURL = function(givenurl, checksfile) { 
    if (verbose) console.log("Downloading from " + givenurl);
    return downloadURL( givenurl , checksfile );

    console.error("Fall-thru in checkURL.");
    process.exit(1);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};



if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_link>', 'URL to live index.html', clone(assertURLWorks), URL_DEFAULT)
        .parse(process.argv);
    if ( program.url == URL_DEFAULT ) {
	if (verbose) console.log("No URL given so testing a local file.");
	var checkJson = checkHtmlFile(program.file, program.checks);
	display_results(checkJson);
//	var outJson = JSON.stringify(checkJson, null, 4);
//	console.log(outJson);
    } else {
	if (verbose) console.log("Attempting to test a URL.");
	    checkURL(program.url, program.checks);
	if (verbose) console.log("checkURL() has just returned (main stream only, latent co-routine still in effect).");
    };

    if (verbose) console.log("Done.");
   
} else { /* allows functions to be called from a library rather than commnand line */
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkURL = checkURL; // NOTE: spawns a latent bknd co-routine, or something; 
}

function display_results(output) {
    var outJson = JSON.stringify(output, null, 4);
    console.log(outJson);
};
