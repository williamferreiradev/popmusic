import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7A1F1F',
          hover: '#902626', // Leve clareada para o hover
        },
        dark: {
          bg: '#141110',
          surface: '#1F1A18', // Um pouco mais claro que o bg para destacar cards/inputs
          border: '#332B28', // Para bordas sutis
        },
        light: {
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#1F2937',
        },
        gold: {
          DEFAULT: '#C9A227',
          soft: '#C9A2271A', // C9A227 com 10% de opacidade (1A em Hex)
        },
        offwhite: '#EFEAE0',
      }
    }
  }
}
