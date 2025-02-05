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
          <UForm :state="form" @submit="simulateGame" class="space-y-4">
            <TeamForm 
              label="Home Team" 
              v-model="form.homeTeam"
            />
            <TeamForm
              label="Away Team"
              v-model="form.awayTeam"
            />
            
            <UButton 
              block
              class="text-black dark:bg-orange-300 dark:hover:bg-orange-400 transition-all duration-300 ease-in-out"
              icon="i-heroicons-play" 
              label="Start Simulation"
              type="submit"
              variant="outline"
              :loading="isSimulating"
            />

            <UAlert
              v-if="errorMessage"
              title="Error"
              :description="errorMessage"
              icon="i-heroicons-exclamation-triangle"
              color="red"
              variant="subtle"
            />
          </UForm>
        </div>

        <div class="col-span-3 flex flex-col space-y-4">
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

async function simulateGame() {
  isSimulating.value = true;
  try {
    const { data } = await useFetch('/api/simulate', {
      method: 'POST',
      body: {
        action: 'simulate',
        team1: form.value.homeTeam.name,
        team2: form.value.awayTeam.name,
        team1_tactics: form.value.homeTeam.tactics,
        team2_tactics: form.value.awayTeam.tactics,
        team1_lineup: form.value.homeTeam.lineup,
        team2_lineup: form.value.awayTeam.lineup
      }
    })

    console.log(data.value)
    
    // // 逐局显示结果
    for (let i = 0; i < data.value.innings.length; i++) {
      gameData.value = data.value;
      currentInning.value = data.value.innings[i].number;
      currentEvents.value = data.value.innings[i].events;
      currentEvent.value = data.value.innings[i].events[data.value.innings[i].events.length - 1];
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒更新一局
    }
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