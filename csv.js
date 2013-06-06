/**
 * Converts CSV string to JSON object. The default delimiter is the comma,
 * but this can be overriden in the second argument. The very firtst line
 * in the CSV string must denote column names.
 *
 * @param {String} csv CSV data string
 * @param {String} delim Fields delimiter character
 */
exports.parse = function(csv, delim) {
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	delim = (delim || ",");

	// Create a regular expression to parse the CSV values.
	var pattern = new RegExp(
			(
			 // Delimiters.
			 "(\\" + delim + "|\\r?\\n|\\r|^)" +

			 // Quoted fields.
			 "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			 // Standard fields.
			 "([^\"\\" + delim + "\\r\\n]*))"
			),
			"gi"
			);


	var data = [];
	var columns = [];
	var firstLine = true;
	var columnIdx = -1;

	// Create an array to hold our individual pattern
	// matching groups.
	var match = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (match = pattern.exec( csv )){

		// Get the delimiter that was found.
		var matchedDelim = match[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (matchedDelim.length && (matchedDelim != delim)){
			if (firstLine) {
				firstLine = false;

			}
			// Since we have reached a new row of data,
			// add an empty row to our data array.
			data.push({});

			columnIdx = 0;
		}


		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (match[ 2 ]){
			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			var value = match[ 2 ].replace(
					new RegExp( "\"\"", "g" ),
					"\""
					);
		} else {
			// We found a non-quoted value.
			var value = match[3];
		}

		if (firstLine) {
			columns.push(value);
		} else {
			var columnName = columns[columnIdx++];
			// Now that we have our value string, let's add
			// it to the data array.
			data[data.length - 1][columnName] = value;
		}
	}

	// Return the parsed data.
	return data;
};

/**
 * Returns fields delimiter used in a given CSV data.
 * If provided string doesn't denote correct CSV, null is returned.
 */
exports.getDelimiter = function(csv) {
	var currCounts = {';' : 0, ',' : 0};
	var prevCounts = null;
	var eq = null;

	for(var i = 0; i < csv.length; ++i) {
		var ch = csv.charAt(i);

		if (typeof(currCounts[ch]) != 'undefined') {
			++currCounts[ch];
		}
		if (i == csv.length - 1 || ch == '\r' || ch == '\n') {
			if (prevCounts != null) {
				eq = [];
				for (var d in prevCounts) {
					if (currCounts[d] == prevCounts[d]
						&& currCounts[d] > 0) {
						eq.push(d);
					}
				}
				if (eq.length == 0) {
					return null;
				}
				if (eq.length == 1) {
					return eq[0];
				}
			} else {
				prevCounts = {};
			}
			for (var d in currCounts) {
				prevCounts[d] = currCounts[d];
				currCounts[d] = 0;
			}
			while (i < csv.length && (ch == '\r' || ch == '\n')) {
				ch = csv.charAt(++i);
			}
		}
	}
	if (eq != null && eq.length > 0) {
		return eq[0];
	}
	return null;
};
