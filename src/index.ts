import puppeteer from 'puppeteer';
import fs from 'fs';
import { GroupType, ScrapingInfoType, FieldType, MemberType, ObjType } from 'types';

const getToday = () => {
  const today = new Date(Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return {
    year,
    month,
    day,
  };
};

const main = async () => {
  const { year, month } = getToday();
  const dyParameter = `${year}${`00${month}`.slice(-2)}`;

  const scrapingInfo: ScrapingInfoType[] = [
    {
      key: 'n_schedule',
      url: `https://www.nogizaka46.com/s/n46/media/list?dy=${dyParameter}`,
      fn: n_getSchedule,
    },
    {
      key: 'n_member',
      url: 'https://www.nogizaka46.com/s/n46/search/artist',
      fn: n_getMember,
    },
    {
      key: 'h_schedule',
      url: `https://www.hinatazaka46.com/s/official/media/list?dy=${dyParameter}`,
      fn: h_getSchedule,
    },
    {
      key: 'h_member',
      url: 'https://www.hinatazaka46.com/s/official/search/artist',
      fn: h_getMember,
    },
  ];

  console.log('start');
  const field = await scraping(scrapingInfo);
  const obj: ObjType[] = [
    {
      name: '乃木坂46',
      color: 'purple',
      schedule: field.n_schedule,
      member: field.n_member,
    },
    {
      name: '日向坂46',
      color: 'blue',
      schedule: field.h_schedule,
      member: field.h_member,
    },
  ];
  fs.writeFileSync('./schedule.json', JSON.stringify(obj));
  console.log('end');
};

/** 乃木坂 */
const n_getSchedule = async (page: puppeteer.Page) => {
  await page.click('.b--lng');
  await page.waitForTimeout(1000);
  await page.click('.b--lng__one.js-lang-swich.hv--op.ja');
  await page.waitForTimeout(1000);

  return page.$$eval('.sc--lists .sc--day', async (element) => {
    const { year, month, day } = await window.getToday();

    return element
      .filter((item) => Math.abs(Number(item.querySelector('.sc--day__hd')?.getAttribute('id')) - day) < 2)
      .map((item) => {
        const id = item.querySelector('.sc--day__hd')?.getAttribute('id') || undefined;
        const date = id ? `${year}-${month}-${id}` : '';
        const schedule = Array.from(item.querySelectorAll('.m--scone')).map((elementItem) => ({
          href: elementItem.querySelector('.m--scone__a')?.getAttribute('href') || '',
          category: elementItem.querySelector('.m--scone__cat__name')?.textContent || '',
          time: elementItem.querySelector('.m--scone__start')?.textContent || '',
          text: elementItem.querySelector('.m--scone__ttl')?.textContent || '',
        }));

        return {
          date,
          schedule,
        };
      });
  });
};

/** n_getScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
const n_getMember = async (page: puppeteer.Page) =>
  page.$$eval('.m--mem', (element) =>
    element.map((item) => ({
      href: item.querySelector('.m--mem__in')?.getAttribute('href') || '',
      name: (item.querySelector('.m--mem__name')?.textContent || '').replace(/\s+/g, ''),
      src: item.querySelector<HTMLElement>('.m--bg')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || '',
    }))
  );

/** 日向坂 */
const h_getSchedule = (page: puppeteer.Page) =>
  page.$$eval('.p-schedule__list-group', async (element) => {
    const { year, month, day } = await window.getToday();
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

    return element
      .filter((item) => Math.abs(Number(item.querySelector('.c-schedule__date--list span')?.textContent) - day) < 2)
      .map((item) => {
        const id = item.querySelector('.c-schedule__date--list span')?.textContent || undefined;
        const date = id ? `${year}-${month}-${id}` : '';
        const schedule = Array.from(item.querySelectorAll('.p-schedule__item a')).map((elementItem) => {
          const href = elementItem.getAttribute('href');

          return {
            href: href ? `https://www.hinatazaka46.com${href}` : '',
            category: convertText(elementItem.querySelector('.c-schedule__category')?.textContent || ''),
            time: convertText(elementItem.querySelector('.c-schedule__time--list')?.textContent || ''),
            text: convertText(elementItem.querySelector('.c-schedule__text')?.textContent || ''),
          };
        });

        return {
          date,
          schedule,
        };
      });
  });

const h_getMember = async (page: puppeteer.Page) =>
  page.$$eval('.sorted.sort-default .p-member__item', (element) => {
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

    return element.map((item) => {
      const href = item.querySelector('a')?.getAttribute('href');

      return {
        href: href ? `https://www.hinatazaka46.com${href}` : '',
        name: convertText(item.querySelector('.c-member__name')?.textContent || ''),
        src: item.querySelector('img')?.getAttribute('src') || '',
      };
    });
  });

/** スクレイピング */
const scraping = async (scrapingInfo: ScrapingInfoType[]) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const result: { [key in GroupType]: FieldType[] | MemberType[] } = {
    n_schedule: [],
    n_member: [],
    h_schedule: [],
    h_member: [],
    h_article: [],
  };

  await page.exposeFunction('getToday', getToday);
  await page.setViewport({ width: 320, height: 640 });

  for (const item of scrapingInfo) {
    await page.goto(item.url);
    await page.waitForTimeout(1000);
    result[item.key] = await item.fn(page);
  }

  await browser.close();
  return result;
};

main();
