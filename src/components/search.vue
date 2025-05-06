<template>
  <div class="search">
    <div class="search-form">
      <el-form :model="form" label-width="80px" class="inline-form">
        <el-form-item label="始发站">
          <el-input placeholder="请输入始发站" v-model="form.from"></el-input>
          <!-- <el-select
            v-model="form.from"
            filterable
            placeholder="请选择始发站"
            style="width: 120px"
          >
            <el-option
              v-for="item in stations"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select> -->
        </el-form-item>
        <el-form-item label="终点站">
          <el-input placeholder="请输入终点站" v-model="form.to"></el-input>

          <!-- <el-select
            v-model="form.to"
            filterable
            placeholder="请选择终点站"
            style="width: 120px"
          >
            <el-option
              v-for="item in stations"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select> -->
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
        </el-form-item>
      </el-form>
    </div>

    <div class="search-result" v-if="trainList.length">
      <el-table
        :data="trainList"
        style="width: 100%"
        height="calc(100vh - 100px)"
      >
        <el-table-column
          prop="trainNo"
          label="车次"
          width="120"
          align="center"
        ></el-table-column>

        <el-table-column align="center" prop="from" label="站点" width="200">
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
          width="120"
        ></el-table-column>
        <el-table-column
          prop="arrivalTime"
          label="到达时间"
          align="center"
          width="120"
        ></el-table-column>
        <el-table-column
          prop="duration"
          label="历时"
          align="center"
          width="120"
        ></el-table-column>
        <el-table-column label="票务信息">
          <template #default="scope">
            <el-tag
              v-for="(ticket, index) in scope.row.tickets"
              :key="index"
              size="small"
              class="ticket-tag"
              :type="ticket.text === '有' ? 'success' : 'info'"
            >
              {{ ticket.label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作">
          <template #default="scope">
            <el-button
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
              <p v-if="index !== 0">正在查询余票...</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup>
import { Right } from "@element-plus/icons-vue";
import { onMounted, ref, reactive } from "vue";
import Plugin from "../tool/plugin";

const bShowTimeLine = ref(false);

const form = reactive({
  from: "上海,SHH",
  to: "安庆,AQH",
  date: "2025-05-09",
});

const trainList = ref([]);
const stations = ref([]);
const currentTrain = ref({});

const handleSearch = async () => {
  trainList.value = await Plugin.searchTrains(form.from, form.to, form.date);
};

const handleSearchTicket = async (train) => {
  //
  currentTrain.value = train;
  stations.value = await Plugin.getStations();
  bShowTimeLine.value = true;

  console.log(stations.value);
};

onMounted(async () => {
  // 初始化逻辑
});
</script>

<style lang="less">
.search {
  padding: 20px;

  .search-form {
    text-align: center;

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
  }

  .ticket-tag {
    margin-right: 5px;
    margin-bottom: 5px;
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
}
</style>
