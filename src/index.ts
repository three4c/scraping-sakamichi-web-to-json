import { setTimeout } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  addColor,
  addId,
  getToday,
  convertText,
  convertDate,
  convertTime,
  sliceBrackets,
  convertOver24Time,
  convertHalfToFull,
  convertPackDate,
  getFirstOrEndDay,
  exportData,
} from 'lib';
import * as playwright from 'playwright';
import {
  ScrapingInfoType,
  DateType,
  MemberType,
  DataType,
  ScheduleType,
  ResultType,
  ConvertDataType,
  ArgsType,
  TicketType,
  MemberScheduleType,
} from 'types';

dotenv.config();

const SLEEP = 1000;

const isProd = process.env.NODE_ENV !== 'development';

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

const setDoc = async (doc: string, group: any) => {
  const data: FirebaseFirestore.DocumentData = {
    group,
  };

  await db.collection('46pic').doc(doc).set(data);
};

const { year, month, day } = isProd
  ? getToday()
  : {
      year: 2023,
      month: 6,
      day: 30,
    };

const prisma = new PrismaClient();

const main = async () => {
  const dyParameter = `${year}${`0${month}`.slice(-2)}`;
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
      key: 'n_ticket',
      url: `https://www.nogizaka46.com/s/n46/news/list?dy=${dyParameter}&ct=live`,
      fn: n_getTicket,
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
    {
      key: 'h_ticket',
      url: `https://www.hinatazaka46.com/s/official/news/list?cd=event&dy=${dyParameter}&cd=event`,
      fn: h_getTicket,
    },
    {
      key: 's_schedule',
      url: `https://sakurazaka46.com/s/s46/media/list?dy=${dyParameter}`,
      fn: s_getSchedule,
    },
    {
      key: 's_member',
      url: 'https://sakurazaka46.com/s/s46/search/artist',
      fn: s_getMember,
    },
    {
      key: 's_ticket',
      url: `https://sakurazaka46.com/s/s46/news/list?cd=event&dy=${dyParameter}&cd=event`,
      fn: s_getTicket,
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
    {
      name: '櫻坂46',
      color: 'pink',
      schedule: field.s_schedule,
      member: field.s_member,
    },
  ];

  const date = [
    ...addColor<DateType>(field.n_schedule, 'purple'),
    ...addColor<DateType>(field.h_schedule, 'blue'),
    ...addColor<DateType>(field.s_schedule, 'pink'),
  ];

  const dateData = Array.from(
    date.reduce((acc, cur) => acc.set(cur.date, cur), new Map<string, DateType>()).values()
  ).map((item, index) => ({
    id: index + 1,
    date: item.date,
  }));

  const convertScheduleData = (array: DateType[]) => {
    const scheduleData: ScheduleType[] = [];
    let sumScheduleIndex = 0;

    array.forEach((item) =>
      item.schedule.forEach((scheduleItem, scheduleIndex) => {
        scheduleData.push({
          ...scheduleItem,
          id: scheduleIndex + 1 + sumScheduleIndex,
          dateId: dateData.find((dateItem) => dateItem.date === item.date)?.id,
          colorId: item.colorId,
          dateTime: scheduleItem.startTime ? `${item.date}T${scheduleItem.startTime}+09:00` : undefined,
        });

        if (item.schedule.length - 1 === scheduleIndex) {
          sumScheduleIndex += item.schedule.length;
        }
      })
    );

    return scheduleData;
  };

  const convertMemberData = [
    {
      name: '乃木坂46',
      color: 'purple',
      member: field.n_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
    },
    {
      name: '日向坂46',
      color: 'blue',
      member: field.h_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
    },
    {
      name: '櫻坂46',
      color: 'pink',
      member: field.s_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
    },
  ];

  const convertTicketData = [
    {
      name: '乃木坂46',
      color: 'purple',
      ticket: field.n_ticket,
    },
    {
      name: '日向坂46',
      color: 'blue',
      ticket: field.h_ticket,
    },
    {
      name: '櫻坂46',
      color: 'pink',
      ticket: field.s_ticket,
    },
  ];

  const scheduleData = convertScheduleData(date);

  const memberData = addId<MemberType>([
    ...addColor<MemberType>(
      field.n_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
      'purple'
    ),
    ...addColor<MemberType>(
      field.h_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
      'blue'
    ),
    ...addColor<MemberType>(
      field.s_member.map((item) => ({
        ...item,
        name: convertHalfToFull(item.name),
      })),
      'pink'
    ),
  ]);

  const ticketData = addId<TicketType>([
    ...addColor<TicketType>(field.n_ticket, 'purple'),
    ...addColor<TicketType>(field.h_ticket, 'blue'),
    ...addColor<TicketType>(field.s_ticket, 'pink'),
  ]);

  const convertMemberScheduleData = (array: ScheduleType[]) => {
    const memberScheduleData: MemberScheduleType[] = [];
    array.forEach((item) => {
      const member = item.member?.map((memberItem) => ({
        scheduleId: item.id,
        name: convertHalfToFull(memberItem.name),
      }));

      member?.forEach((memberItem) => {
        memberData.forEach((memberDataItem) => {
          if (memberItem.name === memberDataItem.name) {
            memberScheduleData.push({
              memberId: memberDataItem.id,
              scheduleId: item.id,
            });
          }
        });
      });
    });

    return addId<MemberScheduleType>(memberScheduleData);
  };

  const memberScheduleData = convertMemberScheduleData(scheduleData);

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

  if (isProd) {
    /** FirebaseからPrismaに移管する */
    /** Firebase */
    await setDoc('schedule', convertData);
    await setDoc('member', convertMemberData);
    await setDoc('ticket', convertTicketData);
  } else {
    console.log('schedule', JSON.stringify(convertData));
    console.log('member', JSON.stringify(convertMemberData));
    console.log('ticket', JSON.stringify(convertTicketData));

    /** Prisma */
    await prisma.date_schedules.deleteMany();
    await prisma.schedules.deleteMany();
    await prisma.members.deleteMany();
    await prisma.tickets.deleteMany();
    await prisma.member_schedules.deleteMany();

    await prisma.date_schedules.createMany({
      data: dateData.map((item) => ({
        id: item.id,
        date: new Date(item.date),
      })),
    });

    await prisma.schedules.createMany({
      data: scheduleData.map((item) => ({
        id: item.id,
        color_id: item.colorId || '',
        date_id: item.dateId || 0,
        href: item.href,
        text: item.text,
        category: item.category,
        start_time: item.startTime,
        end_time: item.endTime,
        date_time: item.dateTime,
      })),
    });

    await prisma.members.createMany({
      data: memberData.map((item) => ({
        id: item.id,
        color_id: item.colorId || '',
        href: item.href,
        name: item.name,
        hiragana: item.hiragana,
        src: item.src,
      })),
    });

    await prisma.member_schedules.createMany({
      data: memberScheduleData.map((item) => ({
        id: item.id,
        member_id: item.memberId || 0,
        schedule_id: item.scheduleId || 0,
      })),
    });

    await prisma.tickets.createMany({
      data: ticketData.map((item) => ({
        id: item.id || 0,
        color_id: item.colorId || '',
        href: item.href,
        date: new Date(item.date),
        text: item.text,
      })),
    });

    exportData({
      date: dateData,
      schedules: scheduleData,
      members: memberData,
      tickets: ticketData,
      memberSchedules: memberScheduleData,
    });
  }

  console.log('🎉 End');
};

