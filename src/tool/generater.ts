import mergeImages from "merge-images";
import html2canvas from "html2canvas";

export default class Generater {
  static generateName(url: string) {
    const cleanUrl = url.replace(/^https?:\/\//, "").replace(/[^\w\d.-]/g, "_");
    let hash = 0;
    for (let i = 0; i < cleanUrl.length; i++) {
      const char = cleanUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const positiveHash = Math.abs(hash).toString(16);
    return positiveHash;
  }

  // 生成缩略图云
  static async generateThumbnailCloud(thumbnails: string[]): Promise<string> {
    try {
      // 将远程图片转换为本地base64
      const base64Images = await Promise.all(
        thumbnails.map(async (url) => {
          return new Promise<string>(async (resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.style.cssText = `
              width:300px;
              height:300px;
              object-fit: cover;
            `;
            document.body.appendChild(img); // 将图片添加到do
            img.onload = async () => {
              // // 创建canvas元素
              // const canvas = document.createElement("canvas");
              // canvas.width = img.naturalWidth || 300;
              // canvas.height = img.naturalHeight || 300;

              // // 获取2D上下文并绘制图片
              // const ctx = canvas.getContext("2d");
              // ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

              // // 转换为base64
              // const dataURL = canvas.toDataURL("image/png");
              // resolve(dataURL);
              // 创建一个容器来包裹图片，确保图片可见
              const container = document.createElement("div");
              container.style.cssText =
                "position: fixed; top: 0; left: 0; z-index: -1;";
              container.appendChild(img);
              document.body.appendChild(container);
              const canvas = await html2canvas(container, {
                backgroundColor: "#ffffff",
                useCORS: true,
                allowTaint: true,
                logging: true,
              });

              // 转换为base64
              const dataURL = canvas.toDataURL("image/png");
              document.body.removeChild(container);
              resolve(dataURL);
            };
            img.onerror = () => {
              console.error(`无法加载图片 ${url}`);
              // 返回一个透明的1x1像素图片作为替代
              resolve(
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              );
            };

            img.src = url;
          });
        })
      );
      console.log("已转换为本地base64", base64Images);

      // const img = new Image();
      // img.style.cssText = `
      //   width:300px;
      //   height:300px;
      //   object-fit: cover;
      // `;
      // document.body.appendChild(img); // 将图片添加到do
      // img.onload = async () => {};
      // img.src = base64Images[0];

      // 使用本地base64图片创建合并图像
      const images = base64Images.map((src) => {
        // 随机位置，避免所有图片堆叠在一起
        const x = Math.floor(Math.random() * 300);
        const y = Math.floor(Math.random() * 300);
        return {
          src,
          x,
          y,
        };
      });

      const base64 = await mergeImages(images, {
        width: 800,
        height: 600,
      });

      console.log("已生成图片云canvas", base64);

      return base64;
    } catch (error) {
      console.error("生成图片云失败:", error);
      return "";
    }
  }

  static generateTimeStyle = (time: string) => {
    if (!time) return {};

    // 解析时间
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    // 定义时间段及其对应的颜色
    const timeColors = {
      dawn: {
        // 凌晨 (0:00-6:00)
        background: "linear-gradient(to right, #1a237e, #283593)",
        color: "#ffffff",
      },
      morning: {
        // 早晨 (6:00-11:00)
        background: "linear-gradient(to right, #64b5f6, #90caf9)",
        color: "#000000",
      },
      noon: {
        // 中午 (11:00-13:00)
        background: "linear-gradient(to right, #4fc3f7, #29b6f6)",
        color: "#000000",
      },
      afternoon: {
        // 下午 (13:00-17:00)
        background: "linear-gradient(to right, #81d4fa, #4fc3f7)",
        color: "#000000",
      },
      evening: {
        // 傍晚 (17:00-19:00)
        background: "linear-gradient(to right, #ff9800, #f57c00)",
        color: "#ffffff",
      },
      night: {
        // 晚上 (19:00-24:00)
        background: "linear-gradient(to right, #1a237e, #0d47a1)",
        color: "#ffffff",
      },
    };

    // 根据时间返回对应的样式
    if (totalMinutes < 6 * 60)
      return { ...timeColors.dawn, padding: "4px 8px", borderRadius: "4px" };
    if (totalMinutes < 11 * 60)
      return { ...timeColors.morning, padding: "4px 8px", borderRadius: "4px" };
    if (totalMinutes < 13 * 60)
      return { ...timeColors.noon, padding: "4px 8px", borderRadius: "4px" };
    if (totalMinutes < 17 * 60)
      return {
        ...timeColors.afternoon,
        padding: "4px 8px",
        borderRadius: "4px",
      };
    if (totalMinutes < 19 * 60)
      return { ...timeColors.evening, padding: "4px 8px", borderRadius: "4px" };
    return { ...timeColors.night, padding: "4px 8px", borderRadius: "4px" };
  };
}
