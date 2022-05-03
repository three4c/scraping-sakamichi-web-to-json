import puppeteer from 'puppeteer';

export interface ObjType {
  name: '乃木坂46' | '日向坂46';
  color: 'purple' | 'blue';
  schedule: DateType[] | MemberType[];
  member: DateType[] | MemberType[];
}

export interface ResultType {
  n_schedule: DateType[];
  n_member: MemberType[];
  h_schedule: DateType[];
  h_member: MemberType[];
}

export type ScrapingInfoType = ScrapingInfoScheduleType | ScrapingInfoMemberType;

export interface ScrapingInfoScheduleType {
  key: 'n_schedule' | 'h_schedule';
  url: string;
  fn: (page: puppeteer.Page) => Promise<DateType[]>;
}

export interface ScrapingInfoMemberType {
  key: 'n_member' | 'h_member';
  url: string;
  fn: (page: puppeteer.Page) => Promise<MemberType[]>;
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
