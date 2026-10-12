exports.up = (pgm) => {
  pgm.createTable('theatres', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    name: { type: 'text', notNull: true },
    city: { type: 'text', notNull: true },
    address: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};
exports.down = (pgm) => pgm.dropTable('theatres');