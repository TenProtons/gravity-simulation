<template>
  <div :class="['app', theme]">
    <header class="header">
      <h1>{{ $t('appTitle') }}</h1>
      <div class="header-controls">
        <LanguageSwitcher />
        <ThemeSwitcher :currentTheme="theme" @toggleTheme="toggleTheme" />
      </div>
    </header>
    <div class="main-content">
      <Controls 
        v-model:gravity="simulationGravity" 
        v-model:density="simulationDensity"
        v-model:ballDiameter="simulationBallDiameter"
        v-model:scaleHeight="simulationScaleHeight"
      />
      <div class="simulation-section">
        <Simulation 
          :gravity="simulationGravity" 
          :ballDensity="simulationDensity"
          :ballDiameter="simulationBallDiameter"
          :scaleHeight="simulationScaleHeight"
          @fallTimeUpdate="handleFallTimeUpdate"
        />
        <div class="fall-time-indicator">
          <span>Fall time: {{ fallTimeDisplay }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import Controls from './components/Controls.vue'
import Simulation from './components/Simulation.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

// Reactive values for gravity and density across the entire project.
const simulationGravity = ref(9.81)
const simulationDensity = ref(1000)
const simulationBallDiameter = ref(0.2) // Default to 20cm diameter
const simulationScaleHeight = ref(1) // Default to 1 meter
const theme = ref('light')

// Fall time tracking
const fallTime = ref<number | null>(0); // Initialize to 0
const isMeasuring = ref(false);

const fallTimeDisplay = computed(() => {
  if (fallTime.value === null) {
    return '0.000s';
  } else {
    return `${fallTime.value.toFixed(3)}s`;
  }
});

function toggleTheme(newTheme: string) {
  theme.value = newTheme
}

function handleFallTimeUpdate(data: { time: number | null, measuring: boolean }) {
  fallTime.value = data.time;
  isMeasuring.value = data.measuring;
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

/* Light theme */
.light {
  background-color: #ffffff;
  color: #000;
}

/* Dark theme */
.dark {
  background-color: #222;
  color: #fff;
}

.header {
  text-align: center;
  width: 100%;
}

.header-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 640px;
}

.simulation-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.fall-time-indicator {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}
</style>
