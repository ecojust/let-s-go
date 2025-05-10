import {
  readFile,
  writeFile,
  mkdir,
  readDir,
  BaseDirectory,
  DirEntry,
  remove,
} from "@tauri-apps/plugin-fs";
import { IResult } from "../const/interface";

export default class File {
  static async _deleteFile(file: string) {
    try {
      await remove(file, {
        baseDir: BaseDirectory.Resource,
      });
      return {
        success: true,
        message: "删除成功",
        data: "",
      };
    } catch (error) {
      return {
        success: false,
        message: "删除失败",
        data: error?.toString() as string,
      };
    }
  }

  static async write_test(file: string, content: string) {
    try {
      // 确保目录存在
      const prePath = file.split("/").slice(0, -1).join("/");
      if (prePath) {
        try {
          await mkdir(prePath, {
            recursive: true,
            baseDir: BaseDirectory.Resource,
          });
        } catch (error) {
          console.error("创建目录失败:", error);
        }
      }

      await writeFile(file, new TextEncoder().encode(content), {
        baseDir: BaseDirectory.Resource,
      });
      console.log("文件写入成功:", file);
    } catch (error) {
      console.error("文件写入失败:", error);
      throw error;
    }
  }

  static async _writeFile(
    file: string,
    content: string
  ): Promise<IResult | null> {
    let res: IResult | null = null;
    try {
      const prePath = file.split("/").slice(0, -1).join("/");
      if (prePath) {
        await this._readDir(prePath);
      }
      console.log("_writeFile", file, content);
      await writeFile(file, new TextEncoder().encode(content), {
        baseDir: BaseDirectory.Resource,
      });
      res = {
        success: true,
        message: "写入成功",
        data: content,
      };
    } catch (error) {
      console.log("error", error);
      res = {
        success: false,
        message: "写入失败",
        data: error?.toString() as string,
      };
    } finally {
      return res;
    }
  }

  static async _readFile(
    file: string,
    default_value?: string
  ): Promise<IResult | null> {
    let res: IResult | null = null;
    let content = default_value || "";
    try {
      content = new TextDecoder("utf-8").decode(
        await readFile(file, { baseDir: BaseDirectory.Resource })
      );
      res = {
        success: true,
        message: "读取成功",
        data: content,
      };
    } catch (error) {
      res = await this._writeFile(file, content);
    } finally {
      return res;
    }
  }

  static async _readDir(dir: string): Promise<Array<DirEntry>> {
    let entries: Array<DirEntry> = [];
    try {
      const res = await readDir(dir, {
        baseDir: BaseDirectory.Resource,
      });
      entries = res;
    } catch (error) {
      await mkdir(dir, {
        recursive: true,
        baseDir: BaseDirectory.Resource,
      });
      entries = [];
    } finally {
      return entries;
    }
  }
}
