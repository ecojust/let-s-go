<template>
  <div class="search">
    <div class="search-form">
      <el-form :model="form" label-width="80px" class="inline-form">
        <el-form-item label="始发站">
          <!-- <el-input placeholder="请输入始发站" v-model="form.from"></el-input> -->
          <el-select-v2
            :options="fixstation"
            v-model="form.from"
            filterable
            placeholder="请选择终点站"
            style="width: 120px"
            :height="300"
          >
          </el-select-v2>
        </el-form-item>
        <el-form-item label="终点站">
          <!-- <el-input placeholder="请输入终点站" v-model="form.to"></el-input> -->
          <el-select-v2
            :options="fixstation"
            v-model="form.to"
            filterable
            placeholder="请选择终点站"
            style="width: 120px"
            :height="300"
          >
          </el-select-v2>
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 160px"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="info" @click="showSettings">设置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="search-result" v-if="trainList.length && showResult">
      <el-table
        border
        :data="trainList"
        style="width: 100%"
        height="calc(100vh - 130px)"
      >
        <el-table-column
          prop="trainNo"
          label="车次"
          width="80"
          align="center"
        ></el-table-column>

        <el-table-column align="center" prop="from" label="站点" width="250">
          <template #default="scope">
            <el-tag>
              {{ scope.row.from }}
            </el-tag>

            <el-icon class="arrow-icon"><Right /></el-icon>
            <el-tag>
              {{ scope.row.to }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="departureTime"
          label="出发时间"
          align="center"
          width="100"
        >
          <template #default="scope">
            <span :style="getTimeStyle(scope.row.departureTime)">
              {{ scope.row.departureTime }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="arrivalTime"
          label="到达时间"
          align="center"
          width="100"
        >
          <template #default="scope">
            <span :style="getTimeStyle(scope.row.arrivalTime)">
              {{ scope.row.arrivalTime }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="duration"
          label="历时"
          align="center"
          width="100"
        ></el-table-column>

        <el-table-column label="坐席&票价" align="center">
          <template #default="scope">
            <!-- <div>bedCode ： {{ scope.row.bedCode }}</div>
            <div>priceCode ： {{ scope.row.priceCode }}</div> -->

            <div class="seats">
              <div
                v-for="(seat, index) in scope.row.seats"
                :key="index"
                :class="[
                  ticketTypes.some((item) => seat.typeCode.includes(item))
                    ? ''
                    : 'opacity-05',
                  'seat-type ticket-tag price-progress-tag',
                  priceMax == seat.price ? 'is-max' : '',
                  priceMin == seat.price ? 'is-min' : '',
                ]"
                :style="{
                  '--progress': getPricePosition(seat.price, true) * 100 + '%',
                }"
              >
                {{ seat.typeCode }}:{{ seat.price }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="余票信息" width="300">
          <template #default="scope">
            <span v-for="(ticket, index) in scope.row.tickets" :key="index">
              <el-tag
                :class="[
                  ticketTypes.some((item) => ticket.label.includes(item))
                    ? ''
                    : 'opacity-05',
                  'price-progress-tag',
                ]"
                size="small"
                class="ticket-tag"
                :type="ticket.text === '有' ? 'success' : 'warning'"
              >
                {{ ticket.label }}
              </el-tag>
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center">
          <template #default="scope">
            <el-button
              :disabled="
                !scope.row.raw_data.train_no ||
                !scope.row.raw_data.from_station_telecode ||
                !scope.row.raw_data.to_station_telecode
              "
              type="primary"
              size="small"
              @click="handleSearchTicket(scope.row)"
              >查看沿途余票</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      :close-on-click-modal="false"
      align-center
      v-model="bShowTimeLine"
      class="time-line-dialog"
    >
      <div class="title">
        <h1>{{ currentTrain.trainNo }}</h1>
        <div class="sub-title">
          {{ currentTrain.from }}
          <el-icon class="arrow-icon"><Right /></el-icon> {{ currentTrain.to }}
        </div>
      </div>

      <el-scrollbar :wrap-style="{ height: 'calc(100vh - 240px)' }">
        <el-timeline style="max-width: 800px">
          <el-timeline-item
            v-for="(station, index) in stations"
            :key="index"
            :timestamp="station.arrive_time"
            placement="top"
          >
            <el-card>
              <h4>{{ station.start_station_name || station.station_name }}</h4>

              <div class="message">
                {{ tickets[station.station_name]?.message }}
              </div>

              <span
                v-for="(ticket, index) in tickets[station.station_name]
                  ?.tickets"
                :key="index"
              >
                <el-tag
                  v-show="
                    ticketTypes.some((item) => ticket.label.includes(item))
                  "
                  size="small"
                  :class="['ticket-tag', 'price-progress-tag']"
                  :type="ticket.text === '有' ? 'success' : 'info'"
                >
                  {{ ticket.label }}
                </el-tag>
              </span>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-scrollbar>
    </el-dialog>

    <el-dialog
      title="车票相关设置"
      v-model="showSettingsDialog"
      width="600px"
      align-center
    >
      <div class="ticket-settings">
        <h4>车票类型设置</h4>

        <el-checkbox-group v-model="ticketTypes">
          <el-checkbox label="商务座">商务座</el-checkbox>
          <el-checkbox label="一等座">一等座</el-checkbox>
          <el-checkbox label="二等座">二等座</el-checkbox>
          <el-checkbox label="硬座">硬座</el-checkbox>
          <el-checkbox label="硬卧">硬卧</el-checkbox>
          <el-checkbox label="软座">软座</el-checkbox>
          <el-checkbox label="软卧">软卧</el-checkbox>
          <el-checkbox label="无座">无座</el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="price-settings">
        <h4>票价区间设置</h4>
        <div class="price-range">
          <el-form-item label="最低价格">
            <el-input-number
              v-model="priceRange.min"
              :min="0"
              :step="10"
              controls-position="right"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="最高价格">
            <el-input-number
              v-model="priceRange.max"
              :min="0"
              :step="10"
              controls-position="right"
            ></el-input-number>
          </el-form-item>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettingsDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Right } from "@element-plus/icons-vue";
