import puppeteer from 'puppeteer';

export type GroupType = 'n_schedule' | 'n_member' | 'h_schedule' | 'h_member' | 'h_article';

export interface ObjType {
  name: '乃木坂46' | '日向坂46';
  color: 'purple' | 'blue';
  schedule: DateType[] | MemberType[];
  member: DateType[] | MemberType[];
}

export interface ScrapingInfoType {
  key: GroupType;
  url: string;
  fn: (page: puppeteer.Page) => Promise<DateType[] | MemberType[]>;
}

export interface DateType {
  date: string;
  schedule: ScheduleType[];
}

export interface ScheduleFilterType extends ScheduleType {
  startTime: string;
}

export interface ScheduleType {
  href: string;
  category: string;
  text: string;
  startTime?: string;
  endTime?: string;
  member?: Pick<MemberType, 'name'>[];
}

export interface MemberType {
  href: string;
  name: string;
  hiragana: string;
  src: string;
}

declare global {
  interface Window {
    getToday: () => Promise<{
      year: number;
      month: number;
      day: number;
    }>;
    convertText: (text: string) => Promise<string>;
    convertTime: (time: string) => Promise<string[] | undefined>;
  }
}
