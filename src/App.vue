<template>
  <div class="app-container">
    <Search />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Config from "./tool/config";
import Search from "./components/search.vue";

onMounted(async () => {
  Config.applyTheme();
});
</script>

<style lang="less">
.app-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .main-content {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    // backdrop-filter: blur(10px);
  }
}
</style>
