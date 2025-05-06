const mysql = require('mysql2');
const dbDataAsset = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '000000',
  database: 'data_asset'
});
dbDataAsset.connect(err => {
  if (err) throw err;
  console.log('Connected to data_asset');
});
module.exports = dbDataAsset;

/*
const mysql = require('mysql2');
const dbDataAsset = mysql.createConnection({
  host: 'trolley.proxy.rlwy.net',
  user: 'root',
  password: 'ePLJlyMyIidxMYJyxOaQpFwBQWxLvtoU',
  database: 'data_asset',
  port: 56770
});
dbDataAsset.connect(err => {
  if (err) throw err;
  console.log('Connected to data_asset');
});
module.exports = dbDataAsset;
*/