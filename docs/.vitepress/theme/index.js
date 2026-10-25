import DefaultTheme from 'vitepress/theme'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Registro de componentes globales si se necesita
  }
}