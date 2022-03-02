import express from "express";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const scraping = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--lang=ja"],
  });
  const page = await browser.newPage();

  await page.goto("https://www.nogizaka46.com/s/n46/media/list", {
    waitUntil: "networkidle0",
  });

  /** ログ */
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i) {
      console.log(`${i}: ${msg.args()[i]}`);
    }
  });

  await page.waitForTimeout(1000);

  const data = await page.$$eval(".sc--lists .sc--day .m--scone", (list) => {
    return list.map((item) => ({
      href: item.querySelector(".m--scone__a")?.getAttribute("href"),
      category: item.querySelector(".m--scone__cat__name")?.textContent,
      start: item.querySelector(".m--scone__start")?.textContent,
      title: item.querySelector(".m--scone__ttl")?.textContent,
    }));
  });

  console.log(data);

  await browser.close();
};

scraping();

app.get("/", (req, res) => res.send("hoge"));
app.listen(PORT);
console.log(`Server running at ${PORT}`);
