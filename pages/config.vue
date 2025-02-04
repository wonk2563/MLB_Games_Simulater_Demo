<!-- ~/pages/index.vue 前端优化 -->
<template>
    <UContainer class="py-8">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <UButton 
                class="dark:hover:bg-gray-600 transition-all duration-300 ease-in-out"
                icon="i-heroicons-arrow-left" 
                color="primary"
                variant="ghost"
                @click="router.push('/')"
              />
              <h1 class="ml-4 text-2xl font-bold">MLB System Status</h1>
            </div>
            <UButton 
              class="dark:hover:bg-gray-600 transition-all duration-300 ease-in-out"
              @click="checkIndexStatus"
              :disabled="loading"
              color="primary"
              variant="outline"
              size="lg"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" :class="loading ? 'animate-spin' : ''"/>
            </UButton>
          </div>
        </template>
  
        <!-- 状态显示 -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <UCard>
            <template #header>
              <h3 class="font-semibold">Index Status</h3>
            </template>
            <UBadge 
              :label="indexExists ? 'Created' : 'Not Ready'" 
              :color="indexExists ? 'green' : 'red'" 
              size="lg"
            />
          </UCard>
  
          <UCard>
            <template #header>
              <h3 class="font-semibold">Data Status</h3>
            </template>
            <UBadge 
              :label="indexHasData ? `${totalRecords} Records` : 'Empty Index'" 
              :color="indexHasData ? 'green' : 'yellow'" 
              size="lg"
            />
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">Vector Store Status</h3>
            </template>
            <UBadge 
              :label="storeIsExists ? 'Created' : 'Not Ready'" 
              :color="storeIsExists ? 'green' : 'red'" 
              size="lg"
            />
          </UCard>
        </div>
  
        <!-- 操作面板 -->
        <div class="space-y-4">
          <UAlert
            v-if="indexReady"
            title="System Ready"
            description="You can start game simulation"
            icon="i-heroicons-check-badge"
            color="green"
            variant="subtle"
          />

          <UAlert
            v-if="!indexReady && !loading && inited"
            title="System Not Ready"
            description="Please upload game data first"
            icon="i-heroicons-exclamation-triangle"
            color="orange"
            variant="subtle"
          />

          <UAlert
            v-if="!indexReady && !loading && !inited"
            title="System Not Ready"
            description="Please reinitialize"
            icon="i-heroicons-exclamation-triangle"
            color="orange"
            variant="subtle"
          />

          <UAlert
            v-if="!indexReady && loading"
            title="System Not Ready"
            description="Checking..."
            icon="i-heroicons-arrow-path"
            color="yellow"
            variant="subtle"
          />
        </div>
      </UCard>

      <MLBDataProcessor class="mt-6"/>
    </UContainer>
  </template>
  
  <script setup>
  const inited = ref(false);
  const loading = ref(false);
  const indexExists = ref(false);
  const indexHasData = ref(false);
  const storeIsExists = ref(false);
  const totalRecords = ref(0);
  const creatingIndex = ref(false);
  const uploadingData = ref(false);
  const progress = reactive({ current: 0, total: 0, error: 0, status: 'idle' });
  
  const router = useRouter();
  
  // 计算属性
  const anyOperationInProgress = computed(() => creatingIndex.value || uploadingData.value);
  const progressPercentage = computed(() => 
    Math.round((progress.current / progress.total) * 100) || 0
  );
  const progressColor = computed(() => {
    if (progress.status === 'error') return 'red';
    return progressPercentage.value === 100 ? 'green' : 'primary';
  });
  const showProgress = computed(() => progress.status !== 'idle');
  const indexReady = computed(() => indexExists.value && indexHasData.value && storeIsExists.value);
  
  // 初始化状态检查
  const checkIndexStatus = async () => {
    loading.value = true;

    const { data } = await useFetch('/api/simulate', { method: 'POST', body: { action: 'checkIndexStatus' } });
  
    indexExists.value = data.value?.indexIsExists || false;
    indexHasData.value = data.value?.totalRecords > 0;
    totalRecords.value = data.value?.totalRecords || 0;
    storeIsExists.value = data.value?.storeIsExists || false;
    
    inited.value = true;
    loading.value = false;
  };
  
  // 初始加载
  onMounted(() => checkIndexStatus());
  </script>
  
  <style>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>