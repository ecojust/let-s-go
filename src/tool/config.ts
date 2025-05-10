import { SYSTEM_THEMES, CONFIG_FILE_NAME } from "../const/const";
import { IThemeItem } from "../const/interface";
import File from "./file";

export default class Config {
  static async applyTheme() {
    const theme = "RandomImage";
    let content = "";
    const find = SYSTEM_THEMES.find((item: IThemeItem) => item.name === theme);
    if (find) {
      content = find.value;
    }
    const themeStyle = document.querySelector("#theme");
    if (themeStyle) {
      themeStyle.textContent = content;
    }
  }

  static async getConfig() {
    const res = await File._readFile(
      CONFIG_FILE_NAME,
      JSON.stringify({
        seat: ['二等座'],
        priceRange: {
          min: 0,
          max: 300,
        },
      })
    );
    return res;
  }

  static async setConfig(data: any) {
    await File._writeFile(CONFIG_FILE_NAME, JSON.stringify(data));
  }
}
