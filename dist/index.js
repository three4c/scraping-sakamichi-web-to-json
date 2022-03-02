"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const scraping = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({
        headless: false,
        args: ["--lang=ja"],
    });
    const page = yield browser.newPage();
    yield page.goto("https://www.nogizaka46.com/s/n46/media/list", {
        waitUntil: "networkidle0",
    });
    /** ログ */
    page.on("console", (msg) => {
        for (let i = 0; i < msg.args().length; ++i) {
            console.log(`${i}: ${msg.args()[i]}`);
        }
    });
    yield page.waitForTimeout(1000);
    const data = yield page.$$eval(".sc--lists .sc--day .m--scone", (list) => {
        return list.map((item) => {
            var _a, _b, _c, _d;
            return ({
                href: (_a = item.querySelector(".m--scone__a")) === null || _a === void 0 ? void 0 : _a.getAttribute("href"),
                category: (_b = item.querySelector(".m--scone__cat__name")) === null || _b === void 0 ? void 0 : _b.textContent,
                start: (_c = item.querySelector(".m--scone__start")) === null || _c === void 0 ? void 0 : _c.textContent,
                title: (_d = item.querySelector(".m--scone__ttl")) === null || _d === void 0 ? void 0 : _d.textContent,
            });
        });
    });
    console.log(data);
    yield browser.close();
});
scraping();
app.get("/", (req, res) => res.send("hoge"));
app.listen(PORT);
console.log(`Server running at ${PORT}`);
