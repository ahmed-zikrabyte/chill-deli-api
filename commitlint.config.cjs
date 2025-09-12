'use strict';
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'revert',
      ],
    ],
    'scope-case': [2, 'always', ['lower-case', 'upper-case']],
    'subject-case': [0], // disable subject‑case rule
    'header-max-length': [2, 'always', 150],
  },
};
