<template>
  <div class="theme-switcher">
    <button @click="toggleTheme">
      {{ currentTheme === 'light' ? $t('themes.dark') : $t('themes.light') }}
    </button>
  </div>
</template>

<script lang="ts">
export default { name: 'ThemeSwitcher' }
</script>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  currentTheme: string;
}>();

const emits = defineEmits<{
  (e: 'toggleTheme', newTheme: string): void;
}>();

function toggleTheme() {
  const newTheme = props.currentTheme === 'light' ? 'dark' : 'light';
  emits('toggleTheme', newTheme);
}
</script>

<style scoped>
.theme-switcher {
  display: flex;
  gap: 0.5rem;
}
</style>