import { onMounted, ref, reactive, nextTick } from "vue";
import Plugin from "../tool/plugin";
import Config from "../tool/config";
import Generater from "../tool/generater";
import STATIONS from "../const/station_name";
import { ElLoading } from "element-plus";

const bShowTimeLine = ref(false);
const showSettingsDialog = ref(false);

const ticketTypes = ref(["二等座"]);
const priceRange = ref({
  min: 0,
  max: 1000,
});

const form = reactive({
  from: "NJH",
  to: "SHH",
  date: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })(),
});

const trainList = ref([]);
const stations = ref([]);
const currentTrain = ref({});
const fixstation = ref(STATIONS);
const showResult = ref(true);
const tickets = ref({});

const getTimeStyle = (time) => {
  return Generater.generateTimeStyle(time);
};

// 计算价格在区间中的位置（0-1之间）
const getPricePosition = (label, isNumber) => {
  if (isNumber) {
    const { min, max } = priceRange.value;
    const range = max - min;
    if (range <= 0) return 0;
    return Math.min(Math.max((label - min) / range, 0), 1);
  }
  // 检查标签是否包含票价信息
  if (!label.includes("票价")) return 0;

  // 提取票价数值
  const priceMatch = label.match(/票价([\d.]+)元/);
  if (!priceMatch) return 0;

  const price = parseFloat(priceMatch[1]);
  const { min, max } = priceRange.value;

  // 计算价格在区间中的位置（0-1之间）
  const range = max - min;
  if (range <= 0) return 0;

  return Math.min(Math.max((price - min) / range, 0), 1);
};

// 根据票价返回对应的样式
const getPriceStyle = (label) => {
  // 检查标签是否包含票价信息
  if (!label.includes("票价")) return {};

  // 提取票价数值
  const priceMatch = label.match(/票价(\d+)元/);
  if (!priceMatch) return {};

  const price = parseInt(priceMatch[1]);
  const { min, max } = priceRange.value;

  // 计算价格在区间中的位置（0-1之间）
  const range = max - min;
  if (range <= 0) return {};

  const position = Math.min(Math.max((price - min) / range, 0), 1);

  // 根据位置计算颜色，只使用红色深浅来表示价格
  const redIntensity = Math.round(255 * (1 - position));
  return { color: `rgb(255, ${redIntensity}, ${redIntensity})` };
};

const showSettings = () => {
  showSettingsDialog.value = true;
};

