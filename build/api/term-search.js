'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports._wordsThatMatchQuery = exports.collocationSearch = exports.termSearch = undefined;

var _util = require('../util/util');

var _chapterText = require('./chapter-text');

var _word_data_map = require('../../data/word_data_map');

var _word_data_map2 = _interopRequireDefault(_word_data_map);

var _tree_data = require('../../data/tree_data');

var _tree_data2 = _interopRequireDefault(_tree_data);

var _range_node_data = require('../../data/range_node_data');

var _range_node_data2 = _interopRequireDefault(_range_node_data);

var _book_names = require('../../data/book_names');

var _book_names2 = _interopRequireDefault(_book_names);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var doLog = false;
var consoleLog = function consoleLog() {
	if (doLog) {
		var _console;

		(_console = console).log.apply(_console, arguments);
	}
};

var heatUpVerseWords = function heatUpVerseWords(verse_words, hot_set, lukewarm_set) {
	return verse_words.map(function (accentUnit) {
		return accentUnit.map(function (w) {
			if (hot_set.has(w["wid"])) w["temperature"] = 2;else if (lukewarm_set.has(w["wid"])) w["temperature"] = 1;
			return w;
		});
	});
};

var _doFilter = function _doFilter(filter, wordNodes) {
	var chapterFilter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

	if (filter.length > 0) {
		var chapterOffset = chapterFilter * 1000;
		var ridFilter = filter.map(function (f) {
			return _book_names2.default[f] * 10000000 + chapterOffset;
		});

		var extent = chapterFilter === 0 ? 10000000 : 1000;
		return wordNodes.filter(function (w) {
			var rid = _tree_data2.default[w].verse;
			return ridFilter.reduce(function (a, v) {
				return a || v <= rid && rid < v + extent;
			}, false);
		});
	} else {
		return wordNodes;
	}
};
var _wordsThatMatchQuery = function _wordsThatMatchQuery(query, filter) {
	var chapterFilter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

	var query_matches = [];
	Object.keys(query).forEach(function (k) {
		var v = query[k].normalize();
		query_matches.push(_doFilter(filter, _word_data_map2.default[k][v], chapterFilter));
	});
	return _util.arrayIntersect.apply(undefined, query_matches);
};
var _queryForWids = function _queryForWids(_ref) {
	var queryArray = _ref.queryArray,
	    search_range = _ref.search_range,
	    search_filter = _ref.search_filter;

	var word_matches = [];
	var exclusions = [];
	var current_match = -1;
	// let starttime = process.hrtime()
	queryArray.forEach(function (query) {
		// consoleLog("BENCHMARK Q: foreach cycle ", process.hrtime(starttime))
		var query_matches = _wordsThatMatchQuery(query.data, search_filter);

		if (query.invert) exclusions.push.apply(exclusions, _toConsumableArray(query_matches));else word_matches.push(query_matches);
	});
	// consoleLog("BENCHMARK Q: done with foreach", process.hrtime(starttime))

	var sr_matches = word_matches.map(function (m) {
		return m.map(function (n) {
			return _tree_data2.default[n][search_range];
		});
	});
	var sr_exclusions = exclusions.map(function (m) {
		return _tree_data2.default[m][search_range];
	});
	var match_intersection = _util.arrayIntersect.apply(undefined, _toConsumableArray(sr_matches));
	var range_matches = (0, _util.arrayDiff)(match_intersection, sr_exclusions);
	// consoleLog("BENCHMARK Q: done intersecting", process.hrtime(starttime))
	// consoleLog("RESULTS:", range_matches.length)
	return { word_matches: word_matches, range_matches: range_matches };
};

