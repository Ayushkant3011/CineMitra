exports.up = (pgm) => {
  pgm.createTable('seats', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    screen_id: { type: 'bigint', notNull: true, references: 'screens', onDelete: 'CASCADE' },
    row_label: { type: 'text', notNull: true },
    seat_number: { type: 'integer', notNull: true },
    category: { type: 'text', notNull: true,
                check: "category IN ('silver','gold','premium')" },
  });
  pgm.addConstraint('seats', 'uq_seat_position_per_screen', {
    unique: ['screen_id', 'row_label', 'seat_number'],
  });
};
exports.down = (pgm) => pgm.dropTable('seats');