const saveSettings = async () => {
  // const loadingInstance = ElLoading.service({
  //   lock: true,
  //   text: "保存中...",
  //   background: "rgba(0, 0, 0, 0.7)",
  // });
  // nextTick(() => {});
  showResult.value = false;
  showSettingsDialog.value = false;
  const res = await Config.getConfig();
  if (res.success) {
    const data = JSON.parse(res.data);
    data.seat = ticketTypes.value;
    data.priceRange = priceRange.value;

    console.log("ticketTypes.value", ticketTypes.value);
    console.log("priceRange.value", priceRange.value);
    await Config.setConfig(data);
  }
  showResult.value = true;
  // nextTick(() => {
  //   loadingInstance.close();
  // });
};

const priceMax = ref(0);
const priceMin = ref(0);

const handleSearch = async () => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: "正在查询...",
    background: "rgba(0, 0, 0, 0.7)",
  });
  trainList.value = [];
  const list = await Plugin.searchTrains(form.from, form.to, form.date);
  priceMax.value = Plugin.priceMax;
  priceMin.value = Plugin.priceMin;
  priceRange.value.min = priceMin.value;
  trainList.value = list;
  nextTick(async () => {
    loadingInstance.close();
    const res = await Config.getConfig();
    if (res.success) {
      const data = JSON.parse(res.data);
      data.search = {
        from: form.from,
        to: form.to,
      };
      data.priceRange = data.priceRange || {
        min: 0,
        max: 300,
      };
      data.priceRange.min = priceMin.value;
      console.log("priceRange.value", priceRange.value);
      await Config.setConfig(data);
    }
  });
};

const handleSearchTicket = async (train) => {
  //
  if (
    !train.raw_data.train_no ||
    !train.raw_data.from_station_telecode ||
    !train.raw_data.to_station_telecode
  ) {
    return;
  }
  currentTrain.value = train;
  stations.value = await Plugin.getStations(
    train.raw_data.train_no,
    train.raw_data.from_station_telecode,
    train.raw_data.to_station_telecode,
    form.date
  );
  tickets.value = {};
  bShowTimeLine.value = true;

  await Plugin.searchTickets(
    currentTrain.value.trainNo,
    stations.value,
    form.from,
    form.date,
    (data) => {
      tickets.value[data.to] = {
        message: `车次【${data.trainNo}】从${data.from}到${data.to}的余票查询结束`,
        tickets: data.tickets,
      };
    }
  );
};

onMounted(async () => {
  // 初始化逻辑
  // 加载保存的车票类型设置
  const res = await Config.getConfig();
  if (res.success) {
    const data = JSON.parse(res.data);
    ticketTypes.value = data.seat || ["二等座"];
    priceRange.value = data.priceRange || { min: 0, max: 300 };
    form.from = data.search?.from || "NJH";
    form.to = data.search?.to || "SHH";
  }
});
</script>

<style lang="less">
.search {
  padding: 20px;

  .search-form {
    text-align: center;
    background: linear-gradient(to right, #f8f9fa, #e9ecef);
    border-radius: 8px;
    padding: 20px 0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .inline-form {
      display: inline-flex;
      align-items: center;
      gap: 15px;

      .el-form-item {
        margin-bottom: 0;
        margin-right: 0;
      }
    }
  }

  .search-result {
    margin-top: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  .seats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    .seat-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 5px;
      margin-bottom: 5px;
      border: 1px solid #ccc;
      cursor: default;
    }
    .seat-type.is-max {
      background: red;
      color: white;
      border-color: red;
    }

    .seat-type.is-min {
      background: rgb(0, 255, 21);
      color: white;
      border-color: rgb(0, 255, 21);
    }
  }

  .ticket-tag {
    margin-right: 5px;
    margin-bottom: 5px;
    position: relative;
    overflow: hidden;

    &.price-progress-tag::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: var(--progress, 0%);
      height: 3px;
      background-color: red;
      border-radius: 0 1px 1px 0;
      transition: width 0.3s ease;
    }
  }
  .opacity-05 {
    opacity: 0.2;
    display: none !important;
  }

  .station-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .arrow-icon {
    margin: 0 8px;
    vertical-align: middle;
  }

  .time-line-dialog {
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      h1 {
        font-size: 24px;
        margin: 0;
      }
      .sub-title {
        font-size: 14px;
        color: #999;
      }
    }
  }

  .price-settings {
    margin-top: 20px;

    h4 {
      margin-bottom: 15px;
    }

    .price-range {
      display: flex;
      gap: 20px;
    }
  }
}
</style>
