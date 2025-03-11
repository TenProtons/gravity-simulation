<template>
  <div class="controls">
    <div class="input-group">
      <label for="material">{{ $t('controls.material') }}</label>
      <select id="material" v-model="selectedMaterial" @change="handleMaterialChange">
        <option v-for="(material, id) in materials" :key="id" :value="id">
          {{ material.name }}
        </option>
      </select>
    </div>
    
    <div class="properties-group">
      <div class="input-group horizontal">
        <label for="density">{{ $t('controls.density') }}</label>
        <input 
          type="text"
          id="density"
          :value="formatLocalNumber(density)"
          @input="handleDensityInput"
          step="1"
          min="0.0899"
          max="22590"
        />
      </div>
      <div class="input-group horizontal">
        <label for="elasticity">{{ $t('controls.elasticity') }}</label>
        <input 
          type="text"
          id="elasticity"
          :value="formatLocalNumber(elasticity)"
          @input="handleElasticityInput"
          step="0.01"
          min="0"
          max="1"
        />
      </div>
    </div>
    
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
    
    <div class="toggle-group">
      <label class="toggle-label">
        <input type="checkbox" v-model="vacuumMode" @change="handleVacuumToggle" />
        <span class="toggle-text">{{ $t('controls.vacuum') }}</span>
      </label>
      <div class="toggle-info">{{ $t('controls.vacuumInfo') }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

// Define the material properties
const materialsList = {
  hydrogen: { name: 'Hydrogen', density: 0.0899, elasticity: 0.0 },
  lead: { name: 'Lead', density: 11340, elasticity: 0.16 },
  steel: { name: 'Steel', density: 7850, elasticity: 0.6 },
  rubber: { name: 'Rubber', density: 1100, elasticity: 0.85 },
  foamRubber: { name: 'Foam Rubber', density: 85, elasticity: 0.25 },
  wood: { name: 'Wood', density: 700, elasticity: 0.6 },
  glass: { name: 'Glass', density: 2500, elasticity: 0.65 },
  osmium: { name: 'Osmium', density: 22590, elasticity: 0.2 },
  tungsten: { name: 'Tungsten', density: 19250, elasticity: 0.8 },
  custom: { name: 'Custom Parameters', density: 1000, elasticity: 0.5 }
};

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
    elasticity: {
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
    },
    vacuum: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:gravity', 'update:density', 'update:elasticity', 'update:ballDiameter', 'update:scaleHeight', 'update:vacuum'],
  setup(props, { emit }) {
    const materials = materialsList;
    const selectedMaterial = ref('rubber'); // Default to rubber
    const vacuumMode = ref(props.vacuum);

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
    function handleMaterialChange() {
      const material = materials[selectedMaterial.value as keyof typeof materials];
      if (material) {
        emit('update:density', material.density);
        emit('update:elasticity', material.elasticity);
      }
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
        // Clamp between hydrogen density and osmium density
        const clampedVal = Math.min(Math.max(0.0899, parsedValue), 22590);
        emit('update:density', clampedVal);
        // Set to custom material
        selectedMaterial.value = 'custom';
      }
    }

    function handleElasticityInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsedValue = parseLocalNumber(input.value);
      if (!isNaN(parsedValue)) {
        // Clamp between 0 and 1
        const clampedVal = Math.min(Math.max(0, parsedValue), 1);
        emit('update:elasticity', clampedVal);
        // Set to custom material
        selectedMaterial.value = 'custom';
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

    function handleVacuumToggle() {
      emit('update:vacuum', vacuumMode.value);
    }

    return {
      materials,
      selectedMaterial,
      formatLocalNumber,
      handleMaterialChange,
      handleGravityInput,
      handleDensityInput,
      handleElasticityInput,
      handleBallDiameterInput,
      handleScaleHeightInput,
      vacuumMode,
      handleVacuumToggle
    };
  }
});
</script>

<style lang="scss">
@import '../assets/variables.scss';

.controls {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  margin-bottom: $spacing-md;
}

.input-group {
  display: flex;
  flex-direction: column;
  
  &.horizontal {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    
    label {
      margin-right: $spacing-sm;
      color: var(--text-color);
    }
    
    input {
      width: 120px;
    }
  }
}

.properties-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: $border-width solid var(--properties-group-border-color);
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-sm;
}

select {
  padding: 8px;
  border-radius: $border-radius-sm;
  border: $border-width solid $color-gray;
  background-color: $color-white;
}

input {
  padding: 8px;
  border-radius: $border-radius-sm;
  border: $border-width solid $color-gray;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  margin: $spacing-sm 0;
  padding: $spacing-sm;
  border: $border-width solid var(--toggle-group-border-color);
  border-radius: $border-radius-sm;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input[type="checkbox"] {
    margin-right: $spacing-xs;
  }
  
  .toggle-text {
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }
}

.toggle-info {
  margin-top: $spacing-xs;
  font-size: $font-size-small;
  color: var(--toggle-info-color);
}
</style>
