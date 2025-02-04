<!-- components/LineChart.vue -->
<template>
    <canvas ref="chart"></canvas>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { Chart } from 'chart.js/auto';
  
  const props = defineProps(['data']);
  const chart = ref(null);
  
  onMounted(() => {
    new Chart(chart.value, {
      type: 'line',
      data: props.data,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  });
  </script>