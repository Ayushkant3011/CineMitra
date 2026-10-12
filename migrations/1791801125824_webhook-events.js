exports.up = (pgm) => {
  pgm.createTable('webhook_events', {
    id: { type: 'bigint', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } },
    provider_event_id: { type: 'text', notNull: true, unique: true },
    event_type: { type: 'text', notNull: true },
    payload: { type: 'jsonb', notNull: true },
    processed_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
};
exports.down = (pgm) => pgm.dropTable('webhook_events');