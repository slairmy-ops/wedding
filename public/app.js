let photos = [];
let currentPageIndex = 0;
let pages = [];
let slideTrack = null;
let slideElements = [];
let touchStartX = 0;
let currentTransition = 'fade';
const transitions = ['fade', 'flip', '3d', 'scale', 'slide', 'rotate'];

// 每页照片数量：仅 1 张（竖版）或 2 张
const AUTO_ADVANCE_MS = 6500;
let autoTimer = null;

let musicList = [];
let currentBackgroundEffect = 'B'; // 'A', 'B', 'C'

document.addEventListener('DOMContentLoaded', init);

async function init() {
    slideTrack = document.getElementById('slide-track');
    initBackgroundEffect();
    createRoseRain();
    //createWaterSurfaceBubbles();
    startBackgroundMusic();
    await loadPhotos();

    if (photos.length === 0) {
        showEmptyState();
        hideLoading();
        return;
    }

    createPages();
    buildSlides();
    showPage(0);
    hideLoading();
    startAutoAdvance();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // 双击进入全屏
    document.addEventListener('dblclick', toggleFullscreen);
}

function createBubbles() {
    const container = document.getElementById('bubbles');
    if (!container) return;
    
    const count = 18;
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = 20 + Math.random() * 50;
        const left = Math.random() * 100;
        const duration = 12 + Math.random() * 16;
        const delay = Math.random() * 20;
        const drift = (Math.random() - 0.5) * 80;
        const scaleEnd = 0.6 + Math.random() * 0.6;
        
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = left + '%';
        bubble.style.animationDuration = duration + 's';
        bubble.style.animationDelay = -delay + 's';
        bubble.style.setProperty('--bubble-drift', drift + 'px');
        bubble.style.setProperty('--bubble-scale-end', scaleEnd);
        
        container.appendChild(bubble);
    }
}

function initBackgroundEffect() {
    const container = document.getElementById('background-effect');
    if (!container) return;
    
    // 创建光斑容器（用于B和C效果）
    const lightSpots = document.createElement('div');
    lightSpots.className = 'light-spots';
    container.appendChild(lightSpots);
    
    // 初始化效果B（直接设置，不切换）
    currentBackgroundEffect = 'B';
    container.className = 'background-effect effect-B';
    createLightSpots();
}

function switchBackgroundEffect(effect) {
    const container = document.getElementById('background-effect');
    if (!container) return;
    
    // 如果指定了效果，直接切换；否则保持当前效果
    if (effect && ['A', 'B', 'C'].includes(effect)) {
        currentBackgroundEffect = effect;
    }
    
    container.className = `background-effect effect-${currentBackgroundEffect}`;
    
    // B和C效果需要光斑
    if (currentBackgroundEffect === 'B' || currentBackgroundEffect === 'C') {
        createLightSpots();
    } else {
        const lightSpots = container.querySelector('.light-spots');
        if (lightSpots) lightSpots.innerHTML = '';
    }
    
    console.log(`背景效果已切换到: ${currentBackgroundEffect === 'A' ? 'A - 柔和渐变' : currentBackgroundEffect === 'B' ? 'B - 动态光斑' : 'C - 渐变+光斑'}`);
}

function createLightSpots() {
    const container = document.querySelector('.light-spots');
    if (!container) return;
    
    container.innerHTML = '';
    const count = 8;
    
    for (let i = 0; i < count; i++) {
        const spot = document.createElement('div');
        spot.className = 'light-spot';
        const size = 200 + Math.random() * 300;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = 15 + Math.random() * 20;
        const delay = Math.random() * -35;
        
        spot.style.width = size + 'px';
        spot.style.height = size + 'px';
        spot.style.left = left + '%';
        spot.style.top = top + '%';
        spot.style.animationDuration = duration + 's';
        spot.style.animationDelay = delay + 's';
        container.appendChild(spot);
    }
}

