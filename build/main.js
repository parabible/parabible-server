'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _chapterText = require('./api/chapter-text');

var _wordLookup = require('./api/word-lookup');

var _termSearch = require('./api/term-search');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MongoClient = require('mongodb').MongoClient;

// ssl: http://blog.ayanray.com/2015/06/adding-https-ssl-to-express-4-x-applications/

var things = {
	mongo: false,
	express: false
};
console.log("WAITING:", Object.keys(things).filter(function (k) {
	return things[k];
}));
var declare_ready = function declare_ready(thing) {
	console.log("READY:", thing);
	things[thing] = true;
	if (Object.keys(things).reduce(function (c, k) {
		return c && things[k];
	}, true)) {
		console.log("READY READY READY!");
	}
};

// const url = 'mongodb://localhost:27017/npmong'
var url = 'mongodb://gcpadmin:thisisaninsecurepassword@127.0.0.1:27017/parabible';
var mongoConnection = null;
MongoClient.connect(url, function (err, db) {
	if (err) {
		console.log("Error setting up mongo connection");
		console.log(err);
	} else {
		mongoConnection = db;
		declare_ready("mongo");
	}
});

var app = (0, _express2.default)();
app.use((0, _compression2.default)());
app.use(_bodyParser2.default.json());
app.use((0, _cors2.default)());
var port = +process.env.PORT || 3000;
var host = process.env.HOST || "127.0.0.1";
var server = app.listen(port, host, function () {
	console.log("Server listening to %s:%d within %s environment", host, port, app.get('env'));
	declare_ready("express");
});

console.log("Setting up routes");
app.post(['/api', '/api/*'], function (req, res) {
	var api_request = req.params;
	var params = req.body;
	console.log(api_request[0]);

	var responsePromise = new Promise(function (resolve, reject) {
		return resolve();
	});
	switch (api_request[0]) {
		case "term-search":
			responsePromise = (0, _termSearch.termSearch)(params, mongoConnection);
			break;
		case "collocation-search":
			responsePromise = (0, _termSearch.collocationSearch)(params);
			// response = termSearch(params) 
			break;
		case "word-study":
			// response = termSearch(params) 
			break;
		case "word-lookup":
			responsePromise = (0, _wordLookup.wordLookup)(params, mongoConnection);
			break;
		case "term-highlights":
			// response = termSearch(params) 
			break;
		case "chapter-text":
			responsePromise = (0, _chapterText.chapterText)(params, mongoConnection);
			break;
		default:
			responsePromise = new Promise(function (resolve, reject) {
				reject({
					"error": "Invalid api request. Request should be formatted /api/<type of request>",
					"options": ["term-search", "collocation-search", "word-study", "word-lookup", "term-highlights", "chapter-text"]
				});
			});
			break;
	}
	responsePromise.then(function (response) {
		res.send(response);
	}).catch(function (response) {
		res.send(response);
		console.log("error");
		console.log(response);
	});
});

var clientRoot = process.env.PARABIBLE_CLIENT_DIR;
var getUrl = function getUrl(mobile) {
	if (mobile) return clientRoot + '/mobile.html';else return clientRoot + '/index.html';
};
var needsFonts = function needsFonts(userAgent) {
	// technically this is not mobile - it's whether or not to dump fonts into the index.html
	var regexForMobile = {
		// Windows: /windows nt/i,
		WindowsPhone: /windows phone/i,
		// Mac: /macintosh/i,
		// Linux: /linux/i,
		Wii: /wii/i,
		Playstation: /playstation/i,
		iPad: /ipad/i,
		iPod: /ipod/i,
		iPhone: /iphone/i,
		Android: /android/i,
		Blackberry: /blackberry/i,
		Samsung: /samsung/i,
		// Curl: /curl/i
		Mobile: /mobile/i
	};
	return Object.keys(regexForMobile).reduce(function (a, k) {
		return a || regexForMobile[k].test(userAgent);
	}, false);
};

