import dotenv from 'dotenv';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getToday, convertText, convertTime, sliceBrackets, convertHalfToFull } from 'lib';
import puppeteer from 'puppeteer';
import {
  ScrapingInfoType,
  DateType,
  MemberType,
  DataType,
  ScheduleType,
  ScheduleFilterType,
  ResultType,
  ConvertDataType,
} from 'types';

dotenv.config();

const serviceAccount: ServiceAccount = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const setDoc = async (field: any) => {
  const data: FirebaseFirestore.DocumentData = {
    field,
  };

  await db.collection('46pic').doc('group').set(data);
};

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

  console.log('🚀 Start');
  const field = await scraping(scrapingInfo);
  const data: DataType[] = [
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

  const convertData: ConvertDataType[] = data.map((item) => {
    const member = item.member?.map((item) => ({
      ...item,
      name: convertHalfToFull(item.name),
    }));

    return {
      name: item.name,
      color: item.color,
      schedule: item.schedule.map((_item) => ({
        ..._item,
        schedule: _item.schedule.map((__item) => {
          const filterMember: MemberType[] = [];
          member.forEach((___item) => {
            __item.member?.forEach((____item) => {
              if (___item.name === ____item.name) {
                filterMember.push(___item);
              }
            });
          });

          return {
            ...__item,
            startTime: __item.startTime,
            endTime: __item.endTime,
            dateTime: __item.startTime ? `${_item.date}T${__item.startTime}+09:00` : undefined,
            text: sliceBrackets(__item.text),
            member: filterMember.length ? filterMember : undefined,
          };
        }),
      })),
    };
  });

  await setDoc(convertData);
  console.log('🎉 End');
};

/** スクレイピング */
const scraping = async (scrapingInfo: ScrapingInfoType[]) => {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 0,
  });
  const page = await browser.newPage();
  const result: ResultType = {
    n_schedule: [],
    n_member: [],
    h_schedule: [],
    h_member: [],
  };

  await page.exposeFunction('getToday', getToday);
  await page.exposeFunction('convertText', convertText);
  await page.exposeFunction('convertTime', convertTime);
  await page.setViewport({ width: 320, height: 640 });

  for (const item of scrapingInfo) {
    await page.goto(item.url);
    await page.waitForTimeout(1000);

    if (item.key === 'n_schedule' || item.key === 'h_schedule') {
      result[item.key] = await item.fn(page);
    }

    if (item.key === 'n_member' || item.key === 'h_member') {
      result[item.key] = await item.fn(page);
    }
  }

  await browser.close();
  return result;
};

/** 乃木坂 */
const n_getSchedule = async (page: puppeteer.Page): Promise<DateType[]> => {
  await page.click('.b--lng');
  await page.waitForTimeout(1000);
  await page.click('.b--lng__one.js-lang-swich.hv--op.ja');
  await page.waitForTimeout(1000);

  let date: DateType[] = await page.$$eval('.sc--lists .sc--day', async (element) => {
    const { year, month, day } = await window.getToday();

    return Promise.all(
      element
        .filter((item) => Math.abs(Number(item.querySelector('.sc--day__hd')?.getAttribute('id')) - day) < 2)
        .map(async (item) => {
          const id = item.querySelector('.sc--day__hd')?.getAttribute('id') || undefined;
          const date = id ? `${year}-${month}-${`0${id}`.slice(-2)}` : '';
          const schedule = await Promise.all(
            Array.from(item.querySelectorAll('.m--scone')).map(async (elementItem) => {
              const time = await window.convertTime(elementItem.querySelector('.m--scone__start')?.textContent || '');

              return {
                href: elementItem.querySelector('.m--scone__a')?.getAttribute('href') || '',
                category: elementItem.querySelector('.m--scone__cat__name')?.textContent || '',
                startTime: time ? time[0] : undefined,
                endTime: time ? time[1] : undefined,
                text: elementItem.querySelector('.m--scone__ttl')?.textContent || '',
              };
            })
          );

          return {
            date,
            schedule,
          };
        })
    );
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
          endTime: endTime ? `0${Number(endTime[0]) - 24}:${endTime[1]}`.slice(-5) : undefined,
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
const n_getMember = async (page: puppeteer.Page): Promise<MemberType[]> =>
  page.$$eval('.m--mem', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.m--mem__name')?.textContent)
        .map(async (item) => ({
          href: item.querySelector('.m--mem__in')?.getAttribute('href') || '',
          name: await window.convertText(item.querySelector('.m--mem__name')?.textContent || ''),
          hiragana: await window.convertText(item.querySelector('.m--mem__kn')?.textContent || ''),
          src: item.querySelector<HTMLElement>('.m--bg')?.style.backgroundImage.slice(4, -1).replace(/"/g, '') || '',
        }))
    )
  );

/** 日向坂 */
const h_getSchedule = async (page: puppeteer.Page): Promise<DateType[]> => {
  const date: DateType[] = await page.$$eval('.p-schedule__list-group', async (element) => {
    const { year, month, day } = await window.getToday();

    return Promise.all(
      element
        .filter((item) => Math.abs(Number(item.querySelector('.c-schedule__date--list span')?.textContent) - day) < 2)
        .map(async (item) => {
          const id = item.querySelector('.c-schedule__date--list span')?.textContent || undefined;
          const date = id ? `${year}-${month}-${`0${id}`.slice(-2)}` : '';
          const schedule = await Promise.all(
            Array.from(item.querySelectorAll('.p-schedule__item a')).map(async (elementItem) => {
              const href = elementItem.getAttribute('href');
              const time = await window.convertTime(
                await window.convertText(elementItem.querySelector('.c-schedule__time--list')?.textContent || '')
              );

              return {
                href: href ? `https://www.hinatazaka46.com${href}` : '',
                category: await window.convertText(
                  elementItem.querySelector('.c-schedule__category')?.textContent || ''
                ),
                startTime: time ? time[0] : undefined,
                endTime: time ? time[1] : undefined,
                text: await window.convertText(elementItem.querySelector('.c-schedule__text')?.textContent || ''),
              };
            })
          );

          return {
            date,
            schedule,
          };
        })
    );
  });

  for (let i = 0; i < date.length; i++) {
    for (let j = 0; j < date[i].schedule.length; j++) {
      await page.goto(date[i].schedule[j].href);
      const member = await page.$$eval('.c-article__tag a', (element) =>
        Promise.all(
          element.map(async (item) => ({
            name: await window.convertText(item.textContent || ''),
          }))
        )
      );

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
          endTime: endTime ? `0${Number(endTime[0]) - 24}:${endTime[1]}`.slice(-5) : undefined,
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

const h_getMember = async (page: puppeteer.Page): Promise<MemberType[]> =>
  page.$$eval('.sorted.sort-default .p-member__item', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.c-member__name')?.textContent)
        .map(async (item) => {
          const href = item.querySelector('a')?.getAttribute('href');

          return {
            href: href ? `https://www.hinatazaka46.com${href}` : '',
            name: await window.convertText(item.querySelector('.c-member__name')?.textContent || ''),
            hiragana: await window.convertText(item.querySelector('.c-member__kana')?.textContent || ''),
            src: item.querySelector('img')?.getAttribute('src') || '',
          };
        })
    )
  );

main();
