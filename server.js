require('dotenv').config();
const express = require('express');
//const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const { sendFeedbackEmail } = require('./backend/utils/mailer');

// 中间件
//app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json()); // 确保这个也在，它是 bodyParser 的替代品，用于解析 JSON
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080', 
      'http://10.180.238.0:8080',
      process.env.CORS_ORIGIN // 添加生产环境地址 (如果设置了)
    ].filter(Boolean); // 过滤掉 undefined/null

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));


// ▼▼▼ 新增的反馈接口 - 使用 app.post ▼▼▼
app.post('/api/feedback', async (req, res) => { // <--- 使用 app.post 并修改路径
  const feedbackData = req.body;

  if (!feedbackData.name || !feedbackData.contact || !feedbackData.details) {
    return res.status(400).json({ error: '姓名、联系方式和详情不能为空。' });
  }

  try {
    const success = await sendFeedbackEmail(feedbackData);
    if (success) {
      res.status(200).json({ message: '反馈提交成功！' });
    } else {
      res.status(500).json({ error: '邮件发送失败，请稍后再试。' });
    }
  } catch (err) {
    console.error('❌ 处理反馈时出错:', err);
    res.status(500).json({ error: '服务器内部错误。' });
  }
});
// ▲▲▲ 新增的反馈接口 - 使用 app.post ▲▲▲


// 后端 API 路由
const loginRoutes = require('./backend/routes/login');
const companyDataRoutes = require('./backend/routes/companiesData');
const dataTableRoutes = require('./backend/routes/dataTable');
const uploadRoutes = require('./backend/routes/excelUpload');
const exportRoutes = require('./backend/routes/exportExcel');
const nonListedAssetRoutes = require('./backend/routes/nonListedDataAsset'); // ✅ nlC数据可视化
const listedAssetRoutes = require('./backend/routes/listedDataAsset'); // ✅ lC数据可视化
const listedChartRoutes = require('./backend/routes/listedChartData'); // ✅ 新增上市公司图表数据接口
const financeAssetRoutes = require('./backend/routes/financingDataAsset'); // ✅ finance数据可视化
const financeRoutes = require('./backend/routes/financeTable');
const statusUpdateRoutes = require('./backend/routes/statusUpdateApi');

app.use('/api/login', loginRoutes);
app.use('/api/company', companyDataRoutes);
app.use('/api/dataTable', dataTableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/nlasset', nonListedAssetRoutes); // ✅ 注册nlC数据可视化路由
app.use('/api/lasset', listedAssetRoutes); // ✅ 注册lC数据可视化路由
app.use('/api/lchart', listedChartRoutes); // ✅ 注册图表数据路由
app.use('/api/finance', financeAssetRoutes); // ✅ 注册finance数据可视化路由
app.use('/api/financeupload', financeRoutes);
app.use('/api/adminpage', statusUpdateRoutes);




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
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log('🔗 API endpoints:');
  console.log('- /api/login');
  console.log('- /api/company');
  console.log('- /api/dataTable');
  console.log('- /api/upload');
  console.log('- /api/export');
  console.log('- /api/nlasset');
  console.log('- /api/lasset');
  console.log('- /api/lchart'); // ✅ 打印新接口
  console.log('- /api/finance'); 
  console.log('- /api/financeupload');
  console.log('- /api/adminpage'); 
});
