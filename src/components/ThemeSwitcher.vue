<template>
  <div class="theme-switcher">
    <button @click="toggleTheme">
      {{ currentTheme === 'light' ? '🌙' : '☀️' }}
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

<style lang="scss">
.theme-switcher {
  display: flex;
  gap: 0.5rem;

  button {
    display: flex;
    align-items: center;
    font-size: 1rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
  }
}
</style>
