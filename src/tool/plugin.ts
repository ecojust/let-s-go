import { invoke } from "@tauri-apps/api/core";
import * as cheerio from "cheerio";
import File from "./file";
import Config from "./config";
import {
  PLUGIN_FOLDER_NAME,
  DRAFT_PLUGIN_FILE,
  PLUGIN_USAGE_FILE,
} from "../const/const";
import { IPlugin, IResult, IPlayer } from "../const/interface";

export default class Plugin {
  static async searchTrains(from: string, to: string, date: string) {
    // const url = `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=%E4%B8%8A%E6%B5%B7,SHH&ts=%E5%A4%A9%E6%B4%A5,TJP&date=${date}&flag=N,N,Y`;
    const url = `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${from}&ts=${to}&date=${date}&flag=N,N,Y`;

    const result = (await invoke("fetch_url", {
      url: url,
    })) as IResult;
    if (!result.success || !result.data) {
      return [];
    }
    // 解析json
    const $ = cheerio.load(result.data);
    const arr: Array<any> = [];
    $("tr").each((i, el) => {
      const no = $(el).find(".number").text(); //车次

      if (no !== "") {
        const from_to = $(el).find(".cdz").find("strong"); //出发到达
        const start_end = $(el).find(".cds").find("strong"); //开始结束时间
        const ls = $(el).find(".ls").find("strong"); //历时

        const num_ticket = $(el).find(".t-num"); //  一等座 二等座 软卧 硬卧 硬座 无座
        const yes_ticket = $(el).find(".yes"); //  一等座 二等座 软卧 硬卧 硬座 无座

        let tickets: Array<any> = [];
        tickets = tickets.concat(
          num_ticket
            .map((i, el) => {
              return {
                text: $(el).text(),
                label: $(el).attr("aria-label")?.toString(),
              };
            })
            .get()
        );

        tickets = tickets.concat(
          yes_ticket
            .map((i, el) => {
              return {
                text: $(el).text(),
                label: $(el).attr("aria-label")?.toString(),
              };
            })
            .get()
        );

        arr.push({
          trainNo: no,
          from: from_to.eq(0).text(),
          to: from_to.eq(1).text(),
          departureTime: start_end.eq(0).text(),
          arrivalTime: start_end.eq(1).text(),
          duration: ls.eq(0).text(),
          tickets: tickets,
        });
      }
    });
    console.log(arr);

    return arr;
  }

  static async getStations() {
    const url =
      "https://kyfw.12306.cn/otn/czxx/queryByTrainNo?train_no=5l0000G104B2&from_station_telecode=AOH&to_station_telecode=TIP&depart_date=2025-05-08";
    const result = (await invoke("fetch_url", {
      url: url,
    })) as IResult;
    if (!result.success || !result.data) {
      return [];
    }
    const $ = cheerio.load(result.data);
    const response = $("pre").eq(0).text();
    const json = JSON.parse(response);
    return json?.data?.data || [];
  }
}
