"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var fs_1 = require("fs");
var lib_1 = require("lib");
var puppeteer_1 = require("puppeteer");
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, year, month, dyParameter, scrapingInfo, field, obj;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = (0, lib_1.getToday)(), year = _a.year, month = _a.month;
                dyParameter = "".concat(year).concat(month);
                scrapingInfo = [
                    {
                        key: 'n_schedule',
                        url: "https://www.nogizaka46.com/s/n46/media/list?dy=".concat(dyParameter),
                        fn: n_getSchedule
                    },
                    {
                        key: 'n_member',
                        url: 'https://www.nogizaka46.com/s/n46/search/artist',
                        fn: n_getMember
                    },
                    {
                        key: 'h_schedule',
                        url: "https://www.hinatazaka46.com/s/official/media/list?dy=".concat(dyParameter),
                        fn: h_getSchedule
                    },
                    {
                        key: 'h_member',
                        url: 'https://www.hinatazaka46.com/s/official/search/artist',
                        fn: h_getMember
                    },
                ];
                console.log('Start');
                return [4 /*yield*/, scraping(scrapingInfo)];
            case 1:
                field = _b.sent();
                obj = [
                    {
                        name: '乃木坂46',
                        color: 'purple',
                        schedule: field.n_schedule,
                        member: field.n_member
                    },
                    {
                        name: '日向坂46',
                        color: 'blue',
                        schedule: field.h_schedule,
                        member: field.h_member
                    },
                ];
                fs_1["default"].writeFileSync('./schedule.json', JSON.stringify(obj));
                console.log('End');
                return [2 /*return*/];
        }
    });
}); };
/** スクレイピング */
var scraping = function (scrapingInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var browser, page, result, _i, scrapingInfo_1, item, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, puppeteer_1["default"].launch({
                    headless: true,
                    slowMo: 0
                })];
            case 1:
                browser = _c.sent();
                return [4 /*yield*/, browser.newPage()];
            case 2:
                page = _c.sent();
                result = {
                    n_schedule: [],
                    n_member: [],
                    h_schedule: [],
                    h_member: [],
                    h_article: []
                };
                return [4 /*yield*/, page.exposeFunction('getToday', lib_1.getToday)];
            case 3:
                _c.sent();
                return [4 /*yield*/, page.setViewport({ width: 320, height: 640 })];
            case 4:
                _c.sent();
                _i = 0, scrapingInfo_1 = scrapingInfo;
                _c.label = 5;
            case 5:
                if (!(_i < scrapingInfo_1.length)) return [3 /*break*/, 10];
                item = scrapingInfo_1[_i];
                return [4 /*yield*/, page.goto(item.url)];
            case 6:
                _c.sent();
                return [4 /*yield*/, page.waitForTimeout(1000)];
            case 7:
                _c.sent();
                _a = result;
                _b = item.key;
                return [4 /*yield*/, item.fn(page)];
            case 8:
                _a[_b] = _c.sent();
                _c.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 5];
            case 10: return [4 /*yield*/, browser.close()];
            case 11:
                _c.sent();
                return [2 /*return*/, result];
        }
    });
}); };
/** 乃木坂 */
var n_getSchedule = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    var date, _loop_1, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, page.click('.b--lng')];
            case 1:
                _a.sent();
                return [4 /*yield*/, page.waitForTimeout(1000)];
            case 2:
                _a.sent();
                return [4 /*yield*/, page.click('.b--lng__one.js-lang-swich.hv--op.ja')];
            case 3:
                _a.sent();
                return [4 /*yield*/, page.waitForTimeout(1000)];
            case 4:
                _a.sent();
                return [4 /*yield*/, page.$$eval('.sc--lists .sc--day', function (element) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a, year, month, day, convertTime;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, window.getToday()];
                                case 1:
                                    _a = _b.sent(), year = _a.year, month = _a.month, day = _a.day;
                                    convertTime = function (time) {
                                        var matchText = time.match(/([0-9]|1[0-9]|2[0-9]):[0-5][0-9]/g);
                                        return matchText ? matchText.map(function (item) { return "0".concat(item).slice(-5); }) : undefined;
                                    };
                                    return [2 /*return*/, element
                                            .filter(function (item) { var _a; return Math.abs(Number((_a = item.querySelector('.sc--day__hd')) === null || _a === void 0 ? void 0 : _a.getAttribute('id')) - day) < 2; })
                                            .map(function (item) {
                                            var _a;
                                            var id = ((_a = item.querySelector('.sc--day__hd')) === null || _a === void 0 ? void 0 : _a.getAttribute('id')) || undefined;
                                            var date = id ? "".concat(year, "-").concat(month, "-").concat(id) : '';
                                            var schedule = Array.from(item.querySelectorAll('.m--scone')).map(function (elementItem) {
                                                var _a, _b, _c, _d;
                                                var time = convertTime(((_a = elementItem.querySelector('.m--scone__start')) === null || _a === void 0 ? void 0 : _a.textContent) || '');
                                                return {
                                                    href: ((_b = elementItem.querySelector('.m--scone__a')) === null || _b === void 0 ? void 0 : _b.getAttribute('href')) || '',
                                                    category: ((_c = elementItem.querySelector('.m--scone__cat__name')) === null || _c === void 0 ? void 0 : _c.textContent) || '',
                                                    startTime: time ? time[0] : undefined,
                                                    endTime: time ? time[1] : undefined,
                                                    text: ((_d = elementItem.querySelector('.m--scone__ttl')) === null || _d === void 0 ? void 0 : _d.textContent) || ''
                                                };
                                            });
                                            return {
                                                date: date,
                                                schedule: schedule
                                            };
                                        })];
                            }
                        });
                    }); })];
            case 5:
                date = _a.sent();
                date = date.map(function (item) { return (__assign(__assign({}, item), { schedule: item.schedule.map(function (scheduleItem) {
                        var bracketsIndex = scheduleItem.text.lastIndexOf('」');
                        var bracketsOutlineIndex = scheduleItem.text.lastIndexOf('』');
                        var index = (bracketsIndex < bracketsOutlineIndex ? bracketsOutlineIndex : bracketsIndex) + 1;
                        var text = index === 0 ? (0, lib_1.convertText)(scheduleItem.text) : scheduleItem.text.slice(0, index);
                        var member = index !== scheduleItem.text.length
                            ? scheduleItem.text
                                .slice(index, scheduleItem.text.length)
                                .split('、')
                                .map(function (nameItem) { return ({
                                name: (0, lib_1.convertText)(nameItem)
                            }); })
                            : undefined;
                        return __assign(__assign({}, scheduleItem), { text: text, member: member });
                    }) })); });
                _loop_1 = function (i) {
                    var overTimeSchedule = date[i].schedule
                        .filter(function (item) {
                        return Boolean(item.startTime && Number(item.startTime.split(':')[0]) >= 24);
                    })
                        .map(function (item) {
                        var _a, _b;
                        var startTime = (_a = item.startTime) === null || _a === void 0 ? void 0 : _a.split(':');
                        var endTime = (_b = item.endTime) === null || _b === void 0 ? void 0 : _b.split(':');
                        return __assign(__assign({}, item), { startTime: "0".concat(Number(startTime[0]) - 24, ":").concat(startTime[1]).slice(-5), endTime: endTime ? "".concat(Number(endTime[0]) - 24, ":").concat(endTime[1]) : undefined });
                    });
                    var _loop_2 = function (j) {
                        date[i].schedule = date[i].schedule.filter(function (item) { return item.text !== overTimeSchedule[j].text; });
                    };
                    for (var j = 0; j < overTimeSchedule.length; j++) {
                        _loop_2(j);
                    }
                    if (i + 1 < date.length) {
                        date[i + 1].schedule = __spreadArray(__spreadArray([], date[i + 1].schedule, true), overTimeSchedule, true);
                    }
                };
                for (i = 0; i < date.length; i++) {
                    _loop_1(i);
                }
                return [2 /*return*/, date];
        }
    });
}); };
/** n_getScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
var n_getMember = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, page.$$eval('.m--mem', function (element) {
                var convertText = function (text) { return text.trim().replace(/\n|\s+/g, ''); };
                return element
                    .filter(function (item) { var _a; return (_a = item.querySelector('.m--mem__name')) === null || _a === void 0 ? void 0 : _a.textContent; })
                    .map(function (item) {
                    var _a, _b, _c, _d;
                    return ({
                        href: ((_a = item.querySelector('.m--mem__in')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) || '',
                        name: convertText(((_b = item.querySelector('.m--mem__name')) === null || _b === void 0 ? void 0 : _b.textContent) || ''),
                        hiragana: convertText(((_c = item.querySelector('.m--mem__kn')) === null || _c === void 0 ? void 0 : _c.textContent) || ''),
                        src: ((_d = item.querySelector('.m--bg')) === null || _d === void 0 ? void 0 : _d.style.backgroundImage.slice(4, -1).replace(/"/g, '')) || ''
                    });
                });
            })];
    });
}); };
/** 日向坂 */
var h_getSchedule = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    var date, i, j, member, _loop_3, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, page.$$eval('.p-schedule__list-group', function (element) { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, year, month, day, convertText, convertTime;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, window.getToday()];
                            case 1:
                                _a = _b.sent(), year = _a.year, month = _a.month, day = _a.day;
                                convertText = function (text) { return text.trim().replace(/\n|\s+/g, ''); };
                                convertTime = function (time) {
                                    var matchText = time.match(/([0-9]|1[0-9]|2[0-9]):[0-5][0-9]/g);
                                    return matchText ? matchText.map(function (item) { return "0".concat(item).slice(-5); }) : undefined;
                                };
                                return [2 /*return*/, element
                                        .filter(function (item) { var _a; return Math.abs(Number((_a = item.querySelector('.c-schedule__date--list span')) === null || _a === void 0 ? void 0 : _a.textContent) - day) < 2; })
                                        .map(function (item) {
                                        var _a;
                                        var id = ((_a = item.querySelector('.c-schedule__date--list span')) === null || _a === void 0 ? void 0 : _a.textContent) || undefined;
                                        var date = id ? "".concat(year, "-").concat(month, "-").concat(id) : '';
                                        var schedule = Array.from(item.querySelectorAll('.p-schedule__item a')).map(function (elementItem) {
                                            var _a, _b, _c;
                                            var href = elementItem.getAttribute('href');
                                            var time = convertTime(convertText(((_a = elementItem.querySelector('.c-schedule__time--list')) === null || _a === void 0 ? void 0 : _a.textContent) || ''));
                                            return {
                                                href: href ? "https://www.hinatazaka46.com".concat(href) : '',
                                                category: convertText(((_b = elementItem.querySelector('.c-schedule__category')) === null || _b === void 0 ? void 0 : _b.textContent) || ''),
                                                startTime: time ? time[0] : undefined,
                                                endTime: time ? time[1] : undefined,
                                                text: convertText(((_c = elementItem.querySelector('.c-schedule__text')) === null || _c === void 0 ? void 0 : _c.textContent) || '')
                                            };
                                        });
                                        return {
                                            date: date,
                                            schedule: schedule
                                        };
                                    })];
                        }
                    });
                }); })];
            case 1:
                date = _a.sent();
                i = 0;
                _a.label = 2;
            case 2:
                if (!(i < date.length)) return [3 /*break*/, 9];
                j = 0;
                _a.label = 3;
            case 3:
                if (!(j < date[i].schedule.length)) return [3 /*break*/, 8];
                return [4 /*yield*/, page.goto(date[i].schedule[j].href)];
            case 4:
                _a.sent();
                return [4 /*yield*/, page.$$eval('.c-article__tag a', function (element) {
                        var convertText = function (text) { return text.trim().replace(/\n|\s+/g, ''); };
                        return element.map(function (item) { return ({
                            name: convertText(item.textContent || '')
                        }); });
                    })];
            case 5:
                member = _a.sent();
                date[i].schedule[j].member = member.length ? member : undefined;
                return [4 /*yield*/, page.waitForTimeout(1000)];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                j++;
                return [3 /*break*/, 3];
            case 8:
                i++;
                return [3 /*break*/, 2];
            case 9:
                _loop_3 = function (i) {
                    var overTimeSchedule = date[i].schedule
                        .filter(function (item) {
                        return Boolean(item.startTime && Number(item.startTime.split(':')[0]) >= 24);
                    })
                        .map(function (item) {
                        var _a, _b;
                        var startTime = (_a = item.startTime) === null || _a === void 0 ? void 0 : _a.split(':');
                        var endTime = (_b = item.endTime) === null || _b === void 0 ? void 0 : _b.split(':');
                        return __assign(__assign({}, item), { startTime: "0".concat(Number(startTime[0]) - 24, ":").concat(startTime[1]).slice(-5), endTime: endTime ? "".concat(Number(endTime[0]) - 24, ":").concat(endTime[1]) : undefined });
                    });
                    var _loop_4 = function (j) {
                        date[i].schedule = date[i].schedule.filter(function (item) { return item.text !== overTimeSchedule[j].text; });
                    };
                    for (var j = 0; j < overTimeSchedule.length; j++) {
                        _loop_4(j);
                    }
                    if (i + 1 < date.length) {
                        date[i + 1].schedule = __spreadArray(__spreadArray([], date[i + 1].schedule, true), overTimeSchedule, true);
                    }
                };
                for (i = 0; i < date.length; i++) {
                    _loop_3(i);
                }
                return [2 /*return*/, date];
        }
    });
}); };
var h_getMember = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, page.$$eval('.sorted.sort-default .p-member__item', function (element) {
                var convertText = function (text) { return text.trim().replace(/\n|\s+/g, ''); };
                return element
                    .filter(function (item) { var _a; return (_a = item.querySelector('.c-member__name')) === null || _a === void 0 ? void 0 : _a.textContent; })
                    .map(function (item) {
                    var _a, _b, _c, _d;
                    var href = (_a = item.querySelector('a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href');
                    return {
                        href: href ? "https://www.hinatazaka46.com".concat(href) : '',
                        name: convertText(((_b = item.querySelector('.c-member__name')) === null || _b === void 0 ? void 0 : _b.textContent) || ''),
                        hiragana: convertText(((_c = item.querySelector('.c-member__kana')) === null || _c === void 0 ? void 0 : _c.textContent) || ''),
                        src: ((_d = item.querySelector('img')) === null || _d === void 0 ? void 0 : _d.getAttribute('src')) || ''
                    };
                });
            })];
    });
}); };
main();
