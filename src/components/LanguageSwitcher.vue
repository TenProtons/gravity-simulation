<template>
  <div class="language-switcher">
    <button @click="setLanguage('en')">EN</button>
    <button @click="setLanguage('uk')">UK</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n();
    function setLanguage(lang: string) {
      locale.value = lang;
    }
    return { setLanguage };
  }
});
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: 0.5rem;
}
</style>
