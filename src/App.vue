<template>
  <div class="app-container">
    <Search />
    <img :src="img" alt="" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Config from "./tool/config";
import Search from "./components/search.vue";
import img from "./assets/logo.png";

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
  > img {
    width: 128px;
    height: 128px;
    margin: 0 auto;
    position: absolute;
    overflow: hidden;
    bottom: 20px;
    right: 20px;
    transition: all 0.3s;
    z-index: 100;
    pointer-events: none;
  }
}
</style>