function createWaterSurfaceBubbles() {
    const container = document.getElementById('water-surface');
    if (!container) return;
    const count = 32;
    const bubbles = [];
    
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'water-bubble';
        const size = 24 + Math.random() * 44;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        
        const bubbleData = {
            element: bubble,
            x: Math.random() * (window.innerWidth - size),
            y: Math.random() * (window.innerHeight - size),
            vx: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 1 : -1) * 0.5,
            vy: (Math.random() - 0.5) * 2.0 + (Math.random() > 0.5 ? 1 : -1) * 0.5,
            size: size
        };
        
        bubble.style.transform = `translate(${bubbleData.x}px, ${bubbleData.y}px)`;
        bubble.style.left = '0';
        bubble.style.top = '0';
        container.appendChild(bubble);
        bubbles.push(bubbleData);
    }
    
    let animationId = null;
    let lastTime = performance.now();
    let isRunning = true;
    
    function animateBubbles(currentTime) {
        if (!isRunning) return;
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // 使用固定时间步长确保动画流畅，即使帧率波动也不受影响
        const timeStep = Math.min(deltaTime / 16, 2);
        
        // 批量更新所有水泡位置，减少重排
        bubbles.forEach(bubble => {
            bubble.x += bubble.vx * timeStep;
            bubble.y += bubble.vy * timeStep;
            
            const maxX = window.innerWidth - bubble.size;
            const maxY = window.innerHeight - bubble.size;
            
            if (bubble.x <= 0) {
                bubble.x = 0;
                bubble.vx = Math.abs(bubble.vx) * (0.6 + Math.random() * 0.4);
                bubble.vy = (Math.random() - 0.5) * 2.5;
            } else if (bubble.x >= maxX) {
                bubble.x = maxX;
                bubble.vx = -Math.abs(bubble.vx) * (0.6 + Math.random() * 0.4);
                bubble.vy = (Math.random() - 0.5) * 2.5;
            }
            
            if (bubble.y <= 0) {
                bubble.y = 0;
                bubble.vy = Math.abs(bubble.vy) * (0.6 + Math.random() * 0.4);
                bubble.vx = (Math.random() - 0.5) * 2.5;
            } else if (bubble.y >= maxY) {
                bubble.y = maxY;
                bubble.vy = -Math.abs(bubble.vy) * (0.6 + Math.random() * 0.4);
                bubble.vx = (Math.random() - 0.5) * 2.5;
            }
            
            // 直接设置 transform，不使用 transition，确保立即更新
            bubble.element.style.transform = `translate3d(${bubble.x}px, ${bubble.y}px, 0)`;
        });
        
        // 确保动画循环持续运行，即使其他操作阻塞也不会停止
        animationId = requestAnimationFrame(animateBubbles);
    }
    
    // 立即启动动画，不等待其他操作
    animationId = requestAnimationFrame(animateBubbles);
    
    // 确保动画在页面可见时继续运行
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !isRunning) {
            lastTime = performance.now();
            isRunning = true;
            animationId = requestAnimationFrame(animateBubbles);
        }
    });
    
    window.addEventListener('resize', () => {
        bubbles.forEach(bubble => {
            const maxX = window.innerWidth - bubble.size;
            const maxY = window.innerHeight - bubble.size;
            if (bubble.x > maxX) bubble.x = maxX;
            if (bubble.y > maxY) bubble.y = maxY;
        });
    });
}

function createRoseTrees() {
    const leftEl = document.getElementById('rose-tree-left');
    const rightEl = document.getElementById('rose-tree-right');
    if (!leftEl || !rightEl) return;
    
    leftEl.appendChild(createArchFlowerCluster(false));
    rightEl.appendChild(createArchFlowerCluster(true));
}

