import type { Config } from 'tailwindcss'
import { colors, spacing } from './src/shared/tokens'
import { typography } from './src/shared/typography'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tailwind utilities are kebab-case (text-polvo-estelar); token keys stay camelCase.
      colors: {
        obsidiana: colors.obsidiana,
        ambar: colors.ambar,
        'polvo-estelar': colors.polvoEstelar,
      },
      fontFamily: {
        editorial: [typography.editorial, 'Georgia', 'serif'],
        mono: [typography.mono, 'ui-monospace', 'monospace'],
      },
      spacing: {
        base: `${spacing.base}px`,
      },
    },
  },
  plugins: [],
} satisfies Config
