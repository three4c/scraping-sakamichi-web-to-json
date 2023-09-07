import { BrowserContext, chromium, Page } from '@playwright/test';
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
} from 'lib';
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

const isProd = process.env.NODE_ENV !== 'development';

const { year, month, day } = isProd
  ? getToday()
  : {
      year: 2023,
      month: 6,
      day: 30,
    };

const main = async () => {
  const dyParameter = `${year}${`0${month}`.slice(-2)}`;
  const scrapingInfo: ScrapingInfoType[] = [
    {
      key: 'n_schedule',
      url: `https://www.nogizaka46.com/s/n46/media/list?dy=${dyParameter}`,
      fn: n_getSchedule,
    },
  ];
};

const scraping = async () => {
  const browser = await chromium.launch({
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
};

const n_getSchedule = async (page: Page): Promise<DateType[]> => {
  return [];
};
