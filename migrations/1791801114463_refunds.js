exports.up = (pgm) => {
  pgm.createTable('refunds', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    payment_id: { type: 'bigint', notNull: true, references: 'payments' },
    amount: { type: 'numeric(10,2)', notNull: true, check: 'amount > 0' },
    reason: { type: 'text' },
    status: { type: 'text', notNull: true, default: 'initiated',
              check: "status IN ('initiated','processed','failed')" },
    provider_refund_id: { type: 'text', unique: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('refunds', 'payment_id');
};
exports.down = (pgm) => pgm.dropTable('refunds');