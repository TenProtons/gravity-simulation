<template>
  <div class="controls">
    <div class="input-group">
      <label for="gravity">{{ $t('controls.gravity') }}</label>
      <input 
        type="number"
        id="gravity"
        v-model.number="gravityModel"
        step="0.1"
        min="0"
      />
    </div>
    <div class="input-group">
      <label for="density">{{ $t('controls.density') }}</label>
      <input 
        type="number"
        id="density"
        v-model.number="densityModel"
        step="1"
        min="0.001"
        max="1.0e17"
      />
    </div>
    <div class="input-group">
      <label for="ballDiameter">{{ $t('controls.ballDiameter') }}</label>
      <input 
        type="number"
        id="ballDiameter"
        v-model.number="ballDiameterModel"
        step="0.01"
        min="0.05"
        max="0.5"
      />
    </div>
    <div class="input-group">
      <label for="scaleHeight">{{ $t('controls.scaleHeight') }}</label>
      <input 
        type="number"
        id="scaleHeight"
        v-model.number="scaleHeightModel"
        step="0.1"
        min="0.5"
        max="50"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

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
    const gravityModel = computed({
      get() {
        return props.gravity;
      },
      set(newVal: number) {
        emit('update:gravity', newVal);
      }
    });

    const densityModel = computed({
      get() {
        return props.density;
      },
      set(newVal: number) {
        // Clamp between 1 g/m³ (0.001 kg/m³) and neutron star density (10^17 kg/m³)
        const clampedVal = Math.min(Math.max(0.001, newVal), 1.0e17);
        emit('update:density', clampedVal);
      }
    });

    const ballDiameterModel = computed({
      get() {
        return props.ballDiameter;
      },
      set(newVal: number) {
        // Clamp between 5cm and 50cm
        const clampedVal = Math.min(Math.max(0.05, newVal), 0.5);
        emit('update:ballDiameter', clampedVal);
      }
    });

    const scaleHeightModel = computed({
      get() {
        return props.scaleHeight;
      },
      set(newVal: number) {
        // Clamp to max 50 meters
        const clampedVal = Math.min(Math.max(0.5, newVal), 50);
        emit('update:scaleHeight', clampedVal);
      }
    });

    return {
      gravityModel,
      densityModel,
      ballDiameterModel,
      scaleHeightModel
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
