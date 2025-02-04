<script setup>
    const downloadProgress = reactive({ startDate: '2020-01-01', endDate: '2024-12-31', current: 0, total: 0, status: 'idle', error: 0 });
    const downloading = ref(false);
    const downloadComplete = ref(false);
    const showDownloadProgress = computed(() => downloadProgress.status !== 'idle');

    const processProgress = reactive({ floder: '', current: 0, total: 0, status: 'idle', error: 0 });
    const processing = ref(false);
    const processComplete = ref(false);
    const showProcessProgress = computed(() => processProgress.status !== 'idle');

    const uploadProgress = reactive({ current: 0, total: 0, status: 'idle', error: 0 });
    const uploading = ref(false);
    const uploadComplete = ref(false);
    const showUploadProgress = computed(() => uploadProgress.status !== 'idle');

    const handleData = async (flag, complete, progress, body, type) => {
        try {
            flag = true;
            progress.total = 1;

            const { data } = await useFetch('/api/ragData', {
                method: 'POST',
                body
            });

            console.log(data.value);
            
            startProgressPolling(
                flag,
                complete,
                progress,
                { 
                    action: `get${type}Progress`,
                }
            );
        } 
        catch (error) {
            console.error(error);
        }
    };

    const startProgressPolling = (flag, complete, progress, body) => {
        const interval = setInterval(async () => {
            try {
                const { data }  = await useFetch('/api/ragData', {
                    method: 'POST',
                    body
                });

                console.log(data.value);
                if (!data.value.progress) return;

                progress.floder = data.value?.progress.floder || '';
                progress.current = data.value?.progress.currentGame || 0;
                progress.total = data.value?.progress.totalGames || 0;
                progress.status = data.value?.progress.status || 'idle';
                progress.error = data.value?.progress.error || 0;

                if (['completed', 'error'].includes(progress.status)) {
                    clearInterval(interval);
                    complete = progress.status === 'completed';
                    flag = false;
                }
            }
            catch (error) {
                console.error(error);
            }
        }, 1000);
    };
</script>

<template>
    <UCard>
        <template #header>
            <h1 class="ml-4 text-2xl font-bold">MLB Data Processing</h1>
        </template>

        <UCard>
            <template #header>
                <h1 class="ml-4 text-2xl font-bold">Historical Data Download</h1>
            </template>

            <UButton
                block
                label="Download Data"
                icon="i-heroicons-cloud-arrow-down"
                color="orange"
                :loading="downloading || downloadProgress.total != downloadProgress.current"
                :disabled="downloading"
                @click="handleData(
                    downloading,
                    downloadComplete,
                    downloadProgress,
                    { 
                        action: 'fetch',
                        startDate: downloadProgress.startDate,
                        endDate: downloadProgress.endDate
                    },
                    'Download'
                )"
            />

            <!-- Progress Display -->
            <Transition name="fade" class="mt-4">
                <div v-if="showDownloadProgress" class="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                        <div>
                            <span class="text-sm font-medium text-gray-600">Download Progress</span>
                            <span class="text-sm text-gray-600">({{ downloadProgress.startDate }} ~ {{ downloadProgress.endDate }})</span>
                        </div>

                        <span class="text-sm text-gray-600">
                        {{ downloadProgress.current }}/{{ downloadProgress.total }} ({{ Math.floor((downloadProgress.current / downloadProgress.total) * 100) }}%)
                        </span>
                    </div>
                    <UProgress 
                        :value="downloadProgress.current" 
                        :max="downloadProgress.total"
                    />
                </div>
            </Transition>

            <UAlert
                v-if="downloadComplete"
                title="Data Download Completed"
                description="You can start data preprocessing"
                icon="i-heroicons-check-badge"
                color="green"
                variant="subtle"
            />
        </UCard>

        <UCard class="mt-4">
            <template #header>
                <h1 class="ml-4 text-2xl font-bold">Data Preprocessing</h1>
            </template>

            <UButton
                block
                label="Preprocess Data"
                icon="i-heroicons-document-text"
                color="orange"
                :loading="processing || processProgress.total != processProgress.current"
                :disabled="processing || processProgress.total != processProgress.current"
                @click="handleData(
                    processing,
                    processComplete,
                    processProgress,
                    { 
                        action: 'preprocess'
                    },
                    'Preprocess'
                )"
            />

            <!-- Progress Display -->
            <Transition name="fade" class="mt-4">
                <div v-if="showProcessProgress" class="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                        <div>
                            <span class="text-sm font-medium text-gray-600">Preprocessing Progress</span>
                            <span class="text-sm text-gray-600">({{ processProgress.floder }})</span>
                        </div>

                        <span class="text-sm text-gray-600">
                        {{ processProgress.current }}/{{ processProgress.total }} ({{ Math.floor((processProgress.current / processProgress.total) * 100) }}%)
                        </span>
                    </div>
                    <UProgress 
                        :value="processProgress.current" 
                        :max="processProgress.total"
                    />
                </div>
            </Transition>

            <UAlert
                v-if="processComplete"
                title="Data Preprocessing Completed"
                description="You can start data upload"
                icon="i-heroicons-check-badge"
                color="green"
                variant="subtle"
            />
        </UCard>

        <UCard class="mt-4">
            <template #header>
                <h1 class="ml-4 text-2xl font-bold">Data Upload</h1>
            </template>

            <UButton
                block
                label="Upload Data"
                icon="i-heroicons-cloud-arrow-up"
                color="orange"
                :loading="uploading || uploadProgress.total != uploadProgress.current"
                :disabled="uploading || uploadProgress.total != uploadProgress.current"
                @click="handleData(
                    uploading,
                    uploadComplete,
                    uploadProgress,
                    { 
                        action: 'upload'
                    },
                    'Upload'
                )"
            />

            <!-- Progress Display -->
            <Transition name="fade" class="mt-4">
                <div v-if="showUploadProgress" class="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                        <div>
                            <span class="text-sm font-medium text-gray-600">Upload Progress</span>
                        </div>

                        <span class="text-sm text-gray-600">
                        {{ uploadProgress.current }}/{{ uploadProgress.total }} ({{ Math.floor((uploadProgress.current / uploadProgress.total) * 100) }}%)
                        </span>
                    </div>
                    <UProgress 
                        :value="uploadProgress.current" 
                        :max="uploadProgress.total"
                    />

                    <div v-if="uploadProgress.error > 0" class="text-red-500 text-sm">
                        <UIcon name="i-heroicons-exclamation-triangle" class="mr-2"/>
                        {{ uploadProgress.error }} errors occurred during upload
                    </div>
                </div>
            </Transition>

            <UAlert
                v-if="uploadComplete"
                title="Data Upload Completed"
                description="You can start game simulation"
                icon="i-heroicons-check-badge"
                color="green"
                variant="subtle"
            />
        </UCard>
    </UCard>
</template>