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
      <Simulation 
        :gravity="simulationGravity" 
        :ballDensity="simulationDensity"
        :ballDiameter="simulationBallDiameter"
        :scaleHeight="simulationScaleHeight"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
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
</style>
