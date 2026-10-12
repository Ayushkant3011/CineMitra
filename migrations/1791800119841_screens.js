exports.up = (pgm) => {
  pgm.createTable('screens', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    theatre_id: { type: 'bigint', notNull: true, references: 'theatres', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('screens', 'theatre_id');
};
exports.down = (pgm) => pgm.dropTable('screens');