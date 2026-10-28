exports.up = (pgm) => {
  pgm.createExtension('btree_gist', { ifNotExists: true });
  pgm.sql(`
    ALTER TABLE shows
    ADD CONSTRAINT no_overlapping_shows_per_screen
    EXCLUDE USING gist (
      screen_id WITH =,
      tstzrange(start_time, end_time) WITH &&
    ) WHERE (status <> 'cancelled')
  `);
};

exports.down = (pgm) => {
  pgm.sql('ALTER TABLE shows DROP CONSTRAINT no_overlapping_shows_per_screen');
};