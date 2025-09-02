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
              v-for="hours in 8"
              :key="hours"
              class="border text-xs px-2 py-1 text-gray-600 text-center"
              :colspan="3"
            >
              {{ String((hours - 1) * 3).padStart(2, "0") }}:00
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(events, day) in localDaysCopy" :key="day">
            <td class="border text-center bg-gray-100 text-sm font-medium">
              {{ day.toUpperCase() }}
            </td>

            <td
              class="border cursor-pointer w-8 text-center bg-gray-400 text-sm font-medium"
              @click="selectAll(day)"
            >
              <font-awesome-icon
                v-if="isAllDay(events)"
                class="text-white text-xl"
                :icon="['fas', 'circle-check']"
              />
            </td>

            <td
              v-for="hour in 24"
              :key="hour"
              :class="[
                'border w-4 h-8 cursor-pointer hover:bg-gray-300',
                isSelected(events, hour * 60) ? 'bg-gray-500' : '',
              ]"
              @click="selectCell(day, (hour - 1) * 60)"
              @mousedown="selectCell(day, (hour - 1) * 60)"
              @mouseup="selectCell(day, (hour - 1) * 60)"
            ></td>
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
import { ALL_DAY } from "@/constants";
import type { Interval, WeekDay, WeekSchedule } from "@/types/calendar";
import { ref } from "vue";

interface Props {
  days: WeekSchedule;
}

interface SelectedInterval {
  day: WeekDay;
  start?: number;
  end?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update", days: WeekSchedule): void;
}>();

const localDaysCopy = ref<WeekSchedule>(structuredClone(props.days));
const selectedInterval = ref<SelectedInterval | null>(null);

const isSelected = (events: Interval[], time: number) => {
  return events.some((event) => time > event.bt && time - 2 < event.et);
};

const isAllDay = (events: Interval[]) => {
  const sorted = [...events].sort((a, b) => a.bt - b.bt);

  let lastEnd = -1;

  for (const event of sorted) {
    if (event.bt > lastEnd + 1) {
      return false;
    }
    lastEnd = Math.max(lastEnd, event.et);
  }

  return lastEnd >= ALL_DAY;
};

const selectCell = (day: WeekDay, time: number) => {
  if (selectedInterval.value?.day && selectedInterval.value.day !== day) {
    return;
  }

  if (!selectedInterval.value?.start && selectedInterval.value?.start !== 0) {
    selectedInterval.value = { day, start: time };
  } else {
    if (selectedInterval.value.day === day) {
      selectedInterval.value.end = time + 59;

      const newInterval = {
        bt: Math.min(selectedInterval.value.start, selectedInterval.value.end),
        et: Math.max(selectedInterval.value.start, selectedInterval.value.end),
      };
      localDaysCopy.value[day].push(newInterval);
    }

    selectedInterval.value = null;
  }
};

const selectAll = (day: WeekDay) => {
  localDaysCopy.value[day].length
    ? (localDaysCopy.value[day] = [])
    : localDaysCopy.value[day].push({ bt: 0, et: ALL_DAY });
};

const clearSelection = () => {
  localDaysCopy.value = structuredClone(props.days);
};

const saveChanges = () => {
  emit("update", localDaysCopy.value);
};
</script>
