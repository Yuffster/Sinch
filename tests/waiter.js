var log = require('util').puts;

var waitFor = 500,
    pending = 0,
    failed  = 0,
    passed  = 0,
    total   = 0,
    lastTimeout = false,
    errored = false;

process.on('uncaughtException', function (e) {
	var errored = true;
	console.log('\033[31m'+e+'\033[0m');
	console.log(e.stack);
});

log("Beginning tests; test timeout "+waitFor/1000+" seconds.");

function register(expected, result, line) {
	if (expected!=result) {
		log("\033[31mFAIL:\033[0m "+line);
		if (result == "[TIMEOUT]") {
			log("      The operation timed out after "
				+waitFor/1000+" seconds.");
		} else {
			log("      Expected: "+expected);
			log("        Result: "+result);
		}
		failed++;
		return false;
	} else {
		passed++;
		return true;
	}
}

function complete() {
	log("All tests complete.");
	log("Passed: "+passed+"/"+(total));
	process.exit((errored) ? 1 : total-passed);
}

function wait(expected) {
	var line;
	total++;
	try {
		throw new Error("Foo.");
	} catch(e) {
		line = e.stack.split('\n')[2].match(/\((.*)\)/)[1];
	}
	pending++;
	var done = false, timeout = false, lastSuccess = false;
	// Set the timeout for this test.
	setTimeout(function() {
		if (done) return;
		register(expected, "[TIMEOUT]", line);
		timeout = true;
		clearTimeout(lastTimeout);
	}, waitFor);
	lastTimeout = setTimeout(function() {
		complete();
	}, waitFor+100);
	return function(result) {
		if (timeout) return;
		if (done) {
			log("\033[31mFAIL:\033[0m Double-call from "+line);
			if (lastSuccess) {
				passed--;
				failed++;
			}
		} else {
			done = true;
			lastSuccess = register(expected, result, line);
		}
	};
}

module.exports = wait;