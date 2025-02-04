<!-- components/TeamForm.vue -->
<template>
    <UCard class="p-4">
      <template #header>
        <h3 class="text-lg font-semibold">{{ label }}</h3>
      </template>
  
      <div class="space-y-4">
        <!-- Team Name -->
        <UFormGroup label="Team Name" required>
          <UInput
            :model-value="modelValue.name"
            @update:model-value="(val) => updateField('name', val)"
            placeholder="Enter team name"
          />
        </UFormGroup>
  
        <!-- Tactics -->
        <UFormGroup label="Tactical Strategy" required>
          <UTextarea
            :model-value="modelValue.tactics"
            @update:model-value="(val) => updateField('tactics', val)"
            placeholder="Enter tactical strategy (e.g., Aggressive base running, Power hitting)"
            :rows="3"
          />
        </UFormGroup>
  
        <!-- Starting Lineup -->
        <UFormGroup label="Starting Lineup (Batting Order 1-9)">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <UInput
              v-for="(_, index) in 9"
              :key="index"
              :model-value="modelValue.lineup[index]"
              @update:model-value="(val) => updateLineup(index, val)"
              :label="`Batter ${index + 1}`"
              placeholder="Player name"
              required
            />
          </div>
        </UFormGroup>
      </div>
    </UCard>
  </template>
  
  <script setup lang="ts">
  // 类型定义
  interface TeamData {
    name: string
    tactics: string
    lineup: string[]
  }
  
  const props = defineProps({
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: Object as () => TeamData,
      required: true,
      default: () => ({
        name: '',
        tactics: '',
        lineup: Array(9).fill('')
      })
    }
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  // 更新字段通用方法
  const updateField = (field: keyof TeamData, value: string) => {
    emit('update:modelValue', { 
      ...props.modelValue,
      [field]: value 
    })
  }
  
  // 更新阵容特定位置
  const updateLineup = (index: number, value: string) => {
    const newLineup = [...props.modelValue.lineup]
    newLineup[index] = value
    emit('update:modelValue', {
      ...props.modelValue,
      lineup: newLineup
    })
  }
  </script>
  
  <style scoped>
  /* 自定义卡片阴影效果 */
  .card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
  }
  
  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  </style>