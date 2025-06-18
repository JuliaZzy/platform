const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const router = express.Router();
const multer = require('multer');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'reports');
const METADATA_PATH = path.join(UPLOADS_DIR, 'metadata.json');
const ensureDirectoryExists = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
};

// 读取元数据文件
const readMetadata = async () => {
  await ensureDirectoryExists();
  
  try {
    const data = await fs.readFile(METADATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

// 写入元数据文件
const writeMetadata = async (data) => {
  await ensureDirectoryExists();
  await fs.writeFile(METADATA_PATH, JSON.stringify(data, null, 2));
};

// --- Multer 配置 ---
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectoryExists();
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});


/**
 * @route   GET /api/reports
 * @desc    获取所有报告文件列表，并按照 metadata.json 中的顺序排序
 */
router.get('/', async (req, res) => {
  try {
    await ensureDirectoryExists();
    const [metadata, filesOnDisk] = await Promise.all([
      readMetadata(),
      fs.readdir(UPLOADS_DIR)
    ]);

    const pdfFiles = filesOnDisk.filter(file => 
      file.endsWith('.pdf') && file !== 'metadata.json'
    );

    if (metadata.length === 0) {
      const reports = await Promise.all(
        pdfFiles.map(async (file) => {
          const stats = await fs.stat(path.join(UPLOADS_DIR, file));
          return {
            name: file,
            size: stats.size,
            uploadTime: stats.mtime
          };
        })
      );
      return res.json(reports);
    }

    const reportDetails = await Promise.all(
      metadata
        .filter(meta => pdfFiles.includes(meta.filename))
        .map(async (meta) => {
          const stats = await fs.stat(path.join(UPLOADS_DIR, meta.filename));
          return {
            name: meta.filename,
            size: stats.size,
            uploadTime: stats.mtime
          };
        })
    );

    res.json(reportDetails);
  } catch (error) {
    console.error('Failed to load reports:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



/**
 * @route POST /api/reports/upload
 * @desc 新增文件
 */
router.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未选择文件' });
    }

    const newFilename = req.file.filename;
    let metadata = await readMetadata();

    // 检查是否已存在同名文件
    if (metadata.some(item => item.filename === newFilename)) {
      return res.status(409).json({ 
        message: '文件已存在，请使用替换功能',
        filename: newFilename
      });
    }

    // 添加到元数据
    metadata.unshift({ filename: newFilename });
    await writeMetadata(metadata);

    res.status(201).json({
      message: '文件新增成功',
      filename: newFilename
    });
  } catch (error) {
    console.error('新增文件失败:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: error.message 
    });
  }
});

/**
 * @route PUT /api/reports/replace
 * @desc 替换指定文件
 */
router.post('/replace', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file || !req.body.oldFilename) {
      return res.status(400).json({ message: '需要提供新文件和待替换文件名' });
    }

    const newFilename = req.file.filename;
    const oldFilename = req.body.oldFilename;
    let metadata = await readMetadata();

    // 验证旧文件存在
    const oldFileExists = metadata.some(item => item.filename === oldFilename);
    if (!oldFileExists) {
      return res.status(404).json({ message: '待替换文件不存在' });
    }

    // 删除旧文件
    try {
      await fsp.unlink(path.join(UPLOADS_DIR, oldFilename));
    } catch (err) {
      console.warn('旧文件删除失败:', err);
    }

    // 更新元数据
    metadata = metadata.map(item => 
      item.filename === oldFilename ? { ...item, filename: newFilename } : item
    );

    await writeMetadata(metadata);
    
    res.status(200).json({
      message: '文件替换成功',
      oldFilename,
      newFilename
    });

  } catch (error) {
    console.error('替换失败:', error);
    res.status(500).json({ 
      message: '替换操作失败',
      error: error.message 
    });
  }
});


/**
 * @route   POST /api/reports/order
 * @desc    更新PDF文件的排序
 */
router.post('/order', async (req, res) => {
  try {
    const { orderedFilenames } = req.body;

    // 验证输入格式
    if (!Array.isArray(orderedFilenames)) {
      return res.status(400).json({ 
        code: 40001,
        message: '无效请求格式：需要文件名数组',
        suggestion: '请检查参数是否为数组格式'
      });
    }

    // 读取磁盘实际文件
    const filesOnDisk = await fs.readdir(UPLOADS_DIR);
    const existingPdfFiles = filesOnDisk.filter(file => 
      file.endsWith('.pdf') && file !== 'metadata.json'
    );

    // 验证文件是否存在
    const missingFiles = orderedFilenames.filter(
      filename => !existingPdfFiles.includes(filename)
    );
    
    if (missingFiles.length > 0) {
      return res.status(404).json({
        code: 40401,
        message: '部分文件不存在',
        missingFiles,
        existingFiles: existingPdfFiles
      });
    }

    // 生成新元数据（保留可能的额外字段）
    const currentMetadata = await readMetadata();
    const metadataMap = new Map(currentMetadata.map(item => [item.filename, item]));
    
    const newMetadata = orderedFilenames.map(filename => ({
      ...(metadataMap.get(filename) || {}),
      filename
    }));

    // 写入元数据
    await writeMetadata(newMetadata);

    res.json({
      success: true,
      message: `成功更新 ${orderedFilenames.length} 个文件的排序`,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    const errorId = Date.now();
    console.error(`[${errorId}] 排序更新失败:`, error);
    
    res.status(500).json({
      code: 50001,
      message: '服务器处理排序时出错',
      errorId,
      error: process.env.NODE_ENV === 'development' ? 
        error.message : undefined
    });
  }
});


/**
 * @route   DELETE /api/reports/:filename
 * @desc    删除指定的 PDF 文件，并更新元数据
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..')) return res.status(400).send('Invalid filename.');
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filePath);
    let metadata = await readMetadata();
    metadata = metadata.filter(m => m.filename !== filename);
    await writeMetadata(metadata);
    
    res.status(200).json({ message: `File '${filename}' deleted.` });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).send('File not found.');
    } else {
      console.error('Failed to delete report:', error);
      res.status(500).send('Server error during deletion.');
    }
  }
});


/**
 * @route   GET /api/reports/download/:filename
 * @desc    下载指定文件并添加中文水印
 */
router.get('/download/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    await fs.access(filePath);
    
    try {
      const fontPath = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Regular.otf');
      const [existingPdfBytes, fontBytes] = await Promise.all([
        fs.readFile(filePath),
        fs.readFile(fontPath)
      ]);

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);
      const customFont = await pdfDoc.embedFont(fontBytes);
      
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText('高金智库数据资产研究课题组', {
          x: width / 2 - 180,
          y: height / 2 - 150,
          font: customFont,
          size: 48,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.2,
          rotate: degrees(45),
        });
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(pdfBytes));
    } catch (processingError) {
      console.warn('Watermark failed, sending original file:', processingError);
      res.download(filePath);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).send('File not found');
    }
    console.error('Download error:', error);
    res.status(500).send('Error processing file');
  }
});


module.exports = router;