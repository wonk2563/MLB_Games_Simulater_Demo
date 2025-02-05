<!-- components/ScoreBoard.vue -->
<template>
    <UCard class="my-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold">Scoreboard</h3>
          <UBadge variant="outline" size="lg">
             Current Inning: {{ currentInning }}
          </UBadge>
        </div>
      </template>
  
      <div class="overflow-x-auto">
        <table class="w-full text-center">
          <thead>
            <tr class="bg-gray-800">
              <th class="px-4 py-2">Team</th>
              <template v-for="i in 9" :key="i">
                <th class="px-4 py-2">{{ i }}</th>
              </template>
              <th class="px-4 py-2">R</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(team, index) in ['away', 'home']" :key="team">
              <td class="px-4 py-2 font-bold">
                {{ index === 0 ? awayTeam.name : homeTeam.name }}
              </td>
              <template v-for="inning in 9" :key="inning">
                <td 
                  :ref="el => { if (currentInning === inning) currentInningRef = el }"
                  class="px-4 py-2"
                  :class="{'bg-blue-50 text-black': currentInning === inning}"
                >
                  {{ getScore(team, inning) }}
                </td>
              </template>
              <td class="px-4 py-2 font-bold">
                {{ getTotalScore(team) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Current Event Description -->
      <div class="mt-4 text-center">
        <p class="text-lg font-bold">
          {{ currentEvent?.result || 'Waiting for game to start' }}
        </p>
      </div>
    </UCard>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue'

  interface Inning {
    number: number
    homeScore: number
    awayScore: number
  }
  
  const props = defineProps({
    innings: {
      type: Array as () => Inning[],
      required: true,
      default: () => []
    },
    homeTeam: {
      type: Object as () => {
        name: string
      },
      required: true
    },
    awayTeam: {
      type: Object as () => {
        name: string
      },
      required: true
    },
    currentInning: {
      type: Number,
      required: true
    },
    currentEvent: {
      type: Object,
      required: false,
      default: null
    }
  })

  const currentInningRef = ref<HTMLElement | null>(null)
  
  watch(() => props.currentInning, () => {
    // 使用 setTimeout 确保 DOM 更新后再滚动
    setTimeout(() => {
      if (currentInningRef.value) {
        currentInningRef.value.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }, 100)
  })
  
  const getScore = (team: string, inning: number) => {
    const inningData = props.innings.find(i => i.number === inning);
    if (!inningData) return '-';
    return team === 'home' ? inningData.homeScore : inningData.awayScore;
  }
  
  const getTotalScore = (team: string) => {
    return props.innings.reduce((total, inning) => {
      return total + (team === 'home' ? inning.homeScore : inning.awayScore);
    }, 0);
  }
  </script>
  
  <style scoped>
  .score-update-enter-active,
  .score-update-leave-active {
    transition: all 0.3s ease;
    position: absolute;
  }
  
  .score-update-enter-from {
    opacity: 0;
    transform: translateY(-10px);
  }
  
  .score-update-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
  
  .fade-move-enter-active {
    transition: all 0.3s ease;
  }
  
  .fade-move-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }
  
  /* 表格样式优化 */
  table {
    border-collapse: collapse;
  }
  
  th, td {
    border-bottom: 1px solid #e5e7eb;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  </style>