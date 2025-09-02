<template>
  <div class="p-4">
    <h2 class="text-lg font-semibold mb-4">Set Schedule</h2>
    <div class="overflow-x-auto">
      <table class="border-collapse">
        <thead>
          <tr>
            <th class="w-12"></th>
            <th class="border text-xs px-2 py-1 text-gray-600">All Day</th>

            <th
              v-for="hoursSet in 8"
              :key="hoursSet"
              class="border text-xs px-2 py-1 text-gray-600 text-center"
              :colspan="3"
            >
              {{ String((hoursSet - 1) * 3).padStart(2, "0") }}:00
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(events, day) in localDaysCopy" :key="day">
            <td class="border text-center bg-gray-100 text-sm font-medium">
              {{ day.toUpperCase() }}
            </td>

            <td
              class="border cursor-pointer w-12 text-center bg-gray-400 text-sm font-medium"
            ></td>

            <template v-for="hoursSet in 8" :key="hoursSet">
              <td
                v-for="hour in 3"
                :key="hour"
                class="border w-4 h-8 cursor-pointer"
              ></td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        @click="clearSelection"
      >
        Clear
      </button>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="saveChanges"
      >
        Save Changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeekSchedule } from "@/types/calendar";
import { ref } from "vue";

interface Props {
  days: WeekSchedule;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update", days: WeekSchedule): void;
}>();

const localDaysCopy = ref<WeekSchedule>(props.days);

const clearSelection = () => {
  localDaysCopy.value = props.days;
};

const saveChanges = () => {
  emit("update", localDaysCopy.value);
};
</script>
