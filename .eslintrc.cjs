module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
    es2023: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'next/core-web-vitals',
    'plugin:import/recommended',
    'prettier',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['scripts/**', 'tests/**'],
      env: { node: true, jest: true },
      rules: {
        'no-unused-vars': 'off',
      },
    },
  ],
};
