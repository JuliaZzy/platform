const mysql = require('mysql2');
const dbAdmin = mysql.createConnection({
  host: 'trolley.proxy.rlwy.net',
  user: 'root',
  password: 'ePLJlyMyIidxMYJyxOaQpFwBQWxLvtoU',
  database: 'admin_db',
  port: 56770
});
dbAdmin.connect(err => {
  if (err) throw err;
  console.log('Connected to admin_db');
});
module.exports = dbAdmin;
