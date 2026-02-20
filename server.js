const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 打包成 exe 时，照片/音乐从 exe 所在目录读取；否则从项目目录
const APP_ROOT = typeof process.pkg !== 'undefined' ? path.dirname(process.execPath) : __dirname;
const PHOTOS_DIR = path.join(APP_ROOT, 'photos');
const MUSIC_DIR = path.join(APP_ROOT, 'music');

// 确保音乐文件夹存在
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// 允许跨域
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供照片文件
app.use('/photos', express.static(PHOTOS_DIR));
// 静态文件服务 - 提供音乐文件
app.use('/music', express.static(MUSIC_DIR));

// 获取所有照片列表
app.get('/api/photos', (req, res) => {
  try {
    // 检查照片文件夹是否存在
    if (!fs.existsSync(PHOTOS_DIR)) {
      // 如果不存在，创建文件夹
      fs.mkdirSync(PHOTOS_DIR, { recursive: true });
      return res.json({ photos: [] });
    }

    // 读取文件夹中的所有文件
    const files = fs.readdirSync(PHOTOS_DIR);
    
    // 过滤出图片文件
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const photos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        filename: file,
        url: `/photos/${file}`,
        path: path.join(PHOTOS_DIR, file)
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    res.json({ photos });
  } catch (error) {
    console.error('读取照片文件夹错误:', error);
    res.status(500).json({ error: '读取照片失败', details: error.message });
  }
});

// 获取所有音乐列表（.mp3）
app.get('/api/music', (req, res) => {
  try {
    if (!fs.existsSync(MUSIC_DIR)) {
      fs.mkdirSync(MUSIC_DIR, { recursive: true });
      return res.json({ music: [] });
    }
    const files = fs.readdirSync(MUSIC_DIR);
    const music = files
      .filter(file => path.extname(file).toLowerCase() === '.mp3')
      .map(file => ({ filename: file, url: `/music/${encodeURIComponent(file)}` }))
      .sort((a, b) => a.filename.localeCompare(b.filename));
    res.json({ music });
  } catch (error) {
    console.error('读取音乐文件夹错误:', error);
    res.status(500).json({ error: '读取音乐失败', details: error.message });
  }
});

// 提供前端静态文件
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`✨ 婚纱照展示服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 照片文件夹: ${PHOTOS_DIR}`);
  console.log(`🎵 音乐文件夹: ${MUSIC_DIR}（支持 .mp3 背景音乐）`);
  console.log(`💡 请将婚纱照放在 ${PHOTOS_DIR}，将 .mp3 音乐放在 ${MUSIC_DIR}`);
});
