exports.up = (pgm) => {
  pgm.createTable('show_seat_prices', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    show_id: { type: 'bigint', notNull: true, references: 'shows', onDelete: 'CASCADE' },
    category: { type: 'text', notNull: true,
                check: "category IN ('silver','gold','premium')" },
    price: { type: 'numeric(10,2)', notNull: true, check: 'price >= 0' },
  });
  pgm.addConstraint('show_seat_prices', 'uq_price_per_show_category', {
    unique: ['show_id', 'category'],
  });
};
exports.down = (pgm) => pgm.dropTable('show_seat_prices');