var termSearch = function termSearch(params, db) {
	return new Promise(function (resolve, reject) {
		var _Array$prototype;

		// let starttime = process.hrtime()
		// consoleLog("BENCHMARK: starting now", process.hrtime(starttime))
		var _queryForWids2 = _queryForWids({
			queryArray: params["query"],
			search_range: params["search_range"] || "clause",
			search_filter: params["search_filter"] || []
		}),
		    word_matches = _queryForWids2.word_matches,
		    range_matches = _queryForWids2.range_matches;

		var words_in_matching_ranges_set = new Set(range_matches.reduce(function (c, m) {
			return c.concat.apply(c, _toConsumableArray(_range_node_data2.default[m]["wids"]));
		}, []));
		// consoleLog("BENCHMARK: getting matching word sets", process.hrtime(starttime))
		var actual_matching_words_set = new Set((0, _util.arrayIntersect)((_Array$prototype = Array.prototype).concat.apply(_Array$prototype, _toConsumableArray(word_matches)), words_in_matching_ranges_set));

		// consoleLog("BENCHMARK: now formulating final data", process.hrtime(starttime))
		var ridmatches = range_matches.reduce(function (c, n) {
			return c.concat.apply(c, _toConsumableArray(_range_node_data2.default[n]["rids"]));
		}, []);
		(0, _chapterText.ridlistText)(ridmatches, new Set(["wlc", "net"]), db).then(function (ridMatchText) {
			Object.keys(ridMatchText).forEach(function (rid) {
				ridMatchText[rid]["wlc"] = heatUpVerseWords(ridMatchText[rid]["wlc"], actual_matching_words_set, words_in_matching_ranges_set);
			});
			// consoleLog("BENCHMARK: results now being processed", process.hrtime(starttime))
			var match_result_data = range_matches.map(function (m) {
				var ridTextObject = {};
				_range_node_data2.default[m]["rids"].forEach(function (rid) {
					ridTextObject[rid] = ridMatchText[rid];
				});
				return {
					"node": m,
					"verses": _range_node_data2.default[m]["rids"],
					"text": ridTextObject
				};
			});

			var response = {
				"length": match_result_data.length,
				"results": match_result_data
			};
			resolve(response);
			// consoleLog("BENCHMARK: done", process.hrtime(starttime))
		}).catch();
	});
};

var collocationSearch = function collocationSearch(params) {
	var grouping_key = "voc_utf8";
	return new Promise(function (resolve, reject) {
		var _queryForWids3 = _queryForWids({
			queryArray: params["query"],
			search_range: params["search_range"]
		}),
		    word_matches = _queryForWids3.word_matches;
		// params["whitelist"] == ["Verb"]


		var word_match_morph = word_matches.map(function (wid) {
			return _word_data_map2.default[wid][grouping_key];
		});
		var tally_match_data = word_match_morph.reduce(function (c, k) {
			if (!c.hasOwnProperty(k)) c[k] = 0;
			c[k]++;
			return c;
		}, {});

		var response = {
			"length": Object.keys(tally_match_data).length,
			"results": tally_match_data
		};
		resolve(response);
	});
};

