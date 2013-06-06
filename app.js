var sys = require('sys');
var express = require('express');
var mongo = require('mongodb');
var csv = require('./csv');

// Global site variables:
var site_locals = {
	links: [
		{ name: 'home', href: '/' },
		{ name: 'API', href: '/links/api' },
		{ name: 'terms', href: '/links/terms' },
		{ name: 'contact', href: '/links/contact' },
	],
	email: 'michael@objdump.org',
};

var db = new mongo.Db('objdump', new mongo.Server('localhost', 27017, {}), {});
db.open(function() {
	// Prepare collection for storing objects:
	db.collection('objs', function(err, objs) {
		var app = express.createServer();

		app.configure(function() {
			app.use(express.methodOverride());
			app.use(express.bodyDecoder());
			app.use(app.router);
			app.use(express.staticProvider(__dirname + '/static'));
			app.set('views', __dirname + '/views');
			//app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		});

		var render = function(res, view, vars) {
			vars = vars || {};
			vars['site'] = site_locals;
			res.render(view + '.ejs', { locals: vars });
		}

		var sendJS = function(res, id, obj) {
			var js = "window['" + id + "']=";
			if (obj) {
				js += JSON.stringify(obj, null, 2) + ';';
			} else {
				js += 'null;';
			}
			res.send(js);
		}

		app.get('/', function(req, res) {
			render(res, 'index');
		});

		app.post('/', function(req, res) {
			objs.count(function(err, count) {
				try {
					var obj = req.body.object;
					var delim = csv.getDelimiter(obj);
					var parsedObj = delim != null ?
						csv.parse(obj) : JSON.parse(obj);

					var replaceId = req.body.replace;
					if (replaceId) {
						objs.update({'_id' : replaceId}, {'obj' : parsedObj}, function() {
							res.redirect('/' + next);
						});
					} else {
						var next = parseInt(count + 700, 10).toString(36);
						objs.insert({'_id' : next, 'obj' : parsedObj}, function() {
							res.redirect('/' + next);
						});
					}
				} catch(e) {
					render(res, 'error', { error: 'Unable to parse object!' });
				}
			});
		});

		app.get('/links/:link', function(req, res) {
			render(res, req.params.link);
		});

		app.get('/:id', function(req, res) {
			objs.findOne({'_id' : req.params.id}, function(err, result) {
				if (result) {
					var str = JSON.stringify(result.obj, null, 2);
					render(res, 'print', { object: str });
				} else {
					render(res, 'error', { error: 'No such object!' });
				}
			});
		});

		app.get('/:id/jsget', function(req, res) {
			objs.findOne({'_id' : req.params.id}, function(err, result) {
				sendJS(res, req.params.id, result ? result.obj : null);
			});
		});

		app.get('/:id/jsfind', function(req, res) {
			var query = {};
			for (var k in req.query) {
				query['obj.' + k] = req.query[k];
			}
			objs.find({'_id' : req.params.id}, query, function(err, cursor) {
				if (cursor) {
					cursor.toArray(function(err, results) {
						if (err || results.length == 0) {
							sendJS(res, req.params.id, null);
						} else {
							sendJS(res, req.params.id, results[0].obj);
						}
					});
				} else {
					sendJS(res, req.params.id, null);
				}
			});
		});

		app.listen(8000);
	});
}); 

