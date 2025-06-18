// 1. 环境变量 + 初始化
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sendFeedbackEmail } = require('./backend/utils/mailer');

const UPLOADS_DIR = path.resolve(__dirname, 'backend', 'public', 'uploads', 'reports');
const METADATA_PATH = path.join(UPLOADS_DIR, 'metadata.json'); 

const app = express();
const port = process.env.PORT || 3000;

// 2. 全局 CORS 中间件
app.use(cors({
  origin: ['http://10.180.238.0:8080', 'http://localhost:8080'], // 只允许你的前端访问
  credentials: true // 如果未来需要用到 cookie或session
}));

// 3. 创建上传目录
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`✅ Upload directory created: ${UPLOADS_DIR}`);
}

// 4. Multer 中间件配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

// 5. 定义文件上传的专属路由
app.post('/api/pdfupload', upload.single('pdfFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  res.status(201).json({
    message: 'File uploaded successfully!',
    filename: req.file.filename // 将保存的文件名返回给前端
  });
});
// 日志中间件
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// 6. 其他中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/api/feedback', async (req, res) => {
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

const initMetadata = async () => {
  try {
    const files = await fs.promises.readdir(UPLOADS_DIR);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length > 0 && !fs.existsSync(METADATA_PATH)) {
      await fs.promises.writeFile(
        METADATA_PATH,
        JSON.stringify(pdfFiles.map(filename => ({ filename })), null, 2),
        'utf8'
      );
      console.log('✅ Metadata initialized with files:', pdfFiles);
    }
  } catch (error) {
    console.error('❌ Failed to initialize metadata:', error);
  }
};


// 7. 其他业务 API 路由
const loginRoutes = require('./backend/routes/login');
const dataTableRoutes = require('./backend/routes/dataTable');
const pdfReportRoutes = require('./backend/routes/pdfReport');
const companyDataRoutes = require('./backend/routes/dashboardPage/companiesData');
const nonListedAssetRoutes = require('./backend/routes/dashboardPage/nonListedDataAsset');
const listedAssetRoutes = require('./backend/routes/dashboardPage/listedDataAsset');
const listedChartRoutes = require('./backend/routes/dashboardPage/listedChartData');
const financeAssetRoutes = require('./backend/routes/dashboardPage/financingDataAsset');
const financeRoutes = require('./backend/routes/dashboardPage/financeBank');
const uploadRoutes = require('./backend/routes/adminPage/excelUpload');
const exportRoutes = require('./backend/routes/adminPage/exportExcel');
const statusUpdateRoutes = require('./backend/routes/adminPage/statusUpdateApi');
const adminTableDataRoutes = require('./backend/routes/adminPage/adminTableData');

app.use('/api/login', loginRoutes);
app.use('/api/company', companyDataRoutes);
app.use('/api/reports', pdfReportRoutes);
app.use('/api/dataTable', dataTableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/nlasset', nonListedAssetRoutes);
app.use('/api/lasset', listedAssetRoutes);
app.use('/api/lchart', listedChartRoutes);
app.use('/api/finance', financeAssetRoutes);
app.use('/api/financeupload', financeRoutes);
app.use('/api/adminpage', statusUpdateRoutes.router);
app.use('/api/admintable', adminTableDataRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 8. 静态资源 + Fallback
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send({ message: 'API endpoint not found' });
  }
});

// 9. 启动服务器
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${port}`);
  console.log('🔗 API endpoints:');
  console.log('- /api/login');
  console.log('- /api/company');
  console.log('- /api/dataTable');
  console.log('- /api/upload');
  console.log('- /api/export');
  console.log('- /api/nlasset');
  console.log('- /api/lasset');
  console.log('- /api/lchart');
  console.log('- /api/finance');
  console.log('- /api/financeupload');
  console.log('- /api/adminpage');
  console.log('- /api/admintable');
  console.log('- Tus upload handler mounted at /api/files');
});

// 10. 设置服务器超时：10分钟
server.timeout = 10 * 60 * 1000;
server.on('listening', initMetadata);