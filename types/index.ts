import puppeteer from 'puppeteer';

export type ConvertDataType = Omit<DataType, 'member'>;

export type ColorType = 'purple' | 'blue' | 'pink';

export interface DataType {
  name: '乃木坂46' | '日向坂46' | '櫻坂46';
  color: ColorType;
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
  id?: number;
  colorId?: ColorType;
  date: string;
  schedule: ScheduleType[];
}

export interface ScheduleFilterType extends ScheduleType {
  startTime: string;
}

export interface ScheduleType {
  id?: number;
  dateId?: number;
  colorId?: string;
  href: string;
  text: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  dateTime?: string;
  member?: Pick<MemberType, 'name'>[];
}

export interface MemberType {
  id?: number;
  colorId?: string;
  href: string;
  name: string;
  hiragana: string;
  src: string;
}

export interface TicketType {
  id?: number;
  colorId?: string;
  href: string;
  date: string;
  text: string;
}

export interface MemberScheduleType {
  id?: number;
  memberId?: number;
  scheduleId?: number;
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
