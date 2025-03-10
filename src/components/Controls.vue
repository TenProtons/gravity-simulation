<template>
  <div class="controls">
    <div class="input-group">
      <label for="gravity">{{ $t('controls.gravity') }}</label>
      <input 
        type="text"
        id="gravity"
        :value="formatLocalNumber(gravity)"
        @input="handleGravityInput"
        step="0.1"
        min="0"
      />
    </div>
    <div class="input-group">
      <label for="density">{{ $t('controls.density') }}</label>
      <input 
        type="text"
        id="density"
        :value="formatLocalNumber(density)"
        @input="handleDensityInput"
        step="1"
        min="0.001"
        max="1.0e17"
      />
    </div>
    <div class="input-group">
      <label for="ballDiameter">{{ $t('controls.ballDiameter') }}</label>
      <input 
        type="text"
        id="ballDiameter"
        :value="formatLocalNumber(ballDiameter)"
        @input="handleBallDiameterInput"
        step="0.01"
        min="0.05"
        max="0.5"
      />
    </div>
    <div class="input-group">
      <label for="scaleHeight">{{ $t('controls.scaleHeight') }}</label>
      <input 
        type="text"
        id="scaleHeight"
        :value="formatLocalNumber(scaleHeight)"
        @input="handleScaleHeightInput"
        step="0.1"
        min="0.5"
        max="50"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Controls',
  props: {
    gravity: {
      type: Number,
      required: true
    },
    density: {
      type: Number,
      required: true
    },
    ballDiameter: {
      type: Number,
      required: true
    },
    scaleHeight: {
      type: Number,
      required: true
    }
  },
  emits: ['update:gravity', 'update:density', 'update:ballDiameter', 'update:scaleHeight'],
  setup(props, { emit }) {
    // Format number according to locale (allows comma as decimal separator)
    function formatLocalNumber(value: number): string {
      return value.toString();
    }

    // Parse input value with support for comma decimal separator
    function parseLocalNumber(value: string): number {
      // Replace comma with period for decimal
      const normalizedValue = value.replace(',', '.');
      // Convert to number
      return parseFloat(normalizedValue);
    }

    function handleGravityInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsedValue = parseLocalNumber(input.value);
      if (!isNaN(parsedValue)) {
        emit('update:gravity', parsedValue);
      }
    }

    function handleDensityInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsedValue = parseLocalNumber(input.value);
      if (!isNaN(parsedValue)) {
        // Clamp between hydrogen density and neutron star density
        const clampedVal = Math.min(Math.max(0.0899, parsedValue), 1.0e17);
        emit('update:density', clampedVal);
      }
    }

    function handleBallDiameterInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsedValue = parseLocalNumber(input.value);
      if (!isNaN(parsedValue)) {
        // Clamp between 5cm and 50cm
        const clampedVal = Math.min(Math.max(0.05, parsedValue), 0.5);
        emit('update:ballDiameter', clampedVal);
      }
    }

    function handleScaleHeightInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsedValue = parseLocalNumber(input.value);
      if (!isNaN(parsedValue)) {
        // Clamp to max 50 meters
        const clampedVal = Math.min(Math.max(0.5, parsedValue), 50);
        emit('update:scaleHeight', clampedVal);
      }
    }

    return {
      formatLocalNumber,
      handleGravityInput,
      handleDensityInput,
      handleBallDiameterInput,
      handleScaleHeightInput
    };
  }
});
</script>

<style scoped lang="scss">
.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
}
</style>
