var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	url = require('url'),

	http = require('http'),
	https = require('https'),

	mkdirp = require('mkdirp'),
	gm = require('gm'),
	request = require('request');

// CONFIGURATION

var WORKING_DIR = path.resolve('cache'),

	CACHE_CONTROL = 'max-age=2592000', // Cache for 1 month

	// Regular expressions to test valid URLs
	WHITELIST = [
		/https?:\/\/cdn\.betterttv\.net\/emote\/.*/i
	],

	LISTEN_PORT = 8000,
	SSL_KEY = null, //'private_key.pem',
	SSL_CERT = null; //'certificate.pem';


// END CONFIGURATION


function sanitize(uri) {
	var safe = uri.replace('://', '_').replace(/[\?\.<>\\:\*|"'\x00-\x1f\x80-\x9f]/g, '_'),
		ind = safe.indexOf('/') + 1;

	return ind > 1 ? safe.substr(0, ind) + safe.substr(ind).replace(/\//g, '_') : safe;
}


function request_handler(req, res) {
	var uri = url.parse(req.url).pathname.substr(1),
		i = WHITELIST.length,
		valid = false;

	while(i--)
		if ( WHITELIST[i].test(uri) ) {
			valid = true;
			break;
		}

	if ( ! valid ) {
		res.writeHead(403, {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"});
		res.write(JSON.stringify({status: 403, error: "URL is not whitelisted."}));
		res.end();
		return;
	}

	var cache_key = path.resolve(WORKING_DIR, path.normalize(sanitize(uri)));

	// Make sure we're not trying to escape the working directory.
	if ( cache_key.indexOf(WORKING_DIR) !== 0 ) {
		res.writeHead(403, {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"});
		res.write(JSON.stringify({status: 403, error: "Forbidden"}));
		res.end();
		return;
	}

	// TODO: Check the age of the file. If it's too old, get it again from the server
	// to make sure it hasn't changed on us.
	fs.exists(cache_key, function(exists) {
		if ( exists ) {
			res.writeHead(200, {
				'Content-Type': 'image/png',
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': CACHE_CONTROL,
			});

			fs.createReadStream(cache_key).pipe(res);
			return;
		}

		// Make sure the folder we're putting the image in exists.
		var base = path.dirname(cache_key);
		mkdirp(base, function(err) {
			if ( err && err.code !== 'EEXIST' ) {
				console.log(err);
				res.writeHead(500, {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"});
				res.write(JSON.stringify({status: 500, error: "Error processing image."}));
				res.end();
				return;
			}

			// Download and process the image.
			gm(request(uri))
				.selectFrame(0)
				.write(cache_key, function(err) {
					if ( err ) {
						console.log(err);
						res.writeHead(500, {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"});
						res.write(JSON.stringify({status: 500, error: "An error occured processing this URL. Is it a valid URL?"}));
						res.end();
					} else
						request_handler(req, res);
				});
		});
	});
}


var server;

if ( SSL_KEY ) {
	if ( ! fs.existsSync(SSL_KEY) && ! fs.existsSync(SSL_CERT) ) {
		console.error('Cannot find keyfile and cert.');
		process.exit(1);
	}

	server = https.createServer({
		key: fs.readFileSync(SSL_KEY),
		cert: fs.readFileSync(SSL_CERT)
	}, request_handler);

} else
	server = http.createServer(request_handler);

server.listen(LISTEN_PORT);