// Route order matters - the first listed will be invoked
app.get("/", function (req, res) {
	res.sendfile(getUrl(needsFonts(req.headers["user-agent"])));
});
app.use(_express2.default.static(clientRoot));
app.get("*", function (req, res) {
	res.sendfile(getUrl(needsFonts(req.headers["user-agent"])));
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbIk1vbmdvQ2xpZW50IiwicmVxdWlyZSIsInRoaW5ncyIsIm1vbmdvIiwiZXhwcmVzcyIsImNvbnNvbGUiLCJsb2ciLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwiayIsImRlY2xhcmVfcmVhZHkiLCJ0aGluZyIsInJlZHVjZSIsImMiLCJ1cmwiLCJtb25nb0Nvbm5lY3Rpb24iLCJjb25uZWN0IiwiZXJyIiwiZGIiLCJhcHAiLCJ1c2UiLCJqc29uIiwicG9ydCIsInByb2Nlc3MiLCJlbnYiLCJQT1JUIiwiaG9zdCIsIkhPU1QiLCJzZXJ2ZXIiLCJsaXN0ZW4iLCJnZXQiLCJwb3N0IiwicmVxIiwicmVzIiwiYXBpX3JlcXVlc3QiLCJwYXJhbXMiLCJib2R5IiwicmVzcG9uc2VQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0aGVuIiwicmVzcG9uc2UiLCJzZW5kIiwiY2F0Y2giLCJjbGllbnRSb290IiwiUEFSQUJJQkxFX0NMSUVOVF9ESVIiLCJnZXRVcmwiLCJtb2JpbGUiLCJuZWVkc0ZvbnRzIiwidXNlckFnZW50IiwicmVnZXhGb3JNb2JpbGUiLCJXaW5kb3dzUGhvbmUiLCJXaWkiLCJQbGF5c3RhdGlvbiIsImlQYWQiLCJpUG9kIiwiaVBob25lIiwiQW5kcm9pZCIsIkJsYWNrYmVycnkiLCJTYW1zdW5nIiwiTW9iaWxlIiwiYSIsInRlc3QiLCJzZW5kZmlsZSIsImhlYWRlcnMiLCJzdGF0aWMiXSwibWFwcGluZ3MiOiI7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFJQTs7QUFDQTs7QUFDQTs7OztBQVZBLElBQUlBLGNBQWNDLFFBQVEsU0FBUixFQUFtQkQsV0FBckM7O0FBTUE7O0FBTUEsSUFBSUUsU0FBUztBQUNaQyxRQUFPLEtBREs7QUFFWkMsVUFBUztBQUZHLENBQWI7QUFJQUMsUUFBUUMsR0FBUixDQUFZLFVBQVosRUFBd0JDLE9BQU9DLElBQVAsQ0FBWU4sTUFBWixFQUFvQk8sTUFBcEIsQ0FBMkI7QUFBQSxRQUFLUCxPQUFPUSxDQUFQLENBQUw7QUFBQSxDQUEzQixDQUF4QjtBQUNBLElBQU1DLGdCQUFnQixTQUFoQkEsYUFBZ0IsQ0FBQ0MsS0FBRCxFQUFXO0FBQ2hDUCxTQUFRQyxHQUFSLENBQVksUUFBWixFQUFzQk0sS0FBdEI7QUFDQVYsUUFBT1UsS0FBUCxJQUFnQixJQUFoQjtBQUNBLEtBQUlMLE9BQU9DLElBQVAsQ0FBWU4sTUFBWixFQUFvQlcsTUFBcEIsQ0FBMkIsVUFBQ0MsQ0FBRCxFQUFJSixDQUFKO0FBQUEsU0FBVUksS0FBS1osT0FBT1EsQ0FBUCxDQUFmO0FBQUEsRUFBM0IsRUFBcUQsSUFBckQsQ0FBSixFQUFnRTtBQUMvREwsVUFBUUMsR0FBUixDQUFZLG9CQUFaO0FBQ0E7QUFDRCxDQU5EOztBQVFBO0FBQ0EsSUFBTVMsTUFBTSx1RUFBWjtBQUNBLElBQUlDLGtCQUFrQixJQUF0QjtBQUNBaEIsWUFBWWlCLE9BQVosQ0FBb0JGLEdBQXBCLEVBQXlCLFVBQUNHLEdBQUQsRUFBTUMsRUFBTixFQUFhO0FBQ3JDLEtBQUlELEdBQUosRUFBUztBQUNSYixVQUFRQyxHQUFSLENBQVksbUNBQVo7QUFDQUQsVUFBUUMsR0FBUixDQUFZWSxHQUFaO0FBQ0EsRUFIRCxNQUlLO0FBQ0pGLG9CQUFrQkcsRUFBbEI7QUFDQVIsZ0JBQWMsT0FBZDtBQUNBO0FBQ0QsQ0FURDs7QUFXQSxJQUFJUyxNQUFNLHdCQUFWO0FBQ0FBLElBQUlDLEdBQUosQ0FBUSw0QkFBUjtBQUNBRCxJQUFJQyxHQUFKLENBQVEscUJBQVdDLElBQVgsRUFBUjtBQUNBRixJQUFJQyxHQUFKLENBQVEscUJBQVI7QUFDQSxJQUFJRSxPQUFPLENBQUNDLFFBQVFDLEdBQVIsQ0FBWUMsSUFBYixJQUFxQixJQUFoQztBQUNBLElBQUlDLE9BQU9ILFFBQVFDLEdBQVIsQ0FBWUcsSUFBWixJQUFvQixXQUEvQjtBQUNBLElBQUlDLFNBQVNULElBQUlVLE1BQUosQ0FBV1AsSUFBWCxFQUFpQkksSUFBakIsRUFBdUIsWUFBTTtBQUN6Q3RCLFNBQVFDLEdBQVIsQ0FBWSxpREFBWixFQUErRHFCLElBQS9ELEVBQXFFSixJQUFyRSxFQUEyRUgsSUFBSVcsR0FBSixDQUFRLEtBQVIsQ0FBM0U7QUFDQXBCLGVBQWMsU0FBZDtBQUNBLENBSFksQ0FBYjs7QUFPQU4sUUFBUUMsR0FBUixDQUFZLG1CQUFaO0FBQ0FjLElBQUlZLElBQUosQ0FBUyxDQUFDLE1BQUQsRUFBUyxRQUFULENBQVQsRUFBNkIsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDMUMsS0FBTUMsY0FBY0YsSUFBSUcsTUFBeEI7QUFDQSxLQUFNQSxTQUFTSCxJQUFJSSxJQUFuQjtBQUNBaEMsU0FBUUMsR0FBUixDQUFZNkIsWUFBWSxDQUFaLENBQVo7O0FBRUEsS0FBSUcsa0JBQWtCLElBQUlDLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVY7QUFBQSxTQUFxQkQsU0FBckI7QUFBQSxFQUFaLENBQXRCO0FBQ0EsU0FBT0wsWUFBWSxDQUFaLENBQVA7QUFDQyxPQUFLLGFBQUw7QUFDQ0cscUJBQWtCLDRCQUFXRixNQUFYLEVBQW1CcEIsZUFBbkIsQ0FBbEI7QUFDQTtBQUNELE9BQUssb0JBQUw7QUFDQ3NCLHFCQUFrQixtQ0FBa0JGLE1BQWxCLENBQWxCO0FBQ0E7QUFDQTtBQUNELE9BQUssWUFBTDtBQUNDO0FBQ0E7QUFDRCxPQUFLLGFBQUw7QUFDQ0UscUJBQWtCLDRCQUFXRixNQUFYLEVBQW1CcEIsZUFBbkIsQ0FBbEI7QUFDQTtBQUNELE9BQUssaUJBQUw7QUFDQztBQUNBO0FBQ0QsT0FBSyxjQUFMO0FBQ0NzQixxQkFBa0IsOEJBQVlGLE1BQVosRUFBb0JwQixlQUFwQixDQUFsQjtBQUNBO0FBQ0Q7QUFDQ3NCLHFCQUFrQixJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ2xEQSxXQUFPO0FBQ04sY0FBUyx5RUFESDtBQUVOLGdCQUFXLENBQ1YsYUFEVSxFQUVWLG9CQUZVLEVBR1YsWUFIVSxFQUlWLGFBSlUsRUFLVixpQkFMVSxFQU1WLGNBTlU7QUFGTCxLQUFQO0FBV0EsSUFaaUIsQ0FBbEI7QUFhQTtBQWxDRjtBQW9DQUgsaUJBQWdCSSxJQUFoQixDQUFxQixVQUFDQyxRQUFELEVBQWM7QUFDbENULE1BQUlVLElBQUosQ0FBU0QsUUFBVDtBQUNBLEVBRkQsRUFFR0UsS0FGSCxDQUVTLFVBQUNGLFFBQUQsRUFBYztBQUN0QlQsTUFBSVUsSUFBSixDQUFTRCxRQUFUO0FBQ0F0QyxVQUFRQyxHQUFSLENBQVksT0FBWjtBQUNBRCxVQUFRQyxHQUFSLENBQVlxQyxRQUFaO0FBQ0EsRUFORDtBQU9BLENBakREOztBQW9EQSxJQUFNRyxhQUFhdEIsUUFBUUMsR0FBUixDQUFZc0Isb0JBQS9CO0FBQ0EsSUFBTUMsU0FBUyxTQUFUQSxNQUFTLENBQUNDLE1BQUQsRUFBWTtBQUMxQixLQUFJQSxNQUFKLEVBQ0MsT0FBT0gsYUFBYSxjQUFwQixDQURELEtBR0MsT0FBT0EsYUFBYSxhQUFwQjtBQUNELENBTEQ7QUFNQSxJQUFNSSxhQUFhLFNBQWJBLFVBQWEsQ0FBQ0MsU0FBRCxFQUFlO0FBQ2pDO0FBQ0EsS0FBTUMsaUJBQWlCO0FBQ3RCO0FBQ0FDLGdCQUFjLGdCQUZRO0FBR3RCO0FBQ0E7QUFDQUMsT0FBSyxNQUxpQjtBQU10QkMsZUFBYSxjQU5TO0FBT3RCQyxRQUFNLE9BUGdCO0FBUXRCQyxRQUFNLE9BUmdCO0FBU3RCQyxVQUFRLFNBVGM7QUFVdEJDLFdBQVMsVUFWYTtBQVd0QkMsY0FBWSxhQVhVO0FBWXRCQyxXQUFTLFVBWmE7QUFhdEI7QUFDQUMsVUFBUTtBQWRjLEVBQXZCO0FBZ0JBLFFBQU92RCxPQUFPQyxJQUFQLENBQVk0QyxjQUFaLEVBQTRCdkMsTUFBNUIsQ0FBbUMsVUFBQ2tELENBQUQsRUFBSXJELENBQUo7QUFBQSxTQUN6Q3FELEtBQUtYLGVBQWUxQyxDQUFmLEVBQWtCc0QsSUFBbEIsQ0FBdUJiLFNBQXZCLENBRG9DO0FBQUEsRUFBbkMsRUFFUCxLQUZPLENBQVA7QUFHQSxDQXJCRDs7QUF1QkE7QUFDQS9CLElBQUlXLEdBQUosQ0FBUSxHQUFSLEVBQWEsVUFBQ0UsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDMUJBLEtBQUkrQixRQUFKLENBQWFqQixPQUFPRSxXQUFXakIsSUFBSWlDLE9BQUosQ0FBWSxZQUFaLENBQVgsQ0FBUCxDQUFiO0FBQ0EsQ0FGRDtBQUdBOUMsSUFBSUMsR0FBSixDQUFRLGtCQUFROEMsTUFBUixDQUFlckIsVUFBZixDQUFSO0FBQ0ExQixJQUFJVyxHQUFKLENBQVEsR0FBUixFQUFhLFVBQUNFLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQzFCQSxLQUFJK0IsUUFBSixDQUFhakIsT0FBT0UsV0FBV2pCLElBQUlpQyxPQUFKLENBQVksWUFBWixDQUFYLENBQVAsQ0FBYjtBQUNBLENBRkQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBNb25nb0NsaWVudCA9IHJlcXVpcmUoJ21vbmdvZGInKS5Nb25nb0NsaWVudFxuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcydcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICdjb21wcmVzc2lvbidcbmltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJ1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycydcblxuLy8gc3NsOiBodHRwOi8vYmxvZy5heWFucmF5LmNvbS8yMDE1LzA2L2FkZGluZy1odHRwcy1zc2wtdG8tZXhwcmVzcy00LXgtYXBwbGljYXRpb25zL1xuXG5pbXBvcnQgeyBjaGFwdGVyVGV4dCB9IGZyb20gXCIuL2FwaS9jaGFwdGVyLXRleHRcIlxuaW1wb3J0IHsgd29yZExvb2t1cCB9IGZyb20gXCIuL2FwaS93b3JkLWxvb2t1cFwiXG5pbXBvcnQgeyB0ZXJtU2VhcmNoLCBjb2xsb2NhdGlvblNlYXJjaCB9IGZyb20gXCIuL2FwaS90ZXJtLXNlYXJjaFwiXG5cbmxldCB0aGluZ3MgPSB7XG5cdG1vbmdvOiBmYWxzZSxcblx0ZXhwcmVzczogZmFsc2Vcbn1cbmNvbnNvbGUubG9nKFwiV0FJVElORzpcIiwgT2JqZWN0LmtleXModGhpbmdzKS5maWx0ZXIoayA9PiB0aGluZ3Nba10pKVxuY29uc3QgZGVjbGFyZV9yZWFkeSA9ICh0aGluZykgPT4ge1xuXHRjb25zb2xlLmxvZyhcIlJFQURZOlwiLCB0aGluZylcblx0dGhpbmdzW3RoaW5nXSA9IHRydWVcblx0aWYgKE9iamVjdC5rZXlzKHRoaW5ncykucmVkdWNlKChjLCBrKSA9PiBjICYmIHRoaW5nc1trXSwgdHJ1ZSkpIHtcblx0XHRjb25zb2xlLmxvZyhcIlJFQURZIFJFQURZIFJFQURZIVwiKVxuXHR9XG59XG5cbi8vIGNvbnN0IHVybCA9ICdtb25nb2RiOi8vbG9jYWxob3N0OjI3MDE3L25wbW9uZydcbmNvbnN0IHVybCA9ICdtb25nb2RiOi8vZ2NwYWRtaW46dGhpc2lzYW5pbnNlY3VyZXBhc3N3b3JkQDEyNy4wLjAuMToyNzAxNy9wYXJhYmlibGUnXG5sZXQgbW9uZ29Db25uZWN0aW9uID0gbnVsbDtcbk1vbmdvQ2xpZW50LmNvbm5lY3QodXJsLCAoZXJyLCBkYikgPT4ge1xuXHRpZiAoZXJyKSB7XG5cdFx0Y29uc29sZS5sb2coXCJFcnJvciBzZXR0aW5nIHVwIG1vbmdvIGNvbm5lY3Rpb25cIilcblx0XHRjb25zb2xlLmxvZyhlcnIpXG5cdH1cblx0ZWxzZSB7XG5cdFx0bW9uZ29Db25uZWN0aW9uID0gZGJcblx0XHRkZWNsYXJlX3JlYWR5KFwibW9uZ29cIilcblx0fVxufSlcblxubGV0IGFwcCA9IGV4cHJlc3MoKVxuYXBwLnVzZShjb21wcmVzc2lvbigpKVxuYXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSlcbmFwcC51c2UoY29ycygpKVxubGV0IHBvcnQgPSArcHJvY2Vzcy5lbnYuUE9SVCB8fCAzMDAwXG5sZXQgaG9zdCA9IHByb2Nlc3MuZW52LkhPU1QgfHwgXCIxMjcuMC4wLjFcIlxubGV0IHNlcnZlciA9IGFwcC5saXN0ZW4ocG9ydCwgaG9zdCwgKCkgPT4ge1xuXHRjb25zb2xlLmxvZyhcIlNlcnZlciBsaXN0ZW5pbmcgdG8gJXM6JWQgd2l0aGluICVzIGVudmlyb25tZW50XCIsIGhvc3QsIHBvcnQsIGFwcC5nZXQoJ2VudicpKVxuXHRkZWNsYXJlX3JlYWR5KFwiZXhwcmVzc1wiKVxufSlcblxuXG5cbmNvbnNvbGUubG9nKFwiU2V0dGluZyB1cCByb3V0ZXNcIilcbmFwcC5wb3N0KFsnL2FwaScsICcvYXBpLyonXSwgKHJlcSwgcmVzKSA9PiB7XG5cdGNvbnN0IGFwaV9yZXF1ZXN0ID0gcmVxLnBhcmFtc1xuXHRjb25zdCBwYXJhbXMgPSByZXEuYm9keVxuXHRjb25zb2xlLmxvZyhhcGlfcmVxdWVzdFswXSlcblxuXHRsZXQgcmVzcG9uc2VQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVzb2x2ZSgpKVxuXHRzd2l0Y2goYXBpX3JlcXVlc3RbMF0pIHtcblx0XHRjYXNlIFwidGVybS1zZWFyY2hcIjpcblx0XHRcdHJlc3BvbnNlUHJvbWlzZSA9IHRlcm1TZWFyY2gocGFyYW1zLCBtb25nb0Nvbm5lY3Rpb24pXG5cdFx0XHRicmVha1xuXHRcdGNhc2UgXCJjb2xsb2NhdGlvbi1zZWFyY2hcIjpcblx0XHRcdHJlc3BvbnNlUHJvbWlzZSA9IGNvbGxvY2F0aW9uU2VhcmNoKHBhcmFtcylcblx0XHRcdC8vIHJlc3BvbnNlID0gdGVybVNlYXJjaChwYXJhbXMpIFxuXHRcdFx0YnJlYWtcblx0XHRjYXNlIFwid29yZC1zdHVkeVwiOlxuXHRcdFx0Ly8gcmVzcG9uc2UgPSB0ZXJtU2VhcmNoKHBhcmFtcykgXG5cdFx0XHRicmVha1xuXHRcdGNhc2UgXCJ3b3JkLWxvb2t1cFwiOlxuXHRcdFx0cmVzcG9uc2VQcm9taXNlID0gd29yZExvb2t1cChwYXJhbXMsIG1vbmdvQ29ubmVjdGlvbikgXG5cdFx0XHRicmVha1xuXHRcdGNhc2UgXCJ0ZXJtLWhpZ2hsaWdodHNcIjpcblx0XHRcdC8vIHJlc3BvbnNlID0gdGVybVNlYXJjaChwYXJhbXMpIFxuXHRcdFx0YnJlYWtcblx0XHRjYXNlIFwiY2hhcHRlci10ZXh0XCI6XG5cdFx0XHRyZXNwb25zZVByb21pc2UgPSBjaGFwdGVyVGV4dChwYXJhbXMsIG1vbmdvQ29ubmVjdGlvbilcblx0XHRcdGJyZWFrXG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJlc3BvbnNlUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0cmVqZWN0KHtcblx0XHRcdFx0XHRcImVycm9yXCI6IFwiSW52YWxpZCBhcGkgcmVxdWVzdC4gUmVxdWVzdCBzaG91bGQgYmUgZm9ybWF0dGVkIC9hcGkvPHR5cGUgb2YgcmVxdWVzdD5cIixcblx0XHRcdFx0XHRcIm9wdGlvbnNcIjogW1xuXHRcdFx0XHRcdFx0XCJ0ZXJtLXNlYXJjaFwiLFxuXHRcdFx0XHRcdFx0XCJjb2xsb2NhdGlvbi1zZWFyY2hcIixcblx0XHRcdFx0XHRcdFwid29yZC1zdHVkeVwiLFxuXHRcdFx0XHRcdFx0XCJ3b3JkLWxvb2t1cFwiLFxuXHRcdFx0XHRcdFx0XCJ0ZXJtLWhpZ2hsaWdodHNcIixcblx0XHRcdFx0XHRcdFwiY2hhcHRlci10ZXh0XCJcblx0XHRcdFx0XHRdXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0YnJlYWtcblx0fVxuXHRyZXNwb25zZVByb21pc2UudGhlbigocmVzcG9uc2UpID0+IHtcblx0XHRyZXMuc2VuZChyZXNwb25zZSlcblx0fSkuY2F0Y2goKHJlc3BvbnNlKSA9PiB7XG5cdFx0cmVzLnNlbmQocmVzcG9uc2UpXG5cdFx0Y29uc29sZS5sb2coXCJlcnJvclwiKVxuXHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuXHR9KVxufSlcblxuXG5jb25zdCBjbGllbnRSb290ID0gcHJvY2Vzcy5lbnYuUEFSQUJJQkxFX0NMSUVOVF9ESVJcbmNvbnN0IGdldFVybCA9IChtb2JpbGUpID0+IHtcblx0aWYgKG1vYmlsZSlcblx0XHRyZXR1cm4gY2xpZW50Um9vdCArICcvbW9iaWxlLmh0bWwnXG5cdGVsc2Vcblx0XHRyZXR1cm4gY2xpZW50Um9vdCArICcvaW5kZXguaHRtbCdcbn1cbmNvbnN0IG5lZWRzRm9udHMgPSAodXNlckFnZW50KSA9PiB7XG5cdC8vIHRlY2huaWNhbGx5IHRoaXMgaXMgbm90IG1vYmlsZSAtIGl0J3Mgd2hldGhlciBvciBub3QgdG8gZHVtcCBmb250cyBpbnRvIHRoZSBpbmRleC5odG1sXG5cdGNvbnN0IHJlZ2V4Rm9yTW9iaWxlID0ge1xuXHRcdC8vIFdpbmRvd3M6IC93aW5kb3dzIG50L2ksXG5cdFx0V2luZG93c1Bob25lOiAvd2luZG93cyBwaG9uZS9pLFxuXHRcdC8vIE1hYzogL21hY2ludG9zaC9pLFxuXHRcdC8vIExpbnV4OiAvbGludXgvaSxcblx0XHRXaWk6IC93aWkvaSxcblx0XHRQbGF5c3RhdGlvbjogL3BsYXlzdGF0aW9uL2ksXG5cdFx0aVBhZDogL2lwYWQvaSxcblx0XHRpUG9kOiAvaXBvZC9pLFxuXHRcdGlQaG9uZTogL2lwaG9uZS9pLFxuXHRcdEFuZHJvaWQ6IC9hbmRyb2lkL2ksXG5cdFx0QmxhY2tiZXJyeTogL2JsYWNrYmVycnkvaSxcblx0XHRTYW1zdW5nOiAvc2Ftc3VuZy9pLFxuXHRcdC8vIEN1cmw6IC9jdXJsL2lcblx0XHRNb2JpbGU6IC9tb2JpbGUvaVxuXHR9XG5cdHJldHVybiBPYmplY3Qua2V5cyhyZWdleEZvck1vYmlsZSkucmVkdWNlKChhLCBrKSA9PlxuXHRcdGEgfHwgcmVnZXhGb3JNb2JpbGVba10udGVzdCh1c2VyQWdlbnQpLFxuXHRmYWxzZSlcbn1cblxuLy8gUm91dGUgb3JkZXIgbWF0dGVycyAtIHRoZSBmaXJzdCBsaXN0ZWQgd2lsbCBiZSBpbnZva2VkXG5hcHAuZ2V0KFwiL1wiLCAocmVxLCByZXMpID0+IHtcblx0cmVzLnNlbmRmaWxlKGdldFVybChuZWVkc0ZvbnRzKHJlcS5oZWFkZXJzW1widXNlci1hZ2VudFwiXSkpKVxufSlcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMoY2xpZW50Um9vdCkpXG5hcHAuZ2V0KFwiKlwiLCAocmVxLCByZXMpID0+IHtcblx0cmVzLnNlbmRmaWxlKGdldFVybChuZWVkc0ZvbnRzKHJlcS5oZWFkZXJzW1widXNlci1hZ2VudFwiXSkpKVxufSkiXX0=