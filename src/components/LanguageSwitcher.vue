<template>
  <button 
    class="language-toggle button" 
    @click="toggleLanguage" 
    :title="$t('controls.language')"
  >
    {{ currentLocale === 'en' ? 'Українська' : 'English' }}
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
