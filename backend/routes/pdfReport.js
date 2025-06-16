const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'reports');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024 // 500MB
  }
});

/**
 * @route   POST /api/reports/upload
 * @desc    上传 PDF 文件
 */
router.post('/upload', upload.single('report'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).json({ 
    message: 'File uploaded successfully', 
    filename: req.file.filename 
  });
});

/**
 * @route   GET /api/reports
 * @desc    获取所有已上传的 PDF 文件列表 (包含详细信息)
 */
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    
    const reportDetails = files
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size, // 文件大小 (bytes)
          uploadTime: stats.mtime, // 最后修改时间，作为上传时间
        };
      })
      // 按时间倒序排列，最新的在前面
      .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    res.json(reportDetails);
  } catch (err) {
    console.error('Could not list the directory or get file stats.', err);
    return res.status(500).send('Server error');
  }
});

/**
 * @route   DELETE /api/reports/:filename
 * @desc    删除指定的 PDF 文件
 */
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(UPLOADS_DIR, decodedFilename);
    
    // 安全检查：确保文件路径在允许的目录内
    if (filePath.indexOf(UPLOADS_DIR) !== 0) {
      return res.status(400).send('Invalid file path.');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // 同步删除文件
      res.status(200).json({ message: `文件 '${decodedFilename}' 已被成功删除。` });
    } else {
      res.status(404).json({ message: '文件未找到。' });
    }
  } catch (err) {
    console.error('删除文件时出错:', err);
    res.status(500).send('删除文件时服务器出错。');
  }
});


/**
 * @route   GET /api/reports/download/:filename
 * @desc    下载指定文件并添加中文水印
 */
router.get('/download/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  try {
    const fontPath = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Regular.otf'); 
    
    const existingPdfBytes = fs.readFileSync(filePath);
    const fontBytes = fs.readFileSync(fontPath);
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    pdfDoc.registerFontkit(fontkit);
    
    const customFont = await pdfDoc.embedFont(fontBytes);
    
    const watermarkColor = rgb(0.5, 0.5, 0.5);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText('高金智库数据资产研究课题组', {
        x: width / 2 - 180,
        y: height / 2 - 150,
        font: customFont,
        size: 48,
        color: watermarkColor,
        opacity: 0.2,
        rotate: degrees(45),
      });
    }

    const pdfBytes = await pdfDoc.save();

    // ==================== 核心修改 ====================
    // 对包含非ASCII字符的文件名进行编码，以符合HTTP标准
    const encodedFilename = encodeURIComponent(`${filename}`);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    // ===============================================
    
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Error watermarking PDF:', err);
    res.status(500).send('Error processing file.');
  }
});

module.exports = router;
