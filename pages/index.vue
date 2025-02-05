<template>
  <UContainer class="py-8">
    <UCard class="my-4">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold">MLB Game Simulator</h1>
          <UButton
            class="dark:hover:bg-gray-600 transition-all duration-300 ease-in-out"
            @click="router.push('/config')"
            color="gray"
            icon="i-heroicons-cog"
            variant="outline"
          />
        </div>
      </template>

      <div class="grid grid-cols-5 gap-4">
        <div class="col-span-2 flex flex-colspace-y-4">
          <UForm :state="form" class="space-y-4">
            <TeamForm 
              label="Home Team" 
              v-model="form.homeTeam"
            />
            <TeamForm
              label="Away Team"
              v-model="form.awayTeam"
            />
          </UForm>
        </div>

        <div class="col-span-3 flex flex-col space-y-8">
          <div class="flex flex-col space-y-4">
            <UButton 
              block
              class="text-black dark:bg-orange-300 dark:hover:bg-orange-400 transition-all duration-300 ease-in-out"
              icon="i-heroicons-play" 
              label="Start Simulation"
              variant="outline"
              size="xl"
              :loading="isSimulating"
              @click="simulateGame"
            />

            <UAlert
              v-if="errorMessage"
              title="Error"
              :description="errorMessage"
              icon="i-heroicons-exclamation-triangle"
              color="red"
              variant="subtle"
            />

            <!-- Progress Display -->
            <Transition name="fade">
                <div v-if="isSimulating" class="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600">Simulation Progress</span>

                        <span class="text-sm text-gray-600">
                        {{ inningProgress }}/{{ 9 }} ({{ Math.floor((inningProgress / 9) * 100) }}%)
                        </span>
                    </div>
                    <UProgress 
                        :value="inningProgress" 
                        :max="9"
                    />
                </div>
            </Transition>
          </div>

          <Transition name="slide-fade">
            <ScoreBoard
              :innings="gameData.innings" 
              :homeTeam="form.homeTeam" 
              :awayTeam="form.awayTeam" 
              :currentInning="currentInning"
              :currentEvent="currentEvent"
            />
          </Transition>

          <BaseballField :events="currentEvents" class="mt-8" />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup>
const router = useRouter();
const errorMessage = ref(null);
const form = ref({
  homeTeam: { 
    name: 'Arizona Diamondbacks', 
    tactics: 'Aggressive base stealing and bunting strategy', 
    lineup: ['Jonah Heim', 'Jayson McKinley', 'Mike Leake', 'Riley Smith', 'Jorge Mateo', 'Bo Takahashi', 'Kevin Cron', 'Colton Turner', 'Emilio Vargas'] 
  },
  awayTeam: { 
    name: 'Oakland Athletics', 
    tactics: 'Power lineup with a starting pitcher rotation strategy', 
    lineup: ['Aaron Judge', 'Anthony Rizzo', 'Giancarlo Stanton', 'Joc Pederson', 'Bryce Harper', 'Trea Turner', 'Adam Wainwright', 'Daulton Varsho', 'Shohei Ohtani'] 
  }
});

const gameData = ref({innings: []});
const currentInning = ref(1);
const currentEvents = ref([]);
const currentEvent = ref(null);
const isSimulating = ref(false);
const inningProgress = ref(0);

async function simulateGame() {
  isSimulating.value = true;
  errorMessage.value = null;
  inningProgress.value = 0;

  const allInnings = [];
  const maxRetries = 3; // 最大重试次数

  try {
    // 先模拟所有局数
    for (let inning = 1; inning <= 9; inning++) {
      let retryCount = 0;
      let inningData = null;
      
      while (retryCount < maxRetries) {
        try {
          const { data } = await useFetch('/api/simulate', {
            method: 'POST',
            body: {
              action: 'simulate',
              inning: inning,
              team1: form.value.homeTeam.name,
              team2: form.value.awayTeam.name,
              team1_tactics: form.value.homeTeam.tactics,
              team2_tactics: form.value.awayTeam.tactics,
              team1_lineup: form.value.homeTeam.lineup,
              team2_lineup: form.value.awayTeam.lineup,
              generatedGames: JSON.stringify(allInnings)
            }
          });

          if (data.value && data.value.code === 200) {
            inningData = data.value.result;
            break; // 成功获取数据，跳出重试循环
          } else {
            throw new Error(data.value?.message || 'simulate error');
          }
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(`Failed to get ${inning} data after ${maxRetries} retries: ${error.message}`);
          }
          // 等待短暂时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      allInnings.push(inningData);
      inningProgress.value = inning;
    }

    // 所有局数模拟完成后，逐局更新显示
    gameData.value = { innings: [] };
    for (let i = 0; i < allInnings.length; i++) {
      gameData.value.innings.push(allInnings[i]);
      console.log(gameData.value.innings);
      currentInning.value = i + 1;
      currentEvents.value = allInnings[i].events;
      currentEvent.value = allInnings[i].events[allInnings[i].events.length - 1];
      
      // 等待3秒后显示下一局
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message;
  } finally {
    isSimulating.value = false;
  }
}
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>