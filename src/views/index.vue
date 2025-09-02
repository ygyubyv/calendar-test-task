<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Set Schedule</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Calendar :days="days" @update="updateCalendar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Calendar from "@/components/Calendar.vue";
import days from "@/data/days.json";
import type { WeekSchedule } from "@/types/calendar";

const updateCalendar = (newDays: WeekSchedule) => {
  console.log("Updated calendar:", newDays);
};
</script>
