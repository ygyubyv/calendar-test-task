<template>
  <Calendar :days="days" @update="updateCalendar" />
</template>

<script setup lang="ts">
import Calendar from "@/components/Calendar.vue";
import days from "@/data/days.json";
import type { WeekSchedule } from "@/types/calendar";

const updateCalendar = (newDays: WeekSchedule) => {
  console.log(newDays);
};
</script>
