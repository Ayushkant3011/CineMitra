exports.up = (pgm) => {
  pgm.createTable('bookings', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    user_id: { type: 'bigint', notNull: true, references: 'users' },
    show_id: { type: 'bigint', notNull: true, references: 'shows' },
    status: { type: 'text', notNull: true, default: 'pending_payment',
              check: "status IN ('pending_payment','confirmed','cancelled','expired','failed')" },
    total_amount: { type: 'numeric(10,2)', notNull: true, check: 'total_amount >= 0' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('bookings', 'user_id');
  pgm.createIndex('bookings', 'show_id');
};
exports.down = (pgm) => pgm.dropTable('bookings');