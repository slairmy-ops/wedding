/**
 * 在 Mac 上运行此脚本，生成「Windows 便携包」：
 * 内含 Windows 版 Node + 项目文件，拷到无 Node 的 Windows 电脑解压后双击 run.bat 即可运行。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'wedding-portable-win');
const NODE_VERSION = 'v20.18.0';
const NODE_ZIP = `node-${NODE_VERSION}-win-x64.zip`;
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_ZIP}`;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Node' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirect = res.headers.location;
        file.close();
        fs.unlinkSync(dest);
        return download(redirect.startsWith('http') ? redirect : new URL(redirect, url).href, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlinkSync(dest); reject(err); });
  });
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) rmDir(p);
    else fs.unlinkSync(p);
  });
  fs.rmdirSync(dir);
}

async function main() {
  console.log('正在准备 Windows 便携包（在 Mac 上打包，拷到 Windows 直接运行）...\n');

  if (fs.existsSync(OUT)) rmDir(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  const zipPath = path.join(ROOT, 'dist', NODE_ZIP);
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  if (!fs.existsSync(zipPath)) {
    console.log('正在下载 Windows 版 Node.js...');
    await download(NODE_URL, zipPath);
    console.log('下载完成。');
  } else {
    console.log('使用已缓存的 Node Windows zip。');
  }

  const tempUnzip = path.join(distDir, 'node-win-temp');
  if (fs.existsSync(tempUnzip)) rmDir(tempUnzip);
  fs.mkdirSync(tempUnzip, { recursive: true });
  execSync(`unzip -o -q "${zipPath}" -d "${tempUnzip}"`, { stdio: 'inherit' });
  const extracted = fs.readdirSync(tempUnzip);
  const nodeDirName = extracted.find((n) => n.startsWith('node-') && n.includes('win'));
  if (!nodeDirName) throw new Error('解压后未找到 node 目录');
  const nodeDir = path.join(OUT, 'node');
  fs.renameSync(path.join(tempUnzip, nodeDirName), nodeDir);
  rmDir(tempUnzip);

  ['server.js', 'package.json', 'package-lock.json'].forEach((f) => {
    fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  });
  function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(src).forEach((name) => {
      const s = path.join(src, name);
      const d = path.join(dst, name);
      if (fs.statSync(s).isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    });
  }
  copyDir(path.join(ROOT, 'public'), path.join(OUT, 'public'));
  copyDir(path.join(ROOT, 'node_modules'), path.join(OUT, 'node_modules'));
  fs.mkdirSync(path.join(OUT, 'photos'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'music'), { recursive: true });

  const runBat = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动婚纱照展示...
echo 启动后请在浏览器打开: http://localhost:3000
echo 关闭此窗口将停止服务器。
echo.
"node\\node.exe" server.js
pause
`;
  fs.writeFileSync(path.join(OUT, 'run.bat'), runBat.replace(/\n/g, '\r\n'), 'utf8');

  const readme = `婚纱照展示 - Windows 便携版使用说明
========================================

1. 将本文件夹整个拷贝到 U 盘或目标 Windows 电脑（无需安装 Node）。

2. 把婚纱照放到 photos 文件夹（支持 .jpg / .png / .gif / .webp）。
   把背景音乐 .mp3 放到 music 文件夹。

3. 双击 run.bat 启动。浏览器打开 http://localhost:3000 即可观看。

4. 关闭 run.bat 的黑色窗口即停止服务。

如有防火墙提示，选择“允许访问”。
`;
  fs.writeFileSync(path.join(OUT, '使用说明.txt'), readme, 'utf8');

  console.log('\n已生成: wedding-portable-win/');
  console.log('请将该文件夹拷贝到 U 盘，在 Windows 电脑上解压后双击 run.bat 运行。');
}

main().catch((e) => { console.error(e); process.exit(1); });
