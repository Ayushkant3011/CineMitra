exports.up = (pgm) => {
  pgm.addConstraint('screens', 'uq_screen_name_per_theatre', {
    unique: ['theatre_id', 'name'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('screens', 'uq_screen_name_per_theatre');
};