/** スクレイピング */
const scraping = async (scrapingInfo: ScrapingInfoType[]) => {
  const browser = await playwright.chromium.launch({
    args: ['--no-sandbox'],
    headless: true,
    slowMo: 0,
  });
  const page = await browser.newPage();
  const result: ResultType = {
    n_schedule: [],
    n_member: [],
    n_ticket: [],
    h_schedule: [],
    h_member: [],
    h_ticket: [],
    s_schedule: [],
    s_member: [],
    s_ticket: [],
  };

  // page.on('console', (msg) => {
  //   for (let i = 0; i < msg.args().length; ++i) console.log(`${i}: ${msg.args()[i]}`);
  // });

  await page.exposeFunction('convertText', convertText);
  await page.exposeFunction('convertDate', convertDate);
  await page.exposeFunction('convertTime', convertTime);
  await page.exposeFunction('convertOver24Time', convertOver24Time);
  await page.setViewportSize({ width: 320, height: 640 });

  for (const item of scrapingInfo) {
    await page.goto(item.url);
    await setTimeout(SLEEP);

    if (item.key === 'n_schedule' || item.key === 'h_schedule' || item.key === 's_schedule') {
      result[item.key] = await item.fn(page);
    }

    if (item.key === 'n_member' || item.key === 'h_member' || item.key === 's_member') {
      result[item.key] = await item.fn(page);
    }

    if (item.key === 'n_ticket' || item.key === 'h_ticket' || item.key === 's_ticket') {
      result[item.key] = await item.fn(page);
    }
  }

  await browser.close();
  return result;
};

