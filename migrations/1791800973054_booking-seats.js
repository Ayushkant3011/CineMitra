exports.up = (pgm) => {
  pgm.createTable('booking_seats', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    booking_id: { type: 'bigint', notNull: true, references: 'bookings', onDelete: 'CASCADE' },
    show_id: { type: 'bigint', notNull: true, references: 'shows' },
    seat_id: { type: 'bigint', notNull: true, references: 'seats' },
    status: { type: 'text', notNull: true,
              check: "status IN ('held','confirmed','released','cancelled')" },
    price: { type: 'numeric(10,2)', notNull: true, check: 'price >= 0' },
    held_until: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('booking_seats', 'booking_id');
  pgm.createIndex('booking_seats', ['show_id', 'seat_id'], {
    name: 'uq_active_seat_per_show',
    unique: true,
    where: "status IN ('held','confirmed')",
  });
};
exports.down = (pgm) => pgm.dropTable('booking_seats');