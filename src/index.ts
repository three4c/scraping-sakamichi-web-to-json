import express from "express";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

interface ScheduleType {
  href: string;
  category: string;
  time: string;
  text: string;
}

const scraping = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--lang=ja"],
  });

  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  /** ログ */
  // page.on("console", (msg) => {
  //   for (let i = 0; i < msg.args().length; ++i) {
  //     console.log(`${i}: ${msg.args()[i]}`);
  //   }
  // });

  await page.waitForTimeout(1000);

  const result = await page.$$eval(".sc--lists .sc--day", (element) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    return element.map((item) => {
      const date = `${year}-${month}-${item
        .querySelector(".sc--day__hd")
        ?.getAttribute("id")}`;

      const schedule: ScheduleType[] = [];
      item.querySelectorAll(".m--scone").forEach((item) => {
        schedule.push({
          href: item.querySelector(".m--scone__a")?.getAttribute("href") || "",
          category:
            item.querySelector(".m--scone__cat__name")?.textContent || "",
          time: item.querySelector(".m--scone__start")?.textContent || "",
          text: item.querySelector(".m--scone__ttl")?.textContent || "",
        });
      });

      return {
        date,
        schedule,
      };
    });
  });

  await browser.close();
  return result;
};

const main = async () => {
  const result = await scraping("https://www.nogizaka46.com/s/n46/media/list");
  console.log("result", JSON.stringify(result));
};

main();

app.get("/", (req, res) => res.json("Success Deploy"));
app.listen(PORT);
console.log(`Server running at ${PORT}`);
