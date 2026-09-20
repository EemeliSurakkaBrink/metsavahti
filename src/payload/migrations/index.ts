import * as migration_20260906_125038_initial from './20260906_125038_initial';
import * as migration_20260920_135750_users_fields from './20260920_135750_users_fields';

export const migrations = [
  {
    up: migration_20260906_125038_initial.up,
    down: migration_20260906_125038_initial.down,
    name: '20260906_125038_initial',
  },
  {
    up: migration_20260920_135750_users_fields.up,
    down: migration_20260920_135750_users_fields.down,
    name: '20260920_135750_users_fields'
  },
];