function createArchFlowerCluster(isMirror) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    if (isMirror) svg.setAttribute('transform', 'scale(-1, 1)');
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'arch-flower-grad');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '100%');
    grad.setAttribute('x2', '0%');
    grad.setAttribute('y2', '0%');
    [{ offset: '0%', color: '#ffc0cb' }, { offset: '40%', color: '#ffb6c1' }, { offset: '70%', color: '#db7093' }, { offset: '100%', color: '#c71585' }].forEach(({ offset, color }) => {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 婚礼拱门：粉色气球簇，从下到上、由外向内
    const balloonPositions = [
        { x: 85, y: 950 }, { x: 95, y: 920 }, { x: 75, y: 900 }, { x: 90, y: 880 }, { x: 70, y: 860 },
        { x: 88, y: 820 }, { x: 65, y: 800 }, { x: 82, y: 770 }, { x: 60, y: 750 }, { x: 78, y: 720 },
        { x: 55, y: 690 }, { x: 72, y: 660 }, { x: 50, y: 630 }, { x: 68, y: 600 }, { x: 48, y: 570 },
        { x: 62, y: 540 }, { x: 45, y: 510 }, { x: 58, y: 480 }, { x: 42, y: 450 }, { x: 55, y: 420 },
        { x: 40, y: 390 }, { x: 52, y: 360 }, { x: 38, y: 330 }, { x: 50, y: 300 }, { x: 35, y: 270 },
        { x: 48, y: 240 }, { x: 32, y: 210 }, { x: 45, y: 180 }, { x: 30, y: 150 }, { x: 42, y: 120 },
        { x: 28, y: 95 }, { x: 38, y: 70 }, { x: 25, y: 50 }, { x: 35, y: 30 }
    ];
    
    balloonPositions.forEach((f, i) => {
        const r = 8 + (i % 5) * 2;
        const balloonPath = `M${f.x} ${f.y - r} C${f.x + r} ${f.y - r} ${f.x + r} ${f.y + r} ${f.x} ${f.y + r + r * 0.25} C${f.x - r} ${f.y + r} ${f.x - r} ${f.y - r} ${f.x} ${f.y - r} Z`;
        const balloon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        balloon.setAttribute('d', balloonPath);
        balloon.setAttribute('fill', 'url(#arch-flower-grad)');
        balloon.setAttribute('opacity', 0.78 + (i % 4) * 0.06);
        g.appendChild(balloon);
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        highlight.setAttribute('cx', f.x - r * 0.25);
        highlight.setAttribute('cy', f.y - r * 0.3);
        highlight.setAttribute('rx', r * 0.3);
        highlight.setAttribute('ry', r * 0.4);
        highlight.setAttribute('fill', 'rgba(255,255,255,0.4)');
        g.appendChild(highlight);
    });
    
    svg.appendChild(g);
    return svg;
}

function createRoseRain() {
    const container = document.getElementById('rose-rain');
    if (!container) return;
    
    const count = 99;
    // 粉色爱心（偏短偏宽）
    const heartPath = 'M50 78 C16 54 4 30 18 16 C30 4 50 16 50 16 C50 16 70 4 82 16 C96 30 84 54 50 78 Z';
    
    for (let i = 0; i < count; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'rose-petal';
        
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 14;
        const delay = Math.random() * -28;
        const drift = (Math.random() - 0.5) * 100;
        const rotate = (Math.random() - 0.5) * 720;
        const size = 14 + Math.random() * 20;
        
        wrap.style.left = left + '%';
        wrap.style.width = size + 'px';
        wrap.style.height = size + 'px';
        wrap.style.animationDuration = duration + 's';
        wrap.style.animationDelay = delay + 's';
        wrap.style.setProperty('--rose-drift', drift + 'px');
        wrap.style.setProperty('--rose-rotate', rotate + 'deg');
        wrap.style.opacity = (0.65 + Math.random() * 0.3);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', 'heart-grad-' + i);
        grad.setAttribute('x1', '50%');
        grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '50%');
        grad.setAttribute('y2', '100%');
        ['0%', '30%', '60%', '100%'].forEach((off, j) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', off);
            const colors = ['#ffc0cb', '#ffb6c1', '#db7093', '#c71585'];
            stop.setAttribute('stop-color', colors[j]);
            stop.setAttribute('stop-opacity', 0.95 - j * 0.1);
            grad.appendChild(stop);
        });
        defs.appendChild(grad);
        svg.appendChild(defs);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', heartPath);
        path.setAttribute('fill', 'url(#heart-grad-' + i + ')');
        path.setAttribute('stroke', 'rgba(255,182,193,0.4)');
        path.setAttribute('stroke-width', '0.8');
        svg.appendChild(path);
        
        wrap.appendChild(svg);
        container.appendChild(wrap);
    }
}

