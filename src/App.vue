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
        v-model:elasticity="simulationElasticity"
        v-model:ballDiameter="simulationBallDiameter"
        v-model:scaleHeight="simulationScaleHeight"
        v-model:vacuum="simulationVacuum"
      />
      <div class="simulation-section">
        <Simulation 
          :gravity="simulationGravity" 
          :ballDensity="simulationDensity"
          :elasticity="simulationElasticity"
          :ballDiameter="simulationBallDiameter"
          :scaleHeight="simulationScaleHeight"
          :vacuum="simulationVacuum"
          :currentTheme="theme"
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
const simulationDensity = ref(1100) // Default to rubber
const simulationElasticity = ref(0.85) // Default to rubber
const simulationBallDiameter = ref(0.2) // Default to 20cm diameter
const simulationScaleHeight = ref(1) // Default to 1 meter
const simulationVacuum = ref(false) // Default to normal atmosphere
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
  // Make sure we have at least a minimum weight value to display
  const minDisplayWeight = Math.max(ballWeight.value, 0.0001);
  
  if (minDisplayWeight < 1) {
    // Show in grams if less than 1kg, with 1 decimal place
    return `${(minDisplayWeight * 1000).toFixed(1)}g`;
  } else {
    // Show in kg with 1 decimal place
    return `${minDisplayWeight.toFixed(1)}kg`;
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

<style lang="scss">
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-md);
  background-color: var(--background-color);
  color: var(--text-color);
}

.header {
  text-align: center;
  width: 100%;
}

.header-controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: var(--max-width-container);
}

.simulation-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.indicators {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.indicator {
  padding: 8px 12px;
  background-color: var(--indicator-background);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-normal);
  font-weight: var(--font-weight-bold);
  min-width: var(--width-indicator);
  color: var(--indicator-text-color);
}
</style>
