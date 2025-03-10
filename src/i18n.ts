import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    appTitle: "Ball Simulation",
    controls: {
      gravity: "Gravity (m/s²)",
      density: "Density (kg/m³)",
      elasticity: "Elasticity",
      material: "Material",
      ballDiameter: "Ball Diameter (m)",
      scaleHeight: "Scale Height (m)",
      start: "Start Simulation",
      reset: "Reset",
      language: "Language",
      theme: "Theme"
    },
    themes: {
      light: "Light",
      dark: "Dark"
    }
  },
  uk: {
    appTitle: "Симуляція м'ячика",
    controls: {
      gravity: "Прискорення (м/с²)",
      density: "Густина (кг/м³)",
      elasticity: "Пружність",
      material: "Матеріал",
      ballDiameter: "Діаметр м'ячика (м)",
      scaleHeight: "Висота шкали (м)",
      start: "Почати симуляцію",
      reset: "Скинути",
      language: "Мова",
      theme: "Тема"
    },
    themes: {
      light: "Світла",
      dark: "Темна"
    }
  }
}

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})
