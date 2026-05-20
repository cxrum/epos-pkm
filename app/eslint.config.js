import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'node_modules/**'],
  },
  
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),

  {
    name: 'app/architecture-core',
    files: ['src/core/**/*.ts', 'src/core/**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*'],
              message: 'Core infrastructure must not depend on business modules.'
            }
          ]
        }
      ]
    }
  },
  
  {
    name: 'app/architecture-shared',
    files: ['src/shared/**/*.ts', 'src/shared/**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*', '@/core/*'],
              message: 'Shared elements can only import from other shared elements.'
            }
          ]
        }
      ]
    }
  },
  
  {
    name: 'app/architecture-modules',
    files: ['src/modules/**/*.ts', 'src/modules/**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/*'],
              message: 'Do not reach deep into other modules. Import only from the public index.ts.'
            }
          ]
        }
      ]
    }
  }
]