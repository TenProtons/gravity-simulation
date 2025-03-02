<template>
  <div class="controls">
    <div class="input-group">
      <label for="gravity">{{ $t('controls.gravity') }}</label>
      <input 
        type="number"
        id="gravity"
        v-model.number="gravityModel"
        step="0.1"
      />
    </div>
    <div class="input-group">
      <label for="density">{{ $t('controls.density') }}</label>
      <input 
        type="number"
        id="density"
        v-model.number="densityModel"
        step="1"
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
    }
  },
  emits: ['update:gravity', 'update:density'],
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

    return {
      gravityModel,
      densityModel
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