/** 乃木坂 */
const n_getSchedule = async (page: playwright.Page): Promise<DateType[]> => {
  await page.click('.b--lng');
  await setTimeout(SLEEP * 2);
  await page.click('.b--lng__one.js-lang-swich.hv--op.ja');
  await setTimeout(SLEEP * 2);

  const getDate = async (args: ArgsType) =>
    await page.$$eval(
      '.sc--lists .sc--day',
      async (element, args) => {
        const isArgsType = (arg: any): arg is ArgsType => arg;

        if (isArgsType(args)) {
          const { year, month, day, type, peak } = args;

          return Promise.all(
            element
              .filter((item) => {
                const diff = Number(item.querySelector('.sc--day__hd')?.getAttribute('id')) - day;

                if ((type === 'first' || type === 'last') && peak !== undefined) {
                  return Math.abs(diff) <= peak;
                } else {
                  return -1 <= diff && diff <= 2;
                }
              })
              .map(async (item) => {
                const id = item.querySelector('.sc--day__hd')?.getAttribute('id') || undefined;
                const date = id ? `${year}-${`0${month}`.slice(-2)}-${`0${id}`.slice(-2)}` : '';
                const schedule = await Promise.all(
                  Array.from(item.querySelectorAll('.m--scone')).map(async (elementItem) => {
                    const time = await window.convertTime(
                      elementItem.querySelector('.m--scone__start')?.textContent || ''
                    );

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
        } else {
          return [];
        }
      },
      args
    );

  let date: DateType[] = await getDate({
    year,
    month,
    day,
  });

  const firstOrEndDay = getFirstOrEndDay(year, month, day);

  if (firstOrEndDay.type) {
    const dyParameter = `${firstOrEndDay.year}${`0${firstOrEndDay.month}`.slice(-2)}`;
    await page.goto(`https://www.nogizaka46.com/s/n46/media/list?dy=${dyParameter}`);

    const type = firstOrEndDay.type === 'firstDay' || firstOrEndDay.type === 'firstMonth' ? 'first' : 'last';
    const addDate = await getDate({
      year: firstOrEndDay.year,
      month: firstOrEndDay.month,
      day: firstOrEndDay.day,
      type,
      peak: type === 'first' ? 0 : 1 - (new Date(year, month, 0).getDate() - day),
    });

    date = type == 'first' ? [...addDate, ...date] : [...date, ...addDate];
  }

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

  return convertOver24Time(convertPackDate(year, month, day, date));
};

/** n_getScheduleで言語を切り替えているため、こちらではそのままスクレイピングを行う */
const n_getMember = async (page: playwright.Page): Promise<MemberType[]> => {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await setTimeout(SLEEP * 2);

  return await page.$$eval('.m--mem', (element) =>
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
};

const n_getTicket = async (page: playwright.Page): Promise<TicketType[]> =>
  page.$$eval('.m--nsone', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.m--nsone__ttl')?.textContent?.match(/先行|一般発売|追加販売|チケット/g))
        .map(async (item) => ({
          href: item.querySelector('.m--nsone__a')?.getAttribute('href') || '',
          date: await window.convertDate(item.querySelector('.m--nsone__date')?.textContent || ''),
          text: item.querySelector('.m--nsone__ttl')?.textContent || '',
        }))
    )
  );

/** 日向坂 */
const h_getSchedule = async (page: playwright.Page): Promise<DateType[]> => {
  await page.click('.wovn-lang-selector');
  await setTimeout(SLEEP);
  await page.click('[data-value="ja"]');
  await setTimeout(SLEEP);

  const getDate = async (args: ArgsType) =>
    await page.$$eval(
      '.p-schedule__list-group',
      async (element, args) => {
        const isArgsType = (arg: any): arg is ArgsType => arg;

        if (isArgsType(args)) {
          const { year, month, day, type, peak } = args;

          return Promise.all(
            element
              .filter((item) => {
                const diff = Number(item.querySelector('.c-schedule__date--list span')?.textContent) - day;

                if ((type === 'first' || type === 'last') && peak !== undefined) {
                  return Math.abs(diff) <= peak;
                } else {
                  return -1 <= diff && diff <= 2;
                }
              })
              .map(async (item) => {
                const id = item.querySelector('.c-schedule__date--list span')?.textContent || undefined;
                const date = id ? `${year}-${`0${month}`.slice(-2)}-${`0${id}`.slice(-2)}` : '';
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
        } else {
          return [];
        }
      },
      args
    );

  let date: DateType[] = await getDate({
    year,
    month,
    day,
  });

  const firstOrEndDay = getFirstOrEndDay(year, month, day);

  if (firstOrEndDay.type) {
    const dyParameter = `${firstOrEndDay.year}${`0${firstOrEndDay.month}`.slice(-2)}`;
    await page.goto(`https://www.hinatazaka46.com/s/official/media/list?dy=${dyParameter}`);

    const type = firstOrEndDay.type === 'firstDay' || firstOrEndDay.type === 'firstMonth' ? 'first' : 'last';
    const addDate = await getDate({
      year: firstOrEndDay.year,
      month: firstOrEndDay.month,
      day: firstOrEndDay.day,
      type,
      peak: type === 'first' ? 0 : 1 - (new Date(year, month, 0).getDate() - day),
    });

    date = type == 'first' ? [...addDate, ...date] : [...date, ...addDate];
  }

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
      await setTimeout(SLEEP);
    }
  }

  return convertOver24Time(convertPackDate(year, month, day, date));
};

const h_getMember = async (page: playwright.Page): Promise<MemberType[]> =>
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

const h_getTicket = async (page: playwright.Page): Promise<TicketType[]> =>
  page.$$eval('.p-news__item', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.c-news__text')?.textContent?.match(/スタート！|チケット/g))
        .map(async (item) => {
          const href = item.querySelector('a')?.getAttribute('href');

          return {
            href: href ? `https://www.hinatazaka46.com${href}` : '',
            date: await window.convertDate(item.querySelector('.c-news__date')?.textContent || ''),
            text: await window.convertText(item.querySelector('.c-news__text')?.textContent || ''),
          };
        })
    )
  );

const s_getSchedule = async (page: playwright.Page): Promise<DateType[]> => {
  await page.click('.wovn-lang-selector');
  await setTimeout(SLEEP);
  await page.click('[data-value="ja"]');
  await setTimeout(SLEEP);

  const getDate = async (args: ArgsType) =>
    await page.$$eval(
      '.module-modal',
      async (element, args) => {
        const isArgsType = (arg: any): arg is ArgsType => arg;

        const getDateText = (text: string) => {
          const matchText = text.match(/[0-9]{4}.[0-9]{2}.[0-9]{2}/g);
          return matchText ? matchText[0] : undefined;
        };

        if (isArgsType(args)) {
          const { day, type, peak } = args;

          const date = await Promise.all(
            element
              .filter((item) => {
                const diff = Number(getDateText(item.querySelector('.date')?.textContent || '')?.slice(-2)) - day;

                if ((type === 'first' || type === 'last') && peak !== undefined) {
                  return Math.abs(diff) <= peak;
                } else {
                  return -1 <= diff && diff <= 2;
                }
              })
              .map(async (item) => {
                const time = await window.convertTime(item.querySelector('.date')?.textContent || '');
                const date = getDateText(item.querySelector('.date')?.textContent || '');
                const dateArray = date?.split('.');

                return {
                  date: date?.replace(/\./g, '-') || '',
                  href: dateArray
                    ? `https://sakurazaka46.com/s/s46/media/list?dy=${dateArray[0]}${dateArray[1]}${dateArray[2]}`
                    : '',
                  category: item.querySelector('.type')?.textContent || undefined,
                  startTime: time ? time[0] : undefined,
                  endTime: time ? time[1] : undefined,
                  text: item.querySelector('.title')?.textContent || '',
                  member: await Promise.all(
                    Array.from(item.querySelectorAll('.members a')).map(async (elementItem) => ({
                      name: await window.convertText(elementItem.textContent || ''),
                    }))
                  ),
                };
              })
          );

          const categories = date
            .filter((item) => item.date)
            .reduce(
              (acc, cur) => {
                if (!acc[cur.date]) {
                  acc[cur.date] = [];
                }

                acc[cur.date] = [...acc[cur.date], cur];
                return acc;
              },
              {} as {
                [key: string]: (ScheduleType & { date?: string })[];
              }
            );

          const convertCategories = Object.entries(categories).map(([categoryName, prop]) => ({
            date: categoryName,
            schedule: prop.map((item) => {
              delete item.date;
              return item;
            }),
          }));

          return convertCategories;
        } else {
          return [];
        }
      },
      args
    );

  let date: DateType[] = await getDate({
    year,
    month,
    day,
  });

  const firstOrEndDay = getFirstOrEndDay(year, month, day);

  if (firstOrEndDay.type) {
    const dyParameter = `${firstOrEndDay.year}${`0${firstOrEndDay.month}`.slice(-2)}`;
    await page.goto(`https://sakurazaka46.com/s/s46/media/list?dy=${dyParameter}`);

    const type = firstOrEndDay.type === 'firstDay' || firstOrEndDay.type === 'firstMonth' ? 'first' : 'last';
    const addDate = await getDate({
      year: firstOrEndDay.year,
      month: firstOrEndDay.month,
      day: firstOrEndDay.day,
      type,
      peak: type === 'first' ? 0 : 1 - (new Date(year, month, 0).getDate() - day),
    });

    date = type == 'first' ? [...addDate, ...date] : [...date, ...addDate];
  }

  return convertOver24Time(convertPackDate(year, month, day, date));
};

const s_getMember = async (page: playwright.Page): Promise<MemberType[]> =>
  page.$$eval('.box', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.name')?.textContent)
        .map(async (item) => {
          const href = item.querySelector('a')?.getAttribute('href');
          const src = item.querySelector('img')?.getAttribute('src');

          return {
            href: href ? `https://sakurazaka46.com${href}` : '',
            name: await window.convertText(item.querySelector('.name')?.textContent || ''),
            hiragana: await window.convertText(item.querySelector('.kana')?.textContent || ''),
            src: src ? `https://sakurazaka46.com${src}` : '',
          };
        })
    )
  );

const s_getTicket = async (page: playwright.Page): Promise<TicketType[]> =>
  page.$$eval('.cate-event.box', (element) =>
    Promise.all(
      element
        .filter((item) => item.querySelector('.lead')?.textContent?.match(/スタート！|チケット/g))
        .map(async (item) => {
          const href = item.querySelector('a')?.getAttribute('href');

          return {
            href: href ? `https://sakurazaka46.com${href}` : '',
            date: await window.convertDate(item.querySelector('.date')?.textContent || ''),
            text: item.querySelector('.lead')?.textContent || '',
          };
        })
    )
  );

main();
