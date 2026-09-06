import * as migration_20260906_125038_initial from './20260906_125038_initial';

export const migrations = [
  {
    up: migration_20260906_125038_initial.up,
    down: migration_20260906_125038_initial.down,
    name: '20260906_125038_initial'
  },
];
