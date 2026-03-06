const bcrypt = require('bcryptjs');

const password = 'Admin@12345';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Password:', password);
console.log('Hash:', hash);