async function startBackgroundMusic() {
    const audio = document.getElementById('bgm');
    if (!audio) return;
    try {
        const res = await fetch('/api/music');
        const data = await res.json();
        musicList = data.music || [];
        if (musicList.length === 0) return;
        function playRandom() {
            const i = Math.floor(Math.random() * musicList.length);
            const track = musicList[i];
            audio.src = track.url;
            audio.play().catch(() => {});
        }
        audio.addEventListener('ended', playRandom);
        // 浏览器禁止无交互自动播放，需在首次点击/触摸时开始
        const overlay = document.createElement('div');
        overlay.className = 'music-start-overlay';
        overlay.innerHTML = '<span class="music-start-text">点击或触摸屏幕开始</span>';
        document.body.appendChild(overlay);
        function startOnInteraction() {
            playRandom();
            overlay.classList.add('hidden');
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
            document.removeEventListener('touchend', startOnInteraction);
        }
        overlay.addEventListener('click', startOnInteraction, { once: true });
        document.addEventListener('keydown', startOnInteraction, { once: true });
        document.addEventListener('touchend', startOnInteraction, { once: true });
    } catch (e) {
        console.warn('背景音乐加载失败:', e);
    }
}

async function loadPhotos() {
    try {
        const res = await fetch('/api/photos');
        const data = await res.json();
        photos = data.photos || [];
        await preloadPhotoSizes();
    } catch (e) {
        console.error('加载照片失败:', e);
        photos = [];
    }
}

// 预加载照片尺寸，用于判断横版（高<宽）
function preloadPhotoSizes() {
    return Promise.all(photos.map(photo => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                photo.width = img.naturalWidth;
                photo.height = img.naturalHeight;
                photo.isLandscape = img.naturalWidth > img.naturalHeight;
                resolve();
            };
            img.onerror = () => {
                photo.width = 0;
                photo.height = 0;
                photo.isLandscape = false;
                resolve();
            };
            img.src = photo.url;
        });
    }));
}

