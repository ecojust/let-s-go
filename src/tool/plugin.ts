import { invoke } from "@tauri-apps/api/core";
import * as cheerio from "cheerio";
import { IResult } from "../const/interface";
import STATIONS from "../const/station_name";
import { ElMessage } from "element-plus";

export default class Plugin {
  static async searchTrains(fromCode: string, toCode: string, date: string) {
    const from = STATIONS.find((item) => item.code === fromCode)?.name;
    const to = STATIONS.find((item) => item.code === toCode)?.name;
    if (!from || !to) {
      return [];
    }
    // const url = `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=%E4%B8%8A%E6%B5%B7,SHH&ts=%E5%A4%A9%E6%B4%A5,TJP&date=${date}&flag=N,N,Y`;
    const url = `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${from},${fromCode}&ts=${to},${toCode}&date=${date}&flag=N,N,Y`;

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

        const raw_data: any = $(el).find(".number").eq(0).attr("onclick") || "";
        //myStopStation.open('1','55000G312403','SHH','AQH','20250520','3');

        const format_raw_data =
          raw_data
            .match(/'([^']+)'/g)
            ?.map((param: string) => param.replace(/'/g, "")) || [];
        console.log("raw_data", raw_data, format_raw_data);

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
          raw_data: {
            train_no: format_raw_data[1],
            from_station_telecode: format_raw_data[2],
            to_station_telecode: format_raw_data[3],
          },
        });
      }
    });
    console.log(arr);

    return arr;
  }

  static async getStations(
    train_no: string,
    fromCode: string,
    toCode: string,
    date: string
  ) {
    const url = `https://kyfw.12306.cn/otn/czxx/queryByTrainNo?train_no=${train_no}&from_station_telecode=${fromCode}&to_station_telecode=${toCode}&depart_date=${date}`;
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

  static async searchTickets(
    trainNo: string,
    stations: Array<any>,
    fromCode: string,
    date: string,
    callback: Function
  ) {
    const from = STATIONS.find((item) => item.code === fromCode)?.name;
    console.log("from", from);
    let startIndex = stations.findIndex((item: any) => {
      return item.station_name === from;
    });

    if (startIndex === -1) {
      startIndex = 0;
    }

    for (let i = startIndex + 1; i < stations.length; i++) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * 5000 + 3000);
      });
      const item = stations[i];
      const to = item.station_name;
      const toCode = STATIONS.find((item) => item.name === to)?.code;
      ElMessage.info(`开始查询 ${from} 到 ${to} 的车次`);

      console.log(`开始查询 ${from} 到 ${to} 的车次`);

      const url = `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${from},${fromCode}&ts=${to},${toCode}&date=${date}&flag=N,N,Y`;
      const result = (await invoke("fetch_url", {
        url: url,
      })) as IResult;
      if (!result.success || !result.data) {
        return [];
      }
      // 解析json
      const $ = cheerio.load(result.data);
      let tickets: Array<any> = [];

      $("tr")
        .get()
        .forEach((el) => {
          const no = $(el).find(".number").text(); //车次
          if (no === trainNo) {
            const num_ticket = $(el).find(".t-num"); //  一等座 二等座 软卧 硬卧 硬座 无座
            const yes_ticket = $(el).find(".yes"); //  一等座 二等座 软卧 硬卧 硬座 无座
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
          }
        });

      callback &&
        callback({
          trainNo: trainNo,
          from: from,
          to: to,
          tickets: tickets,
        });
    }
  }
}
