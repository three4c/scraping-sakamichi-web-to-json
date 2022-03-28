import puppeteer from "puppeteer";

export type SakamichiType = "nogizaka" | "hinatazaka";

export interface ScrapingInfoType {
  key: SakamichiType;
  url: string;
  fn: (page: puppeteer.Page) => Promise<FieldType[]>;
}

export interface FieldType {
  date: string;
  schedule: ScheduleType[];
}

export interface ScheduleType {
  href: string;
  category: string;
  time: string;
  text: string;
}
