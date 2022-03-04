import express from "express";
import puppeteer from "puppeteer";
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import serviceAccount from "../serviceAccountKey.json";

interface ScheduleType {
  href: string;
  category: string;
  time: string;
  text: string;
}

interface FieldType {
  date: string;
  schedule: ScheduleType[];
}

dotenv.config();

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const app = express();
const PORT = process.env.PORT || 3000;
const db = getFirestore();

/** データの追加（同じドキュメントがあれば上書き） */
const setDoc = async (document: string, field: FieldType[]) => {
  const data: FirebaseFirestore.DocumentData = {
    field,
  };

  await db.collection("sakamichi").doc(document).set(data);
};

/** データの取得 */
export const getDoc = async (document: string) => {
  (await db.collection(document).get()).forEach((doc) => {
    console.log(JSON.stringify(doc.data().field));
  });
};

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
  const nogizaka = await scraping(
    "https://www.nogizaka46.com/s/n46/media/list"
  );
  await setDoc("nogizaka", nogizaka);
};

main();

app.get("/", (req, res) => res.json("Success Deploy"));
app.listen(PORT);
console.log(`Server running at ${PORT}`);
