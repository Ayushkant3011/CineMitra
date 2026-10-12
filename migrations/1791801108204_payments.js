exports.up = (pgm) => {
  pgm.createTable('payments', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    booking_id: { type: 'bigint', notNull: true, references: 'bookings' },
    provider: { type: 'text', notNull: true, default: 'razorpay' },
    provider_order_id: { type: 'text', notNull: true, unique: true },
    provider_payment_id: { type: 'text', unique: true },
    amount: { type: 'numeric(10,2)', notNull: true, check: 'amount > 0' },
    status: { type: 'text', notNull: true, default: 'created',
              check: "status IN ('created','paid','failed','refunded')" },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('payments', 'booking_id');
};
exports.down = (pgm) => pgm.dropTable('payments');