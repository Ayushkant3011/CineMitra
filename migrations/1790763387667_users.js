
export const up = (pgm) => {
    pgm.createExtension('citext', { ifNotExists: true });

    pgm.createTable('users', {
        id:{ type:'bigint', primaryKey:true, sequenceGenerated: { precedence: 'ALWAYS' }},
        firstName: { type:'text', notNull:true },
        lastName: { type:'text', notNull:true },
        email: { type:'citext', notNull:true, unique:true },
        password:{ type:'text', notNull:true },
        role:{
            type:'text',
            notNull:true,
            default:'user',
            check: "role IN ('user', 'admin')",
        },
        created_at: { type: 'timestamptz', notNull:true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull:true, default: pgm.func('now()') },

    });
};

export const down = (pgm) => {
    pgm.dropTable('users');
};