// 创建页面分组：横版单独一页；竖版不单独一页。末尾竖版留到下一轮与第一页组合（循环展示）
// 每轮2张照片的组合尽量不一样
function createPages() {
    pages = [];
    let i = 0;
    let carriedPortrait = null;
    
    // 记录配对历史：每张照片和哪些照片配对过
    const pairingHistory = new Map();
    photos.forEach((photo, idx) => {
        pairingHistory.set(idx, new Set());
    });
    
    // 获取照片的配对次数（用于选择最少配对的）
    function getPairingCount(photoIdx) {
        return pairingHistory.get(photoIdx)?.size || 0;
    }
    
    // 记录配对
    function recordPairing(idx1, idx2) {
        pairingHistory.get(idx1)?.add(idx2);
        pairingHistory.get(idx2)?.add(idx1);
    }
    
    // 为竖版照片找最佳配对（尽量选择未配对过的）
    function findBestPair(currentIdx) {
        const currentPhoto = photos[currentIdx];
        if (!currentPhoto || currentPhoto.isLandscape) return null;
        
        const currentPairs = pairingHistory.get(currentIdx);
        let bestIdx = null;
        let minPairCount = Infinity;
        
        // 从剩余照片中找最佳配对
        for (let j = currentIdx + 1; j < photos.length; j++) {
            const candidate = photos[j];
            if (!candidate) continue;
            
            // 如果已经配对过，跳过（优先选择未配对的）
            if (currentPairs.has(j)) continue;
            
            const pairCount = getPairingCount(j);
            if (pairCount < minPairCount) {
                minPairCount = pairCount;
                bestIdx = j;
            }
        }
        
        // 如果所有剩余照片都配对过，选择配对次数最少的
        if (bestIdx === null) {
            for (let j = currentIdx + 1; j < photos.length; j++) {
                const candidate = photos[j];
                if (!candidate) continue;
                const pairCount = getPairingCount(j);
                if (pairCount < minPairCount) {
                    minPairCount = pairCount;
                    bestIdx = j;
                }
            }
        }
        
        return bestIdx;
    }
    
    const used = new Set();
    
    while (i < photos.length) {
        if (used.has(i)) {
            i += 1;
            continue;
        }
        
        const photo = photos[i];
        const isLandscape = photo && photo.isLandscape;
        
        if (isLandscape) {
            pages.push({ photos: [photo], layout: 'layout-1' });
            used.add(i);
            i += 1;
        } else {
            // 竖版：找最佳配对（从剩余未使用的照片中找）
            let pairIdx = null;
            let minPairCount = Infinity;
            
            for (let j = i + 1; j < photos.length; j++) {
                if (used.has(j)) continue;
                const candidate = photos[j];
                if (!candidate) continue;
                
                const currentPairs = pairingHistory.get(i);
                const pairCount = getPairingCount(j);
                
                // 优先选择未配对过的
                if (currentPairs && !currentPairs.has(j)) {
                    if (pairCount < minPairCount) {
                        minPairCount = pairCount;
                        pairIdx = j;
                    }
                } else if (pairIdx === null && pairCount < minPairCount) {
                    // 如果都配对过，选择配对次数最少的
                    minPairCount = pairCount;
                    pairIdx = j;
                }
            }
            
            if (pairIdx !== null) {
                const pagePhotos = [photo, photos[pairIdx]];
                pages.push({ photos: pagePhotos, layout: 'layout-2' });
                recordPairing(i, pairIdx);
                used.add(i);
                used.add(pairIdx);
                i += 1;
            } else {
                // 没有可配对的：留到下一轮
                carriedPortrait = photo;
                used.add(i);
                i += 1;
            }
        }
    }
    
    if (carriedPortrait && pages.length > 0) {
        const first = pages[0];
        if (first.photos.length === 1) {
            first.photos.unshift(carriedPortrait);
            first.layout = 'layout-2';
            // 记录配对（carriedPortrait 和第一张）
            const carriedIdx = photos.indexOf(carriedPortrait);
            const firstIdx = photos.indexOf(first.photos[1]);
            if (carriedIdx >= 0 && firstIdx >= 0) {
                recordPairing(carriedIdx, firstIdx);
            }
        } else if (first.photos[1] && first.photos[1].isLandscape) {
            // 第一页已有 2 张且第二张是横版：拆成 [竖版, 第一张] 与 [第二张横版]，避免 3 张一页
            first.photos.unshift(carriedPortrait);
            const second = first.photos.pop();
            pages.unshift({ photos: [second], layout: 'layout-1' });
            first.layout = 'layout-2';
            // 记录配对
            const carriedIdx = photos.indexOf(carriedPortrait);
            const firstIdx = photos.indexOf(first.photos[1]);
            if (carriedIdx >= 0 && firstIdx >= 0) {
                recordPairing(carriedIdx, firstIdx);
            }
        }
    }
}

