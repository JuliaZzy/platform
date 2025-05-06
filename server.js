const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// 中间件
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST'],
}));

// 后端 API 路由
const loginRoutes = require('./backend/routes/login');
const nonlistedcompanyRoutes = require('./backend/routes/nonListedCompanies');
const listedCompanyRoutes = require('./backend/routes/listedCompanies');
const dataTableRoutes = require('./backend/routes/dataTable');
const uploadRoutes = require('./backend/routes/excelUpload');
const exportRoutes = require('./backend/routes/exportExcel');
const tableListRoutes = require('./backend/routes/tableList');
const nonListedAssetRoutes = require('./backend/routes/nonListedDataAsset'); // ✅ nlC数据可视化
const listedAssetRoutes = require('./backend/routes/listedDataAsset'); // ✅ lC数据可视化

app.use('/api/login', loginRoutes);
app.use('/api/company', nonlistedcompanyRoutes);
app.use('/api/company', listedCompanyRoutes); // 重复路径没关系，同属 /api/company
app.use('/api/dataTable', dataTableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tableList', tableListRoutes);
app.use('/api/nlasset', nonListedAssetRoutes); // ✅ 注册nlC数据可视化路由
app.use('/api/lasset', listedAssetRoutes); // ✅ 注册lC数据可视化路由

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
});
