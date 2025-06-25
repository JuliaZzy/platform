const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const router = express.Router();
const multer = require('multer');
const db = require('../db/db');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'reports');
const ensureDirectoryExists = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
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
    const { rows } = await db.query(
      'SELECT id, name, size, upload_time, download_count FROM reports ORDER BY order_index ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Failed to load reports from DB:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/reports/upload
 * @desc 新增文件
 */
router.post('/upload', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未选择文件' });
  }

  const { filename: name, size } = req.file;

  try {
    await db.query('UPDATE reports SET order_index = order_index + 1');
    const { rows } = await db.query(
      'INSERT INTO reports(name, size, order_index) VALUES($1, $2, $3) RETURNING *',
      [name, size, 0]
    );

    res.status(201).json({
      message: '文件新增成功',
      report: rows[0]
    });
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'reports_name_key') {
      return res.status(409).json({
        message: '文件已存在，请使用替换功能或重命名文件',
        filename: name
      });
    }
    console.error('新增文件失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

/**
 * @route POST /api/reports/replace
 * @desc 替换指定文件
 */
router.post('/replace', upload.single('pdfFile'), async (req, res) => {
  const { idToReplace } = req.body;

  if (!req.file || !idToReplace) {
    return res.status(400).json({ message: '需要提供新文件和被替换文件的ID' });
  }

  const { filename: newName, size: newSize } = req.file;
  let oldName = '';

  try {
    // 1. 开始数据库事务
    await db.query('BEGIN');

    // 2. 查询旧记录以获取旧文件名，并锁定该行以防并发问题
    const oldReportResult = await db.query('SELECT name FROM reports WHERE id = $1 FOR UPDATE', [idToReplace]);
    if (oldReportResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: '待替换的记录不存在' });
    }
    oldName = oldReportResult.rows[0].name;

    // 3. 更新数据库记录为新文件的信息
    const updateResult = await db.query(
      'UPDATE reports SET name = $1, size = $2, upload_time = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newName, newSize, idToReplace]
    );

    // 4. 如果新旧文件名不同，则删除旧的物理文件
    if (oldName && oldName !== newName) {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, oldName));
      } catch (unlinkError) {
        console.warn(`旧文件 ${oldName} 删除失败:`, unlinkError.message);
      }
    }
    
    // 5. 提交事务
    await db.query('COMMIT');
    
    res.status(200).json({
      message: '文件替换成功',
      report: updateResult.rows[0]
    });

  } catch (error) {
    await db.query('ROLLBACK');
    if (error.code === '23505' && error.constraint === 'reports_name_key') {
      return res.status(409).json({
        message: `文件名 '${newName}' 已被另一个文件占用，请更换文件名。`,
        filename: newName
      });
    }

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
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ message: '无效请求格式：需要 ID 数组' });
  }

  try {
    const query = `
      UPDATE reports SET order_index = CASE id
        ${orderedIds.map((id, index) => `WHEN ${parseInt(id, 10)} THEN ${index}`).join(' ')}
      END
      WHERE id IN (${orderedIds.join(',')})
    `;

    await db.query(query);
    res.json({
      success: true,
      message: `成功更新 ${orderedIds.length} 个文件的排序`
    });
  } catch (error) {
    console.error('排序更新失败:', error);
    res.status(500).json({ message: '服务器处理排序时出错' });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    根据 ID 删除指定的 PDF 文件和数据库记录
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. 从数据库删除记录，并返回被删除的文件名
    const { rows } = await db.query('DELETE FROM reports WHERE id = $1 RETURNING name', [id]);

    if (rows.length === 0) {
      return res.status(404).send('File not found in database.');
    }

    const { name } = rows[0];

    // 2. 从磁盘删除文件
    const filePath = path.join(UPLOADS_DIR, name);
    await fs.unlink(filePath);
    
    res.status(200).json({ message: `File '${name}' deleted successfully.` });
  } catch (error) {
    console.error('Failed to delete report:', error);
    res.status(500).send('Server error during deletion.');
  }
});

/**
 * @route   GET /api/reports/download/:id
 * @desc    下载指定文件并添加中文水印
 */
router.get('/download/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. 原子性地增加下载计数，并返回文件名
        const { rows } = await db.query(
            'UPDATE reports SET download_count = download_count + 1 WHERE id = $1 RETURNING name',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send('File not found.');
        }

        const { name: filename } = rows[0];
        const filePath = path.join(UPLOADS_DIR, filename);

        // 2. 触发浏览器下载
        res.download(filePath, filename, (err) => {
            if (err) {
                // res.download 会自动处理大部分错误和响应结束，
                // 但如果头部已发送后发生错误，这里可以记录日志
                console.error(`下载文件 ${filename} 时发生错误:`, err);
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error processing file');
    }
});

module.exports = router;