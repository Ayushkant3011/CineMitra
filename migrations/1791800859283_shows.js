exports.up = (pgm) => {
  pgm.createTable('shows', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    movie_id: { type: 'bigint', notNull: true, references: 'movies' },
    screen_id: { type: 'bigint', notNull: true, references: 'screens' },
    start_time: { type: 'timestamptz', notNull: true },
    end_time: { type: 'timestamptz', notNull: true },
    status: { type: 'text', notNull: true, default: 'scheduled',
              check: "status IN ('scheduled','cancelled','completed')" },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('shows', 'shows_time_order', { check: 'end_time > start_time' });
  pgm.createIndex('shows', 'movie_id');
  pgm.createIndex('shows', ['screen_id', 'start_time']);
};
exports.down = (pgm) => pgm.dropTable('shows');