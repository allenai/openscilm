module.exports = {
  extends: ['@allenai/eslint-config-varnish'],
  rules: {
    '@typescript-eslint/no-use-before-define': 0,
    'import/order': 0,
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        tabWidth: 2,
      },
    ],
  },
};
