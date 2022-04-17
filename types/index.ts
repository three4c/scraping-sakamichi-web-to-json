import puppeteer from "puppeteer";

export type GroupType =
  | "n_schedule"
  | "n_member"
  | "h_schedule"
  | "h_member"
  | "h_article";

export interface ObjType {
  name: "乃木坂46" | "日向坂46";
  color: "purple" | "blue";
  schedule: FieldType[] | MemberType[];
  member: FieldType[] | MemberType[];
}

export interface ScrapingInfoType {
  key: GroupType;
  url: string;
  fn: (page: puppeteer.Page) => Promise<FieldType[] | MemberType[]>;
}

export interface FieldType {
  date: string;
  schedule: ScheduleType[];
}

interface ScheduleType {
  href: string;
  category: string;
  time: string;
  text: string;
}

export interface MemberType {
  href: string;
  name: string;
  src: string;
}

declare global {
  interface Window {
    getToday: () => Promise<{
      year: number;
      month: number;
      day: number;
    }>;
  }
}
