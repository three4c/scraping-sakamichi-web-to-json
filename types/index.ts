import puppeteer from 'puppeteer';

export type ConvertDataType = Omit<DataType, 'member'>;

export interface DataType {
  name: '乃木坂46' | '日向坂46' | '櫻坂46';
  color: 'purple' | 'blue' | 'pink';
  schedule: DateType[];
  member: MemberType[];
}

export interface ResultType {
  n_schedule: DateType[];
  n_member: MemberType[];
  n_ticket: TicketType[];
  h_schedule: DateType[];
  h_member: MemberType[];
  h_ticket: TicketType[];
  s_schedule: DateType[];
  s_member: MemberType[];
  s_ticket: TicketType[];
}

export type ScrapingInfoType = ScrapingInfoScheduleType | ScrapingInfoMemberType | ScrapingInfoTicketType;

interface ScrapingInfoScheduleType extends ScrapingInfoCommon {
  key: 'n_schedule' | 'h_schedule' | 's_schedule';
  fn: (page: puppeteer.Page) => Promise<DateType[]>;
}

interface ScrapingInfoMemberType extends ScrapingInfoCommon {
  key: 'n_member' | 'h_member' | 's_member';
  fn: (page: puppeteer.Page) => Promise<MemberType[]>;
}

interface ScrapingInfoTicketType extends ScrapingInfoCommon {
  key: 'n_ticket' | 'h_ticket' | 's_ticket';
  fn: (page: puppeteer.Page) => Promise<TicketType[]>;
}

interface ScrapingInfoCommon {
  url: string;
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
  text: string;
  category?: string;
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

export interface TicketType {
  href: string;
  date: string;
  text: string;
}

export interface ArgsType {
  year: number;
  month: number;
  day: number;
  type?: 'first' | 'last';
  peak?: number;
}

declare global {
  interface Window {
    convertText: (text: string) => Promise<string>;
    convertTime: (time: string) => Promise<string[] | undefined>;
    convertOver24Time: (date: DateType[]) => Promise<DateType[]>;
  }
}
