<template>
  <button 
    class="language-toggle" 
    @click="toggleLanguage" 
    :title="$t('controls.language')"
  >
    {{ currentLocale === 'en' ? 'EN' : 'UK' }}
  </button>
</template>

<script lang="ts">
export default { name: 'LanguageSwitcher' }
</script>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue';

const { locale } = useI18n();
const currentLocale = ref(locale.value);

onMounted(() => {
  // Initialize locale from localStorage or default to 'en'
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale === 'en' || savedLocale === 'uk') {
    locale.value = savedLocale;
    currentLocale.value = savedLocale;
  }
});

function toggleLanguage() {
  // Toggle between 'en' and 'uk'
  const newLocale = currentLocale.value === 'en' ? 'uk' : 'en';
  locale.value = newLocale;
  currentLocale.value = newLocale;
  
  // Save preference to localStorage
  localStorage.setItem('locale', newLocale);
}
</script>

<style lang="scss">
.language-toggle {
  background-color: transparent;
  border: var(--border-width) solid var(--input-border-color);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  min-width: 40px;
  color: var(--text-color);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--gray-light-color);
  }
}
</style>
