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
                isSelected(localDaysCopy[day], (hour - 1) * 60)
                  ? 'bg-slate-400'
                  : 'bg-white',
              ]"
              @mousedown.prevent="onCellMouseDown(day, (hour - 1) * 60)"
              @mouseenter.prevent="onCellMouseEnter(day, (hour - 1) * 60)"
              @mouseup.prevent="onCellMouseUp(day, (hour - 1) * 60)"
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
import { ref, onMounted, onBeforeUnmount } from "vue";

interface Props {
  days: WeekSchedule;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update", days: WeekSchedule): void;
}>();

const localDaysCopy = ref<WeekSchedule>(structuredClone(props.days));

const isMouseDown = ref(false);
const dragStart = ref<{ day: WeekDay; time: number } | null>(null);
const dragCurrent = ref<{ day: WeekDay; time: number } | null>(null);
const movedDuringDrag = ref(false);

const isSelected = (events: Interval[], time: number) => {
  return events.some((event) => time >= event.bt && time <= event.et);
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

const getDayOrder = () => Object.keys(localDaysCopy.value) as WeekDay[];

const dayIndex = (day: WeekDay) => getDayOrder().indexOf(day);

const addInterval = (day: WeekDay, bt: number, et: number) => {
  if (!localDaysCopy.value[day]) localDaysCopy.value[day] = [];

  const arr = [...localDaysCopy.value[day], { bt, et }].sort(
    (a, b) => a.bt - b.bt
  );

  const merged: Interval[] = [];
  for (const iv of arr) {
    if (!merged.length) merged.push({ ...iv });
    else {
      const last = merged[merged.length - 1];
      if (iv.bt <= last.et + 1) {
        last.et = Math.max(last.et, iv.et);
      } else {
        merged.push({ ...iv });
      }
    }
  }

  localDaysCopy.value[day] = merged;
};

const removeSingleMinute = (day: WeekDay, time: number) => {
  const arr = localDaysCopy.value[day] ?? [];
  const result: Interval[] = [];

  for (const iv of arr) {
    if (time < iv.bt || time > iv.et) {
      result.push(iv);
    } else {
      if (iv.bt < time) {
        result.push({ bt: iv.bt, et: time - 1 });
      }
      if (time < iv.et) {
        result.push({ bt: time + 1, et: iv.et });
      }
    }
  }

  localDaysCopy.value[day] = result;
  if (localDaysCopy.value[day].length) {
    const arrSorted = [...localDaysCopy.value[day]].sort((a, b) => a.bt - b.bt);
    const merged: Interval[] = [];
    for (const iv of arrSorted) {
      if (!merged.length) merged.push({ ...iv });
      else {
        const last = merged[merged.length - 1];
        if (iv.bt <= last.et + 1) last.et = Math.max(last.et, iv.et);
        else merged.push(iv);
      }
    }
    localDaysCopy.value[day] = merged;
  } else {
    localDaysCopy.value[day] = [];
  }
};

const commitRange = (
  start: { day: WeekDay; time: number },
  end: { day: WeekDay; time: number }
) => {
  const order = getDayOrder();
  let si = dayIndex(start.day);
  let ei = dayIndex(end.day);
  if (si === -1 || ei === -1) return;

  if (si > ei || (si === ei && start.time > end.time)) {
    [si, ei] = [ei, si];
    [start, end] = [end, start];
  }

  for (let idx = si; idx <= ei; idx++) {
    const day = order[idx] as WeekDay;

    if (si === ei) {
      addInterval(
        day,
        Math.min(start.time, end.time),
        Math.max(start.time, end.time) + 59
      );
    } else if (idx === si) {
      addInterval(day, start.time, ALL_DAY);
    } else if (idx === ei) {
      addInterval(day, 0, end.time + 59);
    } else {
      addInterval(day, 0, ALL_DAY);
    }
  }
};

const onCellMouseDown = (day: WeekDay, time: number) => {
  isMouseDown.value = true;
  dragStart.value = { day, time };
  dragCurrent.value = { day, time };
  movedDuringDrag.value = false;
};

const onCellMouseEnter = (day: WeekDay, time: number) => {
  if (!isMouseDown.value) return;
  movedDuringDrag.value = true;
  dragCurrent.value = { day, time };
};

const onCellMouseUp = (day: WeekDay, time: number) => {
  if (!dragStart.value) {
    isMouseDown.value = false;
    dragCurrent.value = null;
    return;
  }

  const start = dragStart.value;
  const end = dragCurrent.value ?? { day, time };

  if (
    !movedDuringDrag.value &&
    start.day === end.day &&
    start.time === end.time
  ) {
    if (isSelected(localDaysCopy.value[start.day], start.time)) {
      removeSingleMinute(start.day, start.time);
    } else {
      addInterval(start.day, start.time, start.time + 59);
    }
  } else {
    commitRange(start, end);
  }

  isMouseDown.value = false;
  dragStart.value = null;
  dragCurrent.value = null;
  movedDuringDrag.value = false;
};

const onGlobalMouseUp = () => {
  if (isMouseDown.value && dragStart.value && dragCurrent.value) {
    commitRange(dragStart.value, dragCurrent.value);
  }
  isMouseDown.value = false;
  dragStart.value = null;
  dragCurrent.value = null;
  movedDuringDrag.value = false;
};

onMounted(() => {
  window.addEventListener("mouseup", onGlobalMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", onGlobalMouseUp);
});

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
