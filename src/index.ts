import puppeteer from "puppeteer";
import fs from "fs";
import {
  GroupType,
  ScrapingInfoType,
  FieldType,
  ScheduleType,
  MemberType,
} from "types";

/** 乃木坂 */
const n_getSchedule = async (page: puppeteer.Page) => {
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
    const day = today.getDate();

    return element
      .map((item) => {
        const id =
          item.querySelector(".sc--day__hd")?.getAttribute("id") || undefined;

        const isTargetElement = id
          ? -1 <= Number(id) - day && Number(id) - day <= 1
          : false;

        if (isTargetElement) {
          const date = id ? `${year}-${month}-${id}` : "";
          const schedule: ScheduleType[] = [];

          item.querySelectorAll(".m--scone").forEach((elementItem) => {
            schedule.push({
              href:
                elementItem
                  .querySelector(".m--scone__a")
                  ?.getAttribute("href") || "",
              category:
                elementItem.querySelector(".m--scone__cat__name")
                  ?.textContent || "",
              time:
                elementItem.querySelector(".m--scone__start")?.textContent ||
                "",
              text:
                elementItem.querySelector(".m--scone__ttl")?.textContent || "",
            });
          });

          return {
            date,
            schedule,
          };
        }
      })
      .filter(
        (item): item is Exclude<typeof item, undefined> => item !== undefined
      );
  });
};

/** n_getScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
const n_getMember = async (page: puppeteer.Page) =>
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
const h_getSchedule = (page: puppeteer.Page) =>
  page.$$eval(".p-schedule__list-group", (element) => {
    const today = new Date(
      Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
    );
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const convertText = (text: string) => text.trim().replace(/\n/g, "");

    return element
      .map((item) => {
        const id =
          item.querySelector(".c-schedule__date--list span")?.textContent ||
          undefined;

        const isTargetElement = id
          ? -1 <= Number(id) - day && Number(id) - day <= 1
          : false;

        const date = id ? `${year}-${month}-${id}` : "";

        const schedule: ScheduleType[] = [];

        if (isTargetElement) {
          item
            .querySelectorAll(".p-schedule__item a")
            .forEach((elementItem) => {
              const href = elementItem.getAttribute("href");

              schedule.push({
                href: href ? `https://www.hinatazaka46.com${href}` : "",
                category: convertText(
                  elementItem.querySelector(".c-schedule__category")
                    ?.textContent || ""
                ),
                time: convertText(
                  elementItem.querySelector(".c-schedule__time--list")
                    ?.textContent || ""
                ),
                text: convertText(
                  elementItem.querySelector(".c-schedule__text")?.textContent ||
                    ""
                ),
              });
            });

          return {
            date,
            schedule,
          };
        }
      })
      .filter(
        (item): item is Exclude<typeof item, undefined> => item !== undefined
      );
  });

const h_getMember = async (page: puppeteer.Page) =>
  page.$$eval(".sorted.sort-default .p-member__item", (element) => {
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, "");
    const member: MemberType[] = [];

    element.forEach((item) => {
      const href = item.querySelector("a")?.getAttribute("href");

      member.push({
        href: href ? `https://www.hinatazaka46.com${href}` : "",
        name: convertText(
          item.querySelector(".c-member__name")?.textContent || ""
        ),
        src: item.querySelector("img")?.getAttribute("src") || "",
      });
    });

    return member;
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
  // page.on("console", (msg) => {
  //   for (let i = 0; i < msg.args().length; ++i)
  //     console.log(`${i}: ${msg.args()[i]}`);
  // });

  await page.setViewport({ width: 320, height: 640 });

  const result: { [key in GroupType]: FieldType[] | MemberType[] } = {
    n_schedule: [],
    n_member: [],
    h_schedule: [],
    h_member: [],
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

const h_article = async () => {};

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
      fn: n_getSchedule,
    },
    {
      key: "n_member",
      url: "https://www.nogizaka46.com/s/n46/search/artist",
      fn: n_getMember,
    },
    {
      key: "h_schedule",
      url: `https://www.hinatazaka46.com/s/official/media/list?dy=${dyParameter}`,
      fn: h_getSchedule,
    },
    {
      key: "h_member",
      url: "https://www.hinatazaka46.com/s/official/search/artist",
      fn: h_getMember,
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
      member: field.h_member,
    },
  };
  console.log("Scraping end");
  console.log("WriteFileSync start");
  /** DEBUG */
  // console.log(JSON.stringify(obj));
  fs.writeFileSync("./schedule.json", JSON.stringify(obj));
  console.log("WriteFileSync end");
};

main();
