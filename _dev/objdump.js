var objDump = new function() {
	
	this.url = 'http://objdump.org/';

	/**
	 * This function loads your object from objdump.org, and passes it to the given function.
	 *
	 * @param {String} key Object name
	 *
	 * @param {Function} [callback]
	 *		Function that will be called when the object is loaded (the loaded object
	 *		will be passed to the function as the only parameter).
	 */
	this.get = function(key, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = this.url + key + "/jsget";

		function onScriptLoad() {
			document.body.removeChild(script);
			if (typeof(callback) != 'undefined') {
				callback(window[key]);
				delete window[key];
			}
			script = null;
		}

		if(typeof(script.addEventListener) != 'undefined') {
			/* The FF, Chrome, Safari, Opera way */
			script.addEventListener('load', onScriptLoad, false);
		} else {
			/* The MS IE 8+ way */
			function handleIeState() {
				if(script.readyState == 'loaded'){
					onScriptLoad();
				}
			}
			script.attachEvent('onreadystatechange',handleIeState);
		}
		document.body.appendChild(script);
	};

	/**
	 * This function updates your object to obdjump.org asynchronously.
	 *
	 * @param {String} key
	 *		Object name
	 *
	 * @param {Object} value
	 *		Object value
	 */
	this.put = function(key, value) {
		var proxyFrame = document.getElementById('objdump_proxy');
		if (proxyFrame) {
			document.body.removeChild(proxyFrame);
		}
		proxyFrame = document.createElement('iframe');
		proxyFrame.id = 'objdump_proxy';
		proxyFrame.style.display = 'none';
		document.body.appendChild(proxyFrame);

		var proxyFrameDoc = proxyFrame.contentWindow.document;
		proxyFrameDoc.open();
		proxyFrameDoc.write('<form method="POST" action="' + this.url + key + '">');
		proxyFrameDoc.write('<textarea name="object">' + JSON.stringify(value) + '</textarea>');
		proxyFrameDoc.write('<input type="hidden" name="replace" value="' + key + '" />');
		proxyFrameDoc.write('</form>');
		proxyFrameDoc.write('<script>window.onload=function(){document.forms[0].submit();}</' + 'script>');
		proxyFrameDoc.close();
	};
}

