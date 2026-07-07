import dauphaihauConfig from '@dauphaihau/eslint-config';
import eslintNextPlugin from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint/config';

const nextRules = {
  ...eslintNextPlugin.configs.recommended.rules,
  ...eslintNextPlugin.configs['core-web-vitals'].rules,
};

export default defineConfig([
  ...(await dauphaihauConfig({
    typescript: true,
  })),
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      '@next/next': eslintNextPlugin,
    },
    settings: {
      next: {
        rootDir: ['apps/app', 'apps/marketing'],
      },
    },
    rules: nextRules,
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    ignores: ['out/**', '**/next-env.d.ts'],
  },
]);
