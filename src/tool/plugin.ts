import { invoke } from "@tauri-apps/api/core";
import * as cheerio from "cheerio";
import { IResult } from "../const/interface";
import STATIONS from "../const/station_name";
import { ElMessage } from "element-plus";
import { TYPE_CODE_MAPPING } from "../const/const";

export default class Plugin {
  static priceMax: number;
  static priceMin: number;

  static decodePrice(type1Code: string, type2Code: string) {
    const results = [];

    // 情况1：动车解析规则 - 两种code都有，并且都是字母开头
    if (
      type1Code &&
      type2Code &&
      /^[A-Za-z]/.test(type1Code) &&
      /^[A-Za-z]/.test(type2Code)
    ) {
      // 处理type1code (铺位编码)
      const bedSegments = type1Code.match(/.{7}/g) || [];
      for (const bedInfo of bedSegments) {
        //J301300--J3|01300
        const price = (parseInt(bedInfo.substr(2, 5)) / 10).toFixed(1);
        this.priceMax = Math.max(
          this.priceMax || parseFloat(price),
          parseFloat(price)
        );
        this.priceMin = Math.min(
          this.priceMin || parseFloat(price),
          parseFloat(price)
        );

        results.push({
          price: price,
          typeCode: bedInfo.substr(0, 2),
          status: "",
        });
      }

      const priceSegments = type2Code.match(/[A-Z]\d+/g) || [];
      for (const segment of priceSegments) {
        //J013000021O006500000--J|0130|00021O|00650|0000
        //I015000000--I|01500|0000
        const typeCode = segment.charAt(0);
        // 从末尾开始：最后4位是状态码，往前5位是价格
        const status = segment.slice(-4);
        const price = (parseInt(segment.slice(-9, -4)) / 10).toFixed(1);
        this.priceMax = Math.max(
          this.priceMax || parseFloat(price),
          parseFloat(price)
        );
        this.priceMin = Math.min(
          this.priceMin || parseFloat(price),
          parseFloat(price)
        );

        results.push({
          price: price,
          typeCode: typeCode,
          status: status,
        });
      }
    }
    // 情况2：传统快车 - 纯数字编码
    else if (
      type2Code &&
      /^\d+$/.test(type2Code) &&
      type1Code &&
      /^\d+$/.test(type1Code)
    ) {
      // 处理type1code (铺位编码)
      const bedSegments = type1Code.match(/.{7}/g) || [];
      for (const bedInfo of bedSegments) {
        // 3300925--33|00925
        const price = (parseInt(bedInfo.substr(2, 5)) / 10).toFixed(1);
        this.priceMax = Math.max(
          this.priceMax || parseFloat(price),
          parseFloat(price)
        );
        this.priceMin = Math.min(
          this.priceMin || parseFloat(price),
          parseFloat(price)
        );
        results.push({
          price: price,
          typeCode: bedInfo.substr(0, 2),
          status: "",
        });
      }

      // 处理type2code (价格编码)
      const priceSegments = type2Code.match(/.{10}/g) || [];
      for (const segment of priceSegments) {
        // 1004650000--1|00465|0000
        const price = (parseInt(segment.substr(1, 5)) / 10).toFixed(1);
        this.priceMax = Math.max(
          this.priceMax || parseFloat(price),
          parseFloat(price)
        );
        this.priceMin = Math.min(
          this.priceMin || parseFloat(price),
          parseFloat(price)
        );
        results.push({
          price: price,
          typeCode: segment.substr(0, 1),
          status: segment.substr(6, 4),
        });
      }
    }
    // 情况3：高铁 - 第一种code为空
    else if (!type1Code && type2Code) {
      const priceSegments = type2Code.match(/.{10}/g) || [];
      for (const segment of priceSegments) {
        //9045200005--9|04520|0005
        const price = (parseInt(segment.substr(1, 5)) / 10).toFixed(1);
        this.priceMax = Math.max(
          this.priceMax || parseFloat(price),
          parseFloat(price)
        );
        this.priceMin = Math.min(
          this.priceMin || parseFloat(price),
          parseFloat(price)
        );
        results.push({
          price: price,
          typeCode: segment.substr(0, 1),
          status: segment.substr(6, 4),
        });
      }
    }

    results.forEach((item) => {
      item.typeCode = `${
        TYPE_CODE_MAPPING[item.typeCode as keyof typeof TYPE_CODE_MAPPING]
      }(${item.typeCode})`;
    });

    return results;
  }

  static async searchTrains(fromCode: string, toCode: string, date: string) {
    this.priceMax = 0;
    this.priceMin = 0;
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
    //@ts-ignore
    $("tr").each((i, el) => {
      const no = $(el).find(".number").text(); //车次

      if (no !== "") {
        const yp_info_new = $(el).attr("yp_info_new");
        const bed_level_info = $(el).attr("bed_level_info");

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
        // console.log("raw_data", raw_data, format_raw_data);

        let tickets: Array<any> = [];
        tickets = tickets.concat(
          num_ticket
            //@ts-ignore
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
            //@ts-ignore
            .map((i, el) => {
              return {
                text: $(el).text(),
                label: $(el)
                  .attr("aria-label")
                  ?.toString()
                  .replace(/.*，(\w+)票价\d+元，余票(\d+).*/, "$1-余票$2"),
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
          priceCode: yp_info_new,
          bedCode: bed_level_info,
          seats: this.decodePrice(
            bed_level_info as string,
            yp_info_new as string
          ),
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
                //@ts-ignore
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
                //@ts-ignore
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
