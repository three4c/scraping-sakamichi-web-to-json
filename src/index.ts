import fs from 'fs';
import puppeteer from 'puppeteer';
import { GroupType, ScrapingInfoType, DateType, MemberType, ObjType, ScheduleType, ScheduleFilterType } from 'types';

const getToday = () => {
  const today = new Date(Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000);
  const year = today.getFullYear();
  const month = `0${today.getMonth() + 1}`.slice(-2);
  const day = `0${today.getDate()}`.slice(-2);

  return {
    year,
    month,
    day,
  };
};

const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

const main = async () => {
  const { year, month } = getToday();
  const dyParameter = `${year}${month}`;
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

  console.log('Start');
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
  console.log('End');
};

/** スクレイピング */
const scraping = async (scrapingInfo: ScrapingInfoType[]) => {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 0,
  });
  const page = await browser.newPage();
  const result: { [key in GroupType]: DateType[] | MemberType[] } = {
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

/** 乃木坂 */
const n_getSchedule = async (page: puppeteer.Page) => {
  await page.click('.b--lng');
  await page.waitForTimeout(1000);
  await page.click('.b--lng__one.js-lang-swich.hv--op.ja');
  await page.waitForTimeout(1000);

  let date: DateType[] = await page.$$eval('.sc--lists .sc--day', async (element) => {
    const { year, month, day } = await window.getToday();
    const convertTime = (time: string) => {
      const matchText = time.match(/([0-9]|1[0-9]|2[0-9]):[0-5][0-9]/g);
      return matchText ? matchText.map((item) => `0${item}`.slice(-5)) : undefined;
    };

    return element
      .filter((item) => Math.abs(Number(item.querySelector('.sc--day__hd')?.getAttribute('id')) - day) < 2)
      .map((item) => {
        const id = item.querySelector('.sc--day__hd')?.getAttribute('id') || undefined;
        const date = id ? `${year}-${month}-${id}` : '';
        const schedule = Array.from(item.querySelectorAll('.m--scone')).map((elementItem) => {
          const time = convertTime(elementItem.querySelector('.m--scone__start')?.textContent || '');

          return {
            href: elementItem.querySelector('.m--scone__a')?.getAttribute('href') || '',
            category: elementItem.querySelector('.m--scone__cat__name')?.textContent || '',
            startTime: time ? time[0] : undefined,
            endTime: time ? time[1] : undefined,
            text: elementItem.querySelector('.m--scone__ttl')?.textContent || '',
          };
        });

        return {
          date,
          schedule,
        };
      });
  });

  date = date.map((item) => ({
    ...item,
    schedule: item.schedule.map((scheduleItem) => {
      const bracketsIndex = scheduleItem.text.lastIndexOf('」');
      const bracketsOutlineIndex = scheduleItem.text.lastIndexOf('』');
      const index = (bracketsIndex < bracketsOutlineIndex ? bracketsOutlineIndex : bracketsIndex) + 1;
      const text = index === 0 ? convertText(scheduleItem.text) : scheduleItem.text.slice(0, index);
      const member =
        index !== scheduleItem.text.length
          ? scheduleItem.text
              .slice(index, scheduleItem.text.length)
              .split('、')
              .map((nameItem) => ({
                name: convertText(nameItem),
              }))
          : undefined;

      return {
        ...scheduleItem,
        text,
        member,
      };
    }),
  }));

  for (let i = 0; i < date.length; i++) {
    const overTimeSchedule = date[i].schedule
      .filter((item: ScheduleType): item is ScheduleFilterType =>
        Boolean(item.startTime && Number(item.startTime.split(':')[0]) >= 24)
      )
      .map((item) => {
        const startTime = item.startTime?.split(':');
        const endTime = item.endTime?.split(':');

        return {
          ...item,
          startTime: `0${Number(startTime[0]) - 24}:${startTime[1]}`.slice(-5),
          endTime: endTime ? `${Number(endTime[0]) - 24}:${endTime[1]}` : undefined,
        };
      });

    for (let j = 0; j < overTimeSchedule.length; j++) {
      date[i].schedule = date[i].schedule.filter((item) => item.text !== overTimeSchedule[j].text);
    }

    if (i + 1 < date.length) {
      date[i + 1].schedule = [...date[i + 1].schedule, ...overTimeSchedule];
    }
  }

  return date;
};

/** n_getScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
const n_getMember = async (page: puppeteer.Page) =>
  page.$$eval('.m--mem', (element) => {
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

    return element
      .filter((item) => item.querySelector('.m--mem__name')?.textContent)
      .map((item) => ({
        href: item.querySelector('.m--mem__in')?.getAttribute('href') || '',
        name: convertText(item.querySelector('.m--mem__name')?.textContent || ''),
        hiragana: convertText(item.querySelector('.m--mem__kn')?.textContent || ''),
        src: item.querySelector<HTMLElement>('.m--bg')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || '',
      }));
  });

/** 日向坂 */
const h_getSchedule = async (page: puppeteer.Page) => {
  const date: DateType[] = await page.$$eval('.p-schedule__list-group', async (element) => {
    const { year, month, day } = await window.getToday();
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');
    const convertTime = (time: string) => {
      const matchText = time.match(/([0-9]|1[0-9]|2[0-9]):[0-5][0-9]/g);
      return matchText ? matchText.map((item) => `0${item}`.slice(-5)) : undefined;
    };

    return element
      .filter((item) => Math.abs(Number(item.querySelector('.c-schedule__date--list span')?.textContent) - day) < 2)
      .map((item) => {
        const id = item.querySelector('.c-schedule__date--list span')?.textContent || undefined;
        const date = id ? `${year}-${month}-${id}` : '';
        const schedule = Array.from(item.querySelectorAll('.p-schedule__item a')).map((elementItem) => {
          const href = elementItem.getAttribute('href');
          const time = convertTime(
            convertText(elementItem.querySelector('.c-schedule__time--list')?.textContent || '')
          );

          return {
            href: href ? `https://www.hinatazaka46.com${href}` : '',
            category: convertText(elementItem.querySelector('.c-schedule__category')?.textContent || ''),
            startTime: time ? time[0] : undefined,
            endTime: time ? time[1] : undefined,
            text: convertText(elementItem.querySelector('.c-schedule__text')?.textContent || ''),
          };
        });

        return {
          date,
          schedule,
        };
      });
  });

  for (let i = 0; i < date.length; i++) {
    for (let j = 0; j < date[i].schedule.length; j++) {
      await page.goto(date[i].schedule[j].href);
      const member = await page.$$eval('.c-article__tag a', (element) => {
        const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

        return element.map((item) => ({
          name: convertText(item.textContent || ''),
        }));
      });
      date[i].schedule[j].member = member.length ? member : undefined;
      await page.waitForTimeout(1000);
    }
  }

  for (let i = 0; i < date.length; i++) {
    const overTimeSchedule = date[i].schedule
      .filter((item: ScheduleType): item is ScheduleFilterType =>
        Boolean(item.startTime && Number(item.startTime.split(':')[0]) >= 24)
      )
      .map((item) => {
        const startTime = item.startTime?.split(':');
        const endTime = item.endTime?.split(':');

        return {
          ...item,
          startTime: `0${Number(startTime[0]) - 24}:${startTime[1]}`.slice(-5),
          endTime: endTime ? `${Number(endTime[0]) - 24}:${endTime[1]}` : undefined,
        };
      });

    for (let j = 0; j < overTimeSchedule.length; j++) {
      date[i].schedule = date[i].schedule.filter((item) => item.text !== overTimeSchedule[j].text);
    }

    if (i + 1 < date.length) {
      date[i + 1].schedule = [...date[i + 1].schedule, ...overTimeSchedule];
    }
  }

  return date;
};

const h_getMember = async (page: puppeteer.Page) =>
  page.$$eval('.sorted.sort-default .p-member__item', (element) => {
    const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');

    return element
      .filter((item) => item.querySelector('.c-member__name')?.textContent)
      .map((item) => {
        const href = item.querySelector('a')?.getAttribute('href');

        return {
          href: href ? `https://www.hinatazaka46.com${href}` : '',
          name: convertText(item.querySelector('.c-member__name')?.textContent || ''),
          hiragana: convertText(item.querySelector('.c-member__kana')?.textContent || ''),
          src: item.querySelector('img')?.getAttribute('src') || '',
        };
      });
  });

main();