exports.termSearch = termSearch;
exports.collocationSearch = collocationSearch;
exports._wordsThatMatchQuery = _wordsThatMatchQuery;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvdGVybS1zZWFyY2guanMiXSwibmFtZXMiOlsiZG9Mb2ciLCJjb25zb2xlTG9nIiwibG9nIiwiaGVhdFVwVmVyc2VXb3JkcyIsInZlcnNlX3dvcmRzIiwiaG90X3NldCIsImx1a2V3YXJtX3NldCIsIm1hcCIsImFjY2VudFVuaXQiLCJoYXMiLCJ3IiwiX2RvRmlsdGVyIiwiZmlsdGVyIiwid29yZE5vZGVzIiwiY2hhcHRlckZpbHRlciIsImxlbmd0aCIsImNoYXB0ZXJPZmZzZXQiLCJyaWRGaWx0ZXIiLCJmIiwiZXh0ZW50IiwicmlkIiwidmVyc2UiLCJyZWR1Y2UiLCJhIiwidiIsIl93b3Jkc1RoYXRNYXRjaFF1ZXJ5IiwicXVlcnkiLCJxdWVyeV9tYXRjaGVzIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrIiwibm9ybWFsaXplIiwicHVzaCIsIl9xdWVyeUZvcldpZHMiLCJxdWVyeUFycmF5Iiwic2VhcmNoX3JhbmdlIiwic2VhcmNoX2ZpbHRlciIsIndvcmRfbWF0Y2hlcyIsImV4Y2x1c2lvbnMiLCJjdXJyZW50X21hdGNoIiwiZGF0YSIsImludmVydCIsInNyX21hdGNoZXMiLCJtIiwibiIsInNyX2V4Y2x1c2lvbnMiLCJtYXRjaF9pbnRlcnNlY3Rpb24iLCJyYW5nZV9tYXRjaGVzIiwidGVybVNlYXJjaCIsInBhcmFtcyIsImRiIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ3b3Jkc19pbl9tYXRjaGluZ19yYW5nZXNfc2V0IiwiU2V0IiwiYyIsImNvbmNhdCIsImFjdHVhbF9tYXRjaGluZ193b3Jkc19zZXQiLCJwcm90b3R5cGUiLCJyaWRtYXRjaGVzIiwidGhlbiIsInJpZE1hdGNoVGV4dCIsIm1hdGNoX3Jlc3VsdF9kYXRhIiwicmlkVGV4dE9iamVjdCIsInJlc3BvbnNlIiwiY2F0Y2giLCJjb2xsb2NhdGlvblNlYXJjaCIsImdyb3VwaW5nX2tleSIsIndvcmRfbWF0Y2hfbW9ycGgiLCJ3aWQiLCJ0YWxs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QW5CTSxDQUFQO0FBb0JBLENBdEJEOztRQXdCU2pCLFUsR0FBQUEsVTtRQUFZbUIsaUIsR0FBQUEsaUI7UUFBbUIzQyxvQixHQUFBQSxvQiIsImZpbGUiOiJ0ZXJtLXNlYXJjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFycmF5RGlmZiwgYXJyYXlJbnRlcnNlY3QgfSBmcm9tICcuLi91dGlsL3V0aWwnXG5pbXBvcnQgeyByaWRsaXN0VGV4dCB9IGZyb20gJy4vY2hhcHRlci10ZXh0J1xuXG5pbXBvcnQgd29yZF9kYXRhIGZyb20gJy4uLy4uL2RhdGEvd29yZF9kYXRhX21hcCdcbmltcG9ydCB0cmVlX2RhdGEgZnJvbSAnLi4vLi4vZGF0YS90cmVlX2RhdGEnXG5pbXBvcnQgcmFuZ2Vfbm9kZV9kYXRhIGZyb20gJy4uLy4uL2RhdGEvcmFuZ2Vfbm9kZV9kYXRhJ1xuaW1wb3J0IGJvb2tfbmFtZXMgZnJvbSAnLi4vLi4vZGF0YS9ib29rX25hbWVzJ1xuXG5jb25zdCBkb0xvZyA9IGZhbHNlXG5jb25zdCBjb25zb2xlTG9nID0gKC4uLmRlYnVnKSA9PiB7XG5cdGlmIChkb0xvZykge1xuXHRcdGNvbnNvbGUubG9nKC4uLmRlYnVnKVxuXHR9XG59XG5cbmNvbnN0IGhlYXRVcFZlcnNlV29yZHMgPSAodmVyc2Vfd29yZHMsIGhvdF9zZXQsIGx1a2V3YXJtX3NldCkgPT4ge1xuXHRyZXR1cm4gdmVyc2Vfd29yZHMubWFwKGFjY2VudFVuaXQgPT4gXG5cdFx0YWNjZW50VW5pdC5tYXAodyA9PiB7XG5cdFx0XHRpZiAoaG90X3NldC5oYXMod1tcIndpZFwiXSkpXG5cdFx0XHRcdHdbXCJ0ZW1wZXJhdHVyZVwiXSA9IDJcblx0XHRcdGVsc2UgaWYgKGx1a2V3YXJtX3NldC5oYXMod1tcIndpZFwiXSkpXG5cdFx0XHRcdHdbXCJ0ZW1wZXJhdHVyZVwiXSA9IDFcblx0XHRcdHJldHVybiB3XG5cdFx0fSlcblx0KVxufVxuXG5jb25zdCBfZG9GaWx0ZXIgPSAoZmlsdGVyLCB3b3JkTm9kZXMsIGNoYXB0ZXJGaWx0ZXI9MCkgPT4ge1xuXHRpZiAoZmlsdGVyLmxlbmd0aCA+IDApIHtcblx0XHRjb25zdCBjaGFwdGVyT2Zmc2V0ID0gY2hhcHRlckZpbHRlciAqIDEwMDBcblx0XHRjb25zdCByaWRGaWx0ZXIgPSBmaWx0ZXIubWFwKGYgPT4gYm9va19uYW1lc1tmXSAqIDEwMDAwMDAwICsgY2hhcHRlck9mZnNldClcblxuXHRcdGNvbnN0IGV4dGVudCA9IGNoYXB0ZXJGaWx0ZXIgPT09IDAgPyAxMDAwMDAwMCA6IDEwMDBcblx0XHRyZXR1cm4gd29yZE5vZGVzLmZpbHRlcih3ID0+IHtcblx0XHRcdGNvbnN0IHJpZCA9IHRyZWVfZGF0YVt3XS52ZXJzZVxuXHRcdFx0cmV0dXJuIHJpZEZpbHRlci5yZWR1Y2UoKGEsIHYpID0+IGEgfHwgdiA8PSByaWQgJiYgcmlkIDwgdiArIGV4dGVudCwgZmFsc2UpXG5cdFx0fSlcblx0fVxuXHRlbHNlIHtcblx0XHRyZXR1cm4gd29yZE5vZGVzXG5cdH1cbn1cbmNvbnN0IF93b3Jkc1RoYXRNYXRjaFF1ZXJ5ID0gKHF1ZXJ5LCBmaWx0ZXIsIGNoYXB0ZXJGaWx0ZXI9MCkgPT4ge1xuXHRsZXQgcXVlcnlfbWF0Y2hlcyA9IFtdXG5cdE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKChrKSA9PiB7XG5cdFx0Y29uc3QgdiA9IHF1ZXJ5W2tdLm5vcm1hbGl6ZSgpXG5cdFx0cXVlcnlfbWF0Y2hlcy5wdXNoKF9kb0ZpbHRlcihmaWx0ZXIsIHdvcmRfZGF0YVtrXVt2XSwgY2hhcHRlckZpbHRlcikpXG5cdH0pXG5cdHJldHVybiBhcnJheUludGVyc2VjdCguLi5xdWVyeV9tYXRjaGVzKVxufVxuY29uc3QgX3F1ZXJ5Rm9yV2lkcyA9ICh7cXVlcnlBcnJheSwgc2VhcmNoX3JhbmdlLCBzZWFyY2hfZmlsdGVyfSkgPT4ge1xuXHRsZXQgd29yZF9tYXRjaGVzID0gW11cblx0bGV0IGV4Y2x1c2lvbnMgPSBbXVxuXHRsZXQgY3VycmVudF9tYXRjaCA9IC0xXG5cdC8vIGxldCBzdGFydHRpbWUgPSBwcm9jZXNzLmhydGltZSgpXG5cdHF1ZXJ5QXJyYXkuZm9yRWFjaCgocXVlcnkpID0+IHtcblx0XHQvLyBjb25zb2xlTG9nKFwiQkVOQ0hNQVJLIFE6IGZvcmVhY2ggY3ljbGUgXCIsIHByb2Nlc3MuaHJ0aW1lKHN0YXJ0dGltZSkpXG5cdFx0Y29uc3QgcXVlcnlfbWF0Y2hlcyA9IF93b3Jkc1RoYXRNYXRjaFF1ZXJ5KHF1ZXJ5LmRhdGEsIHNlYXJjaF9maWx0ZXIpXG5cblx0XHRpZiAocXVlcnkuaW52ZXJ0KVxuXHRcdFx0ZXhjbHVzaW9ucy5wdXNoKC4uLnF1ZXJ5X21hdGNoZXMpXG5cdFx0ZWxzZVxuXHRcdFx0d29yZF9tYXRjaGVzLnB1c2gocXVlcnlfbWF0Y2hlcylcblx0fSlcblx0Ly8gY29uc29sZUxvZyhcIkJFTkNITUFSSyBROiBkb25lIHdpdGggZm9yZWFjaFwiLCBwcm9jZXNzLmhydGltZShzdGFydHRpbWUpKVxuXG5cdGNvbnN0IHNyX21hdGNoZXMgPSB3b3JkX21hdGNoZXMubWFwKG0gPT4gbS5tYXAobiA9PiB0cmVlX2RhdGFbbl1bc2VhcmNoX3JhbmdlXSkpXG5cdGNvbnN0IHNyX2V4Y2x1c2lvbnMgPSBleGNsdXNpb25zLm1hcChtID0+IHRyZWVfZGF0YVttXVtzZWFyY2hfcmFuZ2VdKVxuXHRjb25zdCBtYXRjaF9pbnRlcnNlY3Rpb24gPSBhcnJheUludGVyc2VjdCguLi5zcl9tYXRjaGVzKVxuXHRjb25zdCByYW5nZV9tYXRjaGVzID0gYXJyYXlEaWZmKG1hdGNoX2ludGVyc2VjdGlvbiwgc3JfZXhjbHVzaW9ucylcblx0Ly8gY29uc29sZUxvZyhcIkJFTkNITUFSSyBROiBkb25lIGludGVyc2VjdGluZ1wiLCBwcm9jZXNzLmhydGltZShzdGFydHRpbWUpKVxuXHQvLyBjb25zb2xlTG9nKFwiUkVTVUxUUzpcIiwgcmFuZ2VfbWF0Y2hlcy5sZW5ndGgpXG5cdHJldHVybiB7IHdvcmRfbWF0Y2hlcywgcmFuZ2VfbWF0Y2hlcyB9XG59XG5cbmNvbnN0IHRlcm1TZWFyY2ggPSAocGFyYW1zLCBkYik9PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Ly8gbGV0IHN0YXJ0dGltZSA9IHByb2Nlc3MuaHJ0aW1lKClcblx0XHQvLyBjb25zb2xlTG9nKFwiQkVOQ0hNQVJLOiBzdGFydGluZyBub3dcIiwgcHJvY2Vzcy5ocnRpbWUoc3RhcnR0aW1lKSlcblx0XHRjb25zdCB7IHdvcmRfbWF0Y2hlcywgcmFuZ2VfbWF0Y2hlcyB9ID0gX3F1ZXJ5Rm9yV2lkcyh7XG5cdFx0XHRxdWVyeUFycmF5OiBwYXJhbXNbXCJxdWVyeVwiXSxcblx0XHRcdHNlYXJjaF9yYW5nZTogcGFyYW1zW1wic2VhcmNoX3JhbmdlXCJdIHx8IFwiY2xhdXNlXCIsXG5cdFx0XHRzZWFyY2hfZmlsdGVyOiBwYXJhbXNbXCJzZWFyY2hfZmlsdGVyXCJdIHx8IFtdXG5cdFx0fSlcblx0XHRjb25zdCB3b3Jkc19pbl9tYXRjaGluZ19yYW5nZXNfc2V0ID0gbmV3IFNldChyYW5nZV9tYXRjaGVzLnJlZHVjZSgoYywgbSkgPT4gYy5jb25jYXQoLi4ucmFuZ2Vfbm9kZV9kYXRhW21dW1wid2lkc1wiXSksIFtdKSlcblx0XHQvLyBjb25zb2xlTG9nKFwiQkVOQ0hNQVJLOiBnZXR0aW5nIG1hdGNoaW5nIHdvcmQgc2V0c1wiLCBwcm9jZXNzLmhydGltZShzdGFydHRpbWUpKVxuXHRcdGNvbnN0IGFjdHVhbF9tYXRjaGluZ193b3Jkc19zZXQgPSBuZXcgU2V0KGFycmF5SW50ZXJzZWN0KEFycmF5LnByb3RvdHlwZS5jb25jYXQoLi4ud29yZF9tYXRjaGVzKSwgd29yZHNfaW5fbWF0Y2hpbmdfcmFuZ2VzX3NldCkpXG5cblx0XHQvLyBjb25zb2xlTG9nKFwiQkVOQ0hNQVJLOiBub3cgZm9ybXVsYXRpbmcgZmluYWwgZGF0YVwiLCBwcm9jZXNzLmhydGltZShzdGFydHRpbWUpKVxuXHRcdGNvbnN0IHJpZG1hdGNoZXMgPSByYW5nZV9tYXRjaGVzLnJlZHVjZSgoYywgbikgPT4gYy5jb25jYXQoLi4ucmFuZ2Vfbm9kZV9kYXRhW25dW1wicmlkc1wiXSksIFtdKVxuXHRcdHJpZGxpc3RUZXh0KHJpZG1hdGNoZXMsIG5ldyBTZXQoW1wid2xjXCIsIFwibmV0XCJdKSwgZGIpLnRoZW4oKHJpZE1hdGNoVGV4dCkgPT4ge1xuXHRcdFx0T2JqZWN0LmtleXMocmlkTWF0Y2hUZXh0KS5mb3JFYWNoKHJpZCA9PiB7XG5cdFx0XHRcdHJpZE1hdGNoVGV4dFtyaWRdW1wid2xjXCJdID0gaGVhdFVwVmVyc2VXb3Jkcyhcblx0XHRcdFx0XHRyaWRNYXRjaFRleHRbcmlkXVtcIndsY1wiXSxcblx0XHRcdFx0XHRhY3R1YWxfbWF0Y2hpbmdfd29yZHNfc2V0LFxuXHRcdFx0XHRcdHdvcmRzX2luX21hdGNoaW5nX3Jhbmdlc19zZXRcblx0XHRcdFx0KVxuXHRcdFx0fSlcblx0XHRcdC8vIGNvbnNvbGVMb2coXCJCRU5DSE1BUks6IHJlc3VsdHMgbm93IGJlaW5nIHByb2Nlc3NlZFwiLCBwcm9jZXNzLmhydGltZShzdGFydHRpbWUpKVxuXHRcdFx0Y29uc3QgbWF0Y2hfcmVzdWx0X2RhdGEgPSByYW5nZV9tYXRjaGVzLm1hcCgobSkgPT4ge1xuXHRcdFx0XHRjb25zdCByaWRUZXh0T2JqZWN0ID0ge31cblx0XHRcdFx0cmFuZ2Vfbm9kZV9kYXRhW21dW1wicmlkc1wiXS5mb3JFYWNoKHJpZCA9PiB7XG5cdFx0XHRcdFx0cmlkVGV4dE9iamVjdFtyaWRdID0gcmlkTWF0Y2hUZXh0W3JpZF1cblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcIm5vZGVcIjogbSxcblx0XHRcdFx0XHRcInZlcnNlc1wiOiByYW5nZV9ub2RlX2RhdGFbbV1bXCJyaWRzXCJdLFxuXHRcdFx0XHRcdFwidGV4dFwiOiByaWRUZXh0T2JqZWN0XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlID0ge1xuXHRcdFx0XHRcImxlbmd0aFwiOiBtYXRjaF9yZXN1bHRfZGF0YS5sZW5ndGgsXG5cdFx0XHRcdFwicmVzdWx0c1wiOiBtYXRjaF9yZXN1bHRfZGF0YVxuXHRcdFx0fVxuXHRcdFx0cmVzb2x2ZShyZXNwb25zZSlcblx0XHRcdC8vIGNvbnNvbGVMb2coXCJCRU5DSE1BUks6IGRvbmVcIiwgcHJvY2Vzcy5ocnRpbWUoc3RhcnR0aW1lKSlcblx0XHR9KS5jYXRjaCgpXG5cdH0pXG59XG5cbmNvbnN0IGNvbGxvY2F0aW9uU2VhcmNoID0gKHBhcmFtcyk9PiB7XG5cdGNvbnN0IGdyb3VwaW5nX2tleSA9IFwidm9jX3V0ZjhcIlxuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IHsgd29yZF9tYXRjaGVzIH0gPSBfcXVlcnlGb3JXaWRzKHtcblx0XHRcdHF1ZXJ5QXJyYXk6IHBhcmFtc1tcInF1ZXJ5XCJdLFxuXHRcdFx0c2VhcmNoX3JhbmdlOiBwYXJhbXNbXCJzZWFyY2hfcmFuZ2VcIl1cblx0XHR9KVxuXHRcdC8vIHBhcmFtc1tcIndoaXRlbGlzdFwiXSA9PSBbXCJWZXJiXCJdXG5cdFx0Y29uc3Qgd29yZF9tYXRjaF9tb3JwaD0gd29yZF9tYXRjaGVzLm1hcCh3aWQgPT4gd29yZF9kYXRhW3dpZF1bZ3JvdXBpbmdfa2V5XSlcblx0XHRjb25zdCB0YWxseV9tYXRjaF9kYXRhID0gd29yZF9tYXRjaF9tb3JwaC5yZWR1Y2UoKGMsIGspID0+IHtcblx0XHRcdGlmICghYy5oYXNPd25Qcm9wZXJ0eShrKSlcblx0XHRcdFx0Y1trXSA9IDBcblx0XHRcdGNba10rK1xuXHRcdFx0cmV0dXJuIGNcblx0XHR9LCB7fSlcblxuXHRcdGNvbnN0IHJlc3BvbnNlID0ge1xuXHRcdFx0XCJsZW5ndGhcIjogT2JqZWN0LmtleXModGFsbHlfbWF0Y2hfZGF0YSkubGVuZ3RoLFxuXHRcdFx0XCJyZXN1bHRzXCI6IHRhbGx5X21hdGNoX2RhdGFcblx0XHR9XG5cdFx0cmVzb2x2ZShyZXNwb25zZSlcblx0fSlcbn1cblxuZXhwb3J0IHsgdGVybVNlYXJjaCwgY29sbG9jYXRpb25TZWFyY2gsIF93b3Jkc1RoYXRNYXRjaFF1ZXJ5IH0iXX0=