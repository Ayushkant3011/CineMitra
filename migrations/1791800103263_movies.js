exports.up = (pgm) => {
  pgm.createTable('movies', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    language: { type: 'text', notNull: true },
    genre: { type: 'text' },
    duration_minutes: { type: 'integer', notNull: true, check: 'duration_minutes > 0' },
    poster_url: { type: 'text' },
    release_date: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};
exports.down = (pgm) => pgm.dropTable('movies');