// 构建幻灯片
function buildSlides() {
    slideTrack.innerHTML = '';
    slideElements = [];
    
    pages.forEach((page, pageIndex) => {
        const slide = document.createElement('div');
        slide.className = `slide ${page.layout}`;
        
        const tiltClasses = ['tilt-left', 'tilt-right', 'tilt-left-small', 'tilt-right-small', ''];
        const isSingle = page.layout === 'layout-1';
        
        page.photos.forEach((photo, photoIndex) => {
            const container = document.createElement('div');
            container.className = `photo-container float-${(photoIndex % 3) + 1}`;
            
            if (!isSingle) {
                const tilt = tiltClasses[Math.floor(Math.random() * tiltClasses.length)];
                if (tilt) container.classList.add(tilt);
                const marginV = 12 + Math.floor(Math.random() * 32);
                const marginH = 28 + Math.floor(Math.random() * 50);
                container.style.margin = `${marginV}px ${marginH}px`;
            }
            
            const img = document.createElement('img');
            img.src = photo.url;
            img.alt = '';
            img.loading = 'lazy';
            
            // 照片加载后：单张竖版用 JS 在视口内等比例定尺寸，2 张时同理
            function fitContainerToImage() {
                const natW = img.naturalWidth;
                const natH = img.naturalHeight;
                
                if (isSingle && natW && natH) {
                    const maxW = Math.min(window.innerWidth * 0.85, window.innerWidth - 40);
                    const maxH = Math.min(window.innerHeight * 0.9, window.innerHeight - 40);
                    const scale = Math.min(maxW / natW, maxH / natH, 1);
                    container.style.width = Math.round(natW * scale) + 'px';
                    container.style.height = Math.round(natH * scale) + 'px';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    img.style.objectPosition = 'center';
                    return;
                }
                
                if (!natW || !natH) return;
                
                const style = getComputedStyle(container);
                let maxW = parseFloat(style.maxWidth);
                let maxH = parseFloat(style.maxHeight);
                
                if (!maxW || maxW <= 0 || !isFinite(maxW)) {
                    maxW = window.innerWidth * 0.44;
                }
                if (!maxH || maxH <= 0 || !isFinite(maxH)) {
                    maxH = window.innerHeight * 0.42;
                }
                
                maxW = Math.min(maxW, window.innerWidth - 40);
                maxH = Math.min(maxH, window.innerHeight - 40);
                maxW = Math.max(maxW, 280);
                maxH = Math.max(maxH, 220);
                
                const scale = Math.min(maxW / natW, maxH / natH, 1);
                const displayW = Math.round(natW * scale);
                const displayH = Math.round(natH * scale);
                
                container.style.width = displayW + 'px';
                container.style.height = displayH + 'px';
                
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.objectPosition = 'center';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
            }
            
            img.addEventListener('load', function() {
                fitContainerToImage();
                setTimeout(fitContainerToImage, 100);
                requestAnimationFrame(fitContainerToImage);
            });
            
            img.addEventListener('error', function() {
                console.warn('照片加载失败:', photo.url);
            });
            
            if (page.layout === 'layout-2') {
                const inner = document.createElement('div');
                inner.className = 'photo-inner';
                inner.appendChild(img);
                container.appendChild(inner);
            } else {
                container.appendChild(img);
            }
            slide.appendChild(container);
        });
        
        slideTrack.appendChild(slide);
        slideElements.push(slide);
    });
    
    // 应用过渡效果
    applyTransition();
}

// 应用过渡效果
function applyTransition() {
    const newClass = `slide-track transition-${currentTransition}`;
    if (slideTrack.className !== newClass) {
        slideTrack.className = newClass;
    }
}

// 切换到下一页
function showPage(index, direction = 0) {
    if (pages.length === 0) return;
    
    currentPageIndex = ((index % pages.length) + pages.length) % pages.length;
    
    // 随机选择下一个过渡效果
    currentTransition = transitions[Math.floor(Math.random() * transitions.length)];
    
    const prevIndex = (currentPageIndex - 1 + pages.length) % pages.length;
    const nextIndex = (currentPageIndex + 1) % pages.length;
    
    // 批量更新：先移除所有类，再添加需要的类，减少重排
    slideElements.forEach((el, i) => {
        el.classList.remove('active', 'prev', 'next');
        if (i === currentPageIndex) el.classList.add('active');
        else if (i === prevIndex) el.classList.add('prev');
        else if (i === nextIndex) el.classList.add('next');
    });
    
    applyTransition();
}

// 导航
function go(delta) {
    if (pages.length === 0) return;
    showPage(currentPageIndex + delta, delta);
    resetAutoAdvance();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function onKeyDown(e) {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
    }
    if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        switchBackgroundEffect('A');
    }
    if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        switchBackgroundEffect('B');
    }
    if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        switchBackgroundEffect('C');
    }
}

function onClick(e) {
    if (pages.length === 0) return;
    const w = window.innerWidth;
    if (e.clientX < w * 0.4) go(-1);
    else if (e.clientX > w * 0.6) go(1);
}

function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function onTouchEnd(e) {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        go(diff > 0 ? 1 : -1);
    }
}

function onResize() {
    // 响应式调整
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showEmptyState() {
    slideTrack.innerHTML = '';
}

function startAutoAdvance() {
    if (pages.length <= 1) return;
    stopAutoAdvance();
    autoTimer = window.setInterval(() => {
        showPage(currentPageIndex + 1, 1);
    }, AUTO_ADVANCE_MS);
}

function stopAutoAdvance() {
    if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
    }
}

function resetAutoAdvance() {
    startAutoAdvance();
}

function onVisibilityChange() {
    if (document.hidden) stopAutoAdvance();
    else startAutoAdvance();
}
