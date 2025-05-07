import { SYSTEM_THEMES } from "../const/const";

import { IThemeItem } from "../const/interface";

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
}
