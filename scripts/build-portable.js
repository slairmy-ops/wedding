const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'wedding-portable');

if (!fs.existsSync(dist)) {
  console.error('请先执行: npm run pack');
  process.exit(1);
}

if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

const winExe = path.join(dist, 'wedding-photo-gallery-win.exe');
const macExe = path.join(dist, 'wedding-photo-gallery-macos');
const macExeDefault = path.join(dist, 'wedding-photo-gallery');
if (fs.existsSync(winExe)) fs.copyFileSync(winExe, path.join(out, 'wedding-photo-gallery-win.exe'));
if (fs.existsSync(macExe)) fs.copyFileSync(macExe, path.join(out, 'wedding-photo-gallery-macos'));
else if (fs.existsSync(macExeDefault)) fs.copyFileSync(macExeDefault, path.join(out, 'wedding-photo-gallery-macos'));

['photos', 'music'].forEach(dir => {
  const p = path.join(out, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  const readme = path.join(p, '请将文件放于此文件夹.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, dir === 'photos' ? '请将婚纱照图片放于此文件夹（.jpg / .png / .gif / .webp）' : '请将背景音乐 .mp3 放于此文件夹', 'utf8');
  }
});

const readmeSrc = path.join(root, '发布包说明.md');
if (fs.existsSync(readmeSrc)) fs.copyFileSync(readmeSrc, path.join(out, '使用说明.md'));

console.log('便携包已生成到: wedding-portable/');
console.log('请将该文件夹整体拷贝到 U 盘或其它电脑使用。');
