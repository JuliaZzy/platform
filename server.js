require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:8080',
  //origin: 'http://platform-production-717b.up.railway.app',
  methods: ['GET', 'POST'],
}));

// 后端 API 路由
const loginRoutes = require('./backend/routes/login');
const companyDataRoutes = require('./backend/routes/companiesData');
const dataTableRoutes = require('./backend/routes/dataTable');
const uploadRoutes = require('./backend/routes/excelUpload');
const exportRoutes = require('./backend/routes/exportExcel');
const tableListRoutes = require('./backend/routes/tableList');
const nonListedAssetRoutes = require('./backend/routes/nonListedDataAsset'); // ✅ nlC数据可视化
const listedAssetRoutes = require('./backend/routes/listedDataAsset'); // ✅ lC数据可视化
const listedChartRoutes = require('./backend/routes/listedChartData'); // ✅ 新增上市公司图表数据接口
const financeRoutes = require('./backend/routes/financeTable');

app.use('/api/login', loginRoutes);
app.use('/api/company', companyDataRoutes);
app.use('/api/dataTable', dataTableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tableList', tableListRoutes);
app.use('/api/nlasset', nonListedAssetRoutes); // ✅ 注册nlC数据可视化路由
app.use('/api/lasset', listedAssetRoutes); // ✅ 注册lC数据可视化路由
app.use('/api/lchart', listedChartRoutes); // ✅ 注册图表数据路由
app.use('/api/finance', financeRoutes);
console.log('✅ 注册路由 /api/finance');



// 托管 dist 静态资源
app.use('/', express.static(path.join(__dirname, 'dist')));

// 拦截前端路由
app.get('*', (req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// 启动
app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log('🔗 API endpoints:');
  console.log('- /api/login');
  console.log('- /api/company');
  console.log('- /api/dataTable');
  console.log('- /api/upload');
  console.log('- /api/export');
  console.log('- /api/tableList');
  console.log('- /api/nlasset');
  console.log('- /api/lasset');
  console.log('- /api/lchart'); // ✅ 打印新接口
  console.log('- /api/finance'); 
});
