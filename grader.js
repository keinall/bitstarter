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

var fs = require('fs');
// now, restler stuff so we can pull URLs
var util = require('util');
var rest = require('restler');

var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
//var URL_DEFAULT = "http://whispering-badlands-6738.herokuapp.com/"; 
var URL_DEFAULT = null ; // special market to avoid dowloading
var DL_LOCATION = "~/bitstarter/testme.html"; // local copy of URL

var assertFileExists = function(infile) {

    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLWorks = function(givenurl) {
/* this is not only an assert, it actually has side effect:
** downloads the URL into DL_LOCATION, and 
** sets up program as if user said to test that file instead.
** It should work, but I don't think it is very elegant.
*/
    if ( givenurl == null ) {
	return; /// do nothing, unless we really have a URL
    };

    rest.get(givenurl).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error retrieving URL:' + result.message);
	    process.exit(1);
	} else {
	    fs.writeFile(DL_LOCATION, result, function(err) {
		if (err) throw err;
		else {
		    // setup rest of program to run smoothly
		    //assertFileExists(DL_LOCATION);
		    console.log("Read url to %s okay.", DL_LOCATION);
		    // i.e. do nothing else of value
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
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
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
    if ( program.url == null ) { 
	var checkJson = checkHtmlFile(program.file, program.checks);
    } else {
	var checkJson = checkHtmlFile(DL_LOCATION, program.checks);
    };
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

