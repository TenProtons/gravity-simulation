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
          @ballInfoUpdate="handleBallInfoUpdate"
        />
        <div class="indicators">
          <div class="indicator">
            <span>Ball Ø: {{ ballDiameterDisplay }}</span>
          </div>
          <div class="indicator">
            <span>Weight: {{ ballWeightDisplay }}</span>
          </div>
          <div class="indicator">
            <span>Fall time: {{ fallTimeDisplay }}</span>
          </div>
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

// Reactive values for the simulation
const simulationGravity = ref(9.81)
const simulationDensity = ref(1000)
const simulationBallDiameter = ref(0.2) // Default to 20cm diameter
const simulationScaleHeight = ref(1) // Default to 1 meter
const theme = ref('light')

// Fall time tracking
const fallTime = ref<number | null>(0);
const isMeasuring = ref(false);

// Ball info tracking
const ballDiameter = ref(0.2);
const ballWeight = ref(0);

const fallTimeDisplay = computed(() => {
  if (fallTime.value === null) {
    return '0.000s';
  } else {
    return `${fallTime.value.toFixed(3)}s`;
  }
});

const ballDiameterDisplay = computed(() => {
  return `${ballDiameter.value.toFixed(2)}m`;
});

const ballWeightDisplay = computed(() => {
  if (ballWeight.value < 1) {
    // Show in grams if less than 1kg
    return `${(ballWeight.value * 1000).toFixed(0)}g`;
  } else {
    // Show in kg with 2 decimal places
    return `${ballWeight.value.toFixed(2)}kg`;
  }
});

function handleFallTimeUpdate(data: { time: number | null, measuring: boolean }) {
  fallTime.value = data.time;
  isMeasuring.value = data.measuring;
}

function handleBallInfoUpdate(data: { diameter: number, weight: number }) {
  ballDiameter.value = data.diameter;
  ballWeight.value = data.weight;
}

function toggleTheme(newTheme: string) {
  theme.value = newTheme
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
  align-items: flex-start;
  gap: 20px;
}

.indicators {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.indicator {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  min-width: 150px;
}
</style>
