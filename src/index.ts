import puppeteer from "puppeteer";
import fs from "fs";

type SakamichiType = "n_schedule" | "n_member" | "h_schedule";

interface ScrapingInfoType {
  key: SakamichiType;
  url: string;
  fn: (page: puppeteer.Page) => Promise<FieldType[] | MemberType[]>;
}

interface FieldType {
  date: string;
  schedule: ScheduleType[];
}

interface ScheduleType {
  href: string;
  category: string;
  time: string;
  text: string;
}

interface MemberType {
  href: string;
  name: string;
  src: string;
}

/** 乃木坂 */
const getNogizakaSchedule = async (page: puppeteer.Page) => {
  await page.click(".b--lng");
  await page.waitForTimeout(1000);
  await page.click(".b--lng__one.js-lang-swich.hv--op.ja");
  await page.waitForTimeout(1000);

  return page.$$eval(".sc--lists .sc--day", (element) => {
    const today = new Date(
      Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
    );
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
};

/** getNogizakaScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
const getMember = async (page: puppeteer.Page) =>
  page.$$eval(".m--mem", (element) => {
    const member: MemberType[] = [];
    element.forEach((item) => {
      member.push({
        href: item.querySelector(".m--mem__in")?.getAttribute("href") || "",
        name: (item.querySelector(".m--mem__name")?.textContent || "").replace(
          /\s+/g,
          ""
        ),
        src:
          item
            .querySelector<HTMLElement>(".m--bg")
            ?.style.backgroundImage.slice(4, -1)
            .replace(/"/g, "") || "",
      });
    });

    return member;
  });

/** 日向坂 */
const getHinatazakaSchedule = (page: puppeteer.Page) =>
  page.$$eval(".p-schedule__list-group", (element) => {
    const today = new Date(
      Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
    );
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const convertText = (text: string) => text.trim().replace(/\n/g, "");

    return element.map((item) => {
      const date = `${year}-${month}-${
        item.querySelector(".c-schedule__date--list span")?.textContent
      }`;

      const schedule: ScheduleType[] = [];
      item.querySelectorAll(".p-schedule__item a").forEach((item) => {
        schedule.push({
          href:
            `https://www.hinatazaka46.com${item.getAttribute("href")}` || "",
          category: convertText(
            item.querySelector(".c-schedule__category")?.textContent || ""
          ),
          time: convertText(
            item.querySelector(".c-schedule__time--list")?.textContent || ""
          ),
          text: convertText(
            item.querySelector(".c-schedule__text")?.textContent || ""
          ),
        });
      });

      return {
        date,
        schedule,
      };
    });
  });

/** スクレイピング */
const scraping = async (scrapingInfo: ScrapingInfoType[]) => {
  const browser = await puppeteer.launch({
    args: ["--lang=ja"],
    /** DEBUG */
    // headless: false,
    // slowMo: 100,
  });

  const page = await browser.newPage();

  /** DEBUG */
  // page.on('console', msg => {
  //   for (let i = 0; i < msg.args().length; ++i)
  //     console.log(`${i}: ${msg.args()[i]}`);
  // });

  await page.setViewport({ width: 320, height: 640 });

  const result: { [key in SakamichiType]: FieldType[] | MemberType[] } = {
    n_schedule: [],
    n_member: [],
    h_schedule: [],
  };

  for (const item of scrapingInfo) {
    await page.goto(item.url, {
      waitUntil: "networkidle0",
    });
    await page.waitForTimeout(1000);
    result[item.key] = await item.fn(page);
    /** Github Actionsのデバッグ用 */
    await page.screenshot({
      path: `./screenshot/${item.key}.jpeg`,
      type: "jpeg",
    });
  }

  await browser.close();
  return result;
};

const main = async () => {
  const today = new Date(
    Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
  );
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const dyParameter = `${year}${`00${month}`.slice(-2)}`;

  const scrapingInfo: ScrapingInfoType[] = [
    {
      key: "n_schedule",
      url: `https://www.nogizaka46.com/s/n46/media/list?dy=${dyParameter}`,
      fn: getNogizakaSchedule,
    },
    {
      key: "n_member",
      url: "https://www.nogizaka46.com/s/n46/search/artist",
      fn: getMember,
    },
    {
      key: "h_schedule",
      url: `https://www.hinatazaka46.com/s/official/media/list?dy=${dyParameter}`,
      fn: getHinatazakaSchedule,
    },
  ];

  console.log("Scraping Info", scrapingInfo);
  console.log("Scraping start");
  const field = await scraping(scrapingInfo);
  const obj = {
    nogizaka: {
      schedule: field.n_schedule,
      member: field.n_member,
    },
    hinatazaka: {
      schedule: field.h_schedule,
    },
  };
  console.log("Scraping end");
  console.log("WriteFileSync start");
  // console.log(JSON.stringify(obj));
  fs.writeFileSync("./schedule.json", JSON.stringify(obj));
  console.log("WriteFileSync end");
};

main();
