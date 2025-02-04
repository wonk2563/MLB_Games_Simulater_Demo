<template>
  <UCard class="relative">
    <div class="relative w-full h-[400px]">
      <!-- Baseball Field Background -->
      <div class="absolute inset-0 bg-green-100">
        <!-- Infield Dirt -->
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-orange-200 rotate-45"></div>
        
        <!-- Bases -->
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <!-- Home Plate -->
          <div class="absolute left-0 top-[100px] w-6 h-6 bg-white border-2 border-gray-400 rotate-45"></div>
          
          <!-- First Base -->
          <div class="absolute left-[100px] top-0 w-6 h-6" :class="getBaseClass(1)"></div>
          
          <!-- Second Base -->
          <div class="absolute left-0 top-[-100px] w-6 h-6" :class="getBaseClass(2)"></div>
          
          <!-- Third Base -->
          <div class="absolute left-[-100px] top-0 w-6 h-6" :class="getBaseClass(3)"></div>
        </div>

        <!-- Runner Animations -->
        <TransitionGroup name="runner" tag="div">
          <div
            v-for="runner in activeRunners"
            :key="runner.id"
            class="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            :style="getRunnerPosition(runner)"
          ></div>
        </TransitionGroup>

        <!-- Ball Event Animations -->
        <TransitionGroup name="ball" tag="div">
          <div
            v-for="ball in activeBalls"
            :key="ball.id"
            class="absolute w-2 h-2 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
            :style="getBallPosition(ball)"
          ></div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Current Event Description -->
    <div class="mt-4 text-center">
      <p class="text-lg font-bold">{{ currentEvent?.result || 'Waiting for game to start' }}</p>
    </div>
  </UCard>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
});

const currentEvent = ref(null);
const activeRunners = ref([]);
const activeBalls = ref([]);
const baseStates = ref({1: false, 2: false, 3: false});

// 監聽事件變化
watch(() => props.events, (newEvents) => {
  if (!newEvents || newEvents.length === 0) return;
  
  // 處理最新事件
  const event = newEvents[newEvents.length - 1];
  currentEvent.value = event;
  
  // 更新壘包狀態
  updateBaseStates(event);
  
  // 如果是擊球事件，添加球的動畫
  if (event.coordinates) {
    animateBall(event);
  }
  
  // 如果有跑者移動，添加跑者動畫
  if (event.runners) {
    animateRunners(event.runners);
  }
}, { deep: true });

function getBaseClass(base) {
  return {
    'absolute': true,
    'w-6': true,
    'h-6': true,
    'bg-white': !baseStates.value[base],
    'bg-red-500': baseStates.value[base],
    'border-2': true,
    'border-gray-400': true,
    'transform': true,
    'rotate-45': true,
    'transition-colors': true,
    'duration-300': true
  };
}

function updateBaseStates(event) {
  if (!event.runners) return;
  
  // 重置壘包狀態
  baseStates.value = {1: false, 2: false, 3: false};
  
  // 更新當前壘包狀態
  event.runners.forEach(runner => {
    if (runner.to > 0 && runner.to < 4) {
      baseStates.value[runner.to] = true;
    }
  });
}

function animateBall(event) {
  const ball = {
    id: Date.now(),
    x: 50,
    y: 90,
    targetX: event.coordinates.x,
    targetY: event.coordinates.y,
    height: Math.random() * 20 + 30,
    progress: 0
  };
  
  activeBalls.value.push(ball);
  
  let startTime = null;
  const duration = 1500;
  
  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    ball.progress = progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        activeBalls.value = activeBalls.value.filter(b => b.id !== ball.id);
      }, 500);
    }
  }
  
  requestAnimationFrame(animate);
}

function animateRunners(runners) {
  activeRunners.value = runners.map(runner => ({
    id: `${runner.player}-${Date.now()}`,
    from: runner.from,
    to: runner.to,
    progress: 0,
    speed: Math.random() * 0.3 + 0.7,
    bounceHeight: 2,
    startTime: Date.now()
  }));

  activeRunners.value.forEach(runner => {
    animateRunner(runner);
  });
}

function animateRunner(runner) {
  const duration = 2000 * runner.speed;
  
  function animate() {
    const elapsed = Date.now() - runner.startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    runner.progress = progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        activeRunners.value = activeRunners.value.filter(r => r.id !== runner.id);
      }, 500);
    }
  }
  
  requestAnimationFrame(animate);
}

function getBallPosition(ball) {
  const startX = 50;
  const startY = 75;
  const progress = ball.progress;
  
  const x = startX + (ball.targetX - startX) * progress;
  const y = startY + (ball.targetY - startY) * progress;
  
  const heightOffset = Math.sin(progress * Math.PI) * ball.height;
  
  return {
    left: `${x}%`,
    top: `${y - heightOffset}%`,
    transform: `scale(${1 - progress * 0.3})`,
    opacity: 1 - progress * 0.3
  };
}

function getRunnerPosition(runner) {
  const basePositions = {
    0: { x: 50, y: 75 },
    1: { x: 65, y: 50 },
    2: { x: 50, y: 25 },
    3: { x: 35, y: 50 }
  };
  
  const from = basePositions[runner.from];
  const to = basePositions[runner.to];
  
  const progress = runner.progress;
  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;
  
  const bounce = Math.sin(progress * Math.PI * 8) * runner.bounceHeight;
  
  return {
    left: `${x}%`,
    top: `${y - bounce}%`,
    transform: `scale(${1 + Math.sin(progress * Math.PI * 8) * 0.1})`
  };
}
</script>

<style scoped>
.runner-enter-active,
.runner-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.runner-enter-from,
.runner-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.ball-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ball-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ball-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
}

.ball-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.runner-shadow {
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 8px;
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  transform: translateX(-50%) scale(1);
  transition: all 0.3s ease;
}

@keyframes trail {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

.ball::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: inherit;
  animation: trail 0.3s ease-out forwards;
}
</style>