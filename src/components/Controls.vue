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
        min="0"
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
    scaleHeight: {
      type: Number,
      required: true
    }
  },
  emits: ['update:gravity', 'update:density', 'update:scaleHeight'],
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
        emit('update:density', newVal);
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
