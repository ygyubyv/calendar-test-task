<template>
  <div>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-xs">
        <thead class="bg-gray-50">
          <tr>
            <th class="w-14"></th>
            <th class="border border-gray-200 px-2 py-1 text-gray-600">
              All Day
            </th>
            <th
              v-for="hours in 8"
              :key="hours"
              class="border border-gray-200 px-2 py-1 text-gray-600 text-center font-medium"
              :colspan="3"
            >
              {{ String((hours - 1) * 3).padStart(2, "0") }}:00
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(events, day) in localDaysCopy"
            :key="day"
            class="hover:bg-gray-50"
          >
            <td
              class="border border-gray-200 text-center bg-gray-100 text-sm font-semibold"
            >
              {{ day.toUpperCase() }}
            </td>
            <td
              class="border border-gray-200 cursor-pointer text-center bg-gray-400 hover:bg-gray-600 transition"
              @click="selectAll(day)"
            >
              <font-awesome-icon
                v-if="isAllDay(events)"
                class="text-gray-700 text-lg"
                :icon="['fas', 'circle-check']"
              />
            </td>
            <td
              v-for="hour in 24"
              :key="hour"
              :class="[
                'border border-gray-200 cursor-pointer transition',
                'w-5 h-8 hover:bg-slate-200',
                isSelected(events, hour * 60) ? 'bg-slate-400' : 'bg-white',
              ]"
              @click="selectCell(day, (hour - 1) * 60)"
              @mousedown="selectCell(day, (hour - 1) * 60)"
              @mouseup="selectCell(day, (hour - 1) * 60)"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="justify-self-end mt-4 flex gap-3">
      <button
        class="px-5 py-2 bg-slate-200 rounded-xl hover:bg-slate-300 transition"
        @click="clearSelection"
      >
        Clear
      </button>
      <button
        class="px-5 py-2 bg-slate-600 text-white rounded-xl shadow hover:bg-slate-700 transition"
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
    selectedInterval.value = { day, start: time };
    return;
  }

  if (!selectedInterval.value?.start && selectedInterval.value?.start !== 0) {
    selectedInterval.value = { day, start: time };
    return;
  }

  selectedInterval.value.end = time + 59;

  const newInterval = {
    bt: Math.min(selectedInterval.value.start!, selectedInterval.value.end!),
    et: Math.max(selectedInterval.value.start!, selectedInterval.value.end!),
  };
  localDaysCopy.value[day].push(newInterval);

  selectedInterval.value = null;
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
