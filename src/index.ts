import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
// import serviceAccount from "./serviceAccountKey.json";

interface ScrapingInfoType {
  key: SakamichiType;
  url: string;
  fn: (page: puppeteer.Page) => Promise<FieldType[]>;
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

type SakamichiType = "nogizaka" | "hinatazaka";

dotenv.config();

// initializeApp({
//   credential: cert(serviceAccount as ServiceAccount),
// });

const app = express();
const PORT = process.env.PORT || 3000;
// const db = getFirestore();

/** データの追加（同じドキュメントがあれば上書き） */
// const setDoc = async (document: string, field: FieldType[]) => {
//   const data: FirebaseFirestore.DocumentData = {
//     field,
//   };

//   await db.collection("sakamichi").doc(document).set(data);
// };

/** データの取得 */
// export const getDoc = async (document: string) => {
//   (await db.collection(document).get()).forEach((doc) => {
//     console.log(JSON.stringify(doc.data().field));
//   });
// };

/** 乃木坂 */
const nogizakaFn = (page: puppeteer.Page) =>
  page.$$eval(".sc--lists .sc--day", (element) => {
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

/** 日向坂 */
const hinatazakaFn = (page: puppeteer.Page) =>
  page.$$eval(".p-schedule__list-group", (element) => {
    const today = new Date();
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
  });

  const page = await browser.newPage();

  const result: { [key in SakamichiType]: FieldType[] } = {
    nogizaka: [],
    hinatazaka: [],
  };

  for (const item of scrapingInfo) {
    await page.goto(item.url, {
      waitUntil: "networkidle0",
    });
    await page.waitForTimeout(1000);
    result[item.key] = await item.fn(page);
  }

  await browser.close();
  return result;
};

const main = async () => {
  const scrapingInfo: ScrapingInfoType[] = [
    {
      key: "nogizaka",
      url: "https://www.nogizaka46.com/s/n46/media/list",
      fn: nogizakaFn,
    },
    {
      key: "hinatazaka",
      url: "https://www.hinatazaka46.com/s/official/media/list?ima=0000&dy=202203",
      fn: hinatazakaFn,
    },
  ];

  console.log("Scraping start");
  const field = await scraping(scrapingInfo);
  const obj = {
    nogizaka: field.nogizaka,
    hinatazaka: field.hinatazaka,
  };
  console.log("Scraping end");
  console.log("WriteFileSync start");
  fs.writeFileSync("./schedule.json", JSON.stringify(obj));
  console.log("WriteFileSync end");
  // await setDoc("nogizaka", field.nogizaka);
  // await setDoc("hinatazaka", field.hinatazaka);
};

/** 実行する時だけコメントアウトを戻す */
main();

// app.get("/", (req, res) => res.send("Success Deploy"));
// app.listen(PORT);
// console.log(`Server running at ${PORT}`);
