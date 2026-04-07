// 初始化 Lucide 圖示
lucide.createIcons();

// --- 視圖切換邏輯 ---
function switchView(viewId) {
  const allViews = ['view-menu', 'view-level1', 'view-level2', 'view-level3', 'view-level4', 'view-level5'];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // 關閉第一關的活躍狀態
  isLevel1Active = false;
  if (particleInterval) clearInterval(particleInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  document.body.className = "font-sans min-h-screen";

  // 先顯示目標畫面！讓元素有寬高
  document.getElementById(viewId).classList.remove('hidden');

  if (viewId === 'view-menu') {
    document.body.classList.add('bg-sky-100');
  } else if (viewId === 'view-level1') {
    document.body.classList.add('bg-sky-50');
    // 【關鍵修正】：延遲 50 毫秒啟動，確保抓得到框框寬度！
    setTimeout(() => { initLevel1(); }, 50);
  } else if (viewId === 'view-level2') {
    document.body.classList.add('bg-slate-50');
    clearBeaker();
    // ✅ 把它加在這裡！這樣只有從地圖點擊進入時，才會大風吹
    shuffleIngredients();
  } else if (viewId === 'view-level3') {
    document.body.classList.add('bg-orange-50');
    resetScenario('oil');
  } else if (viewId === 'view-level4') {
    document.body.classList.add('bg-gray-100');
  } else if (viewId === 'view-level5') {
    document.body.classList.add('bg-slate-100');
    switchRustTab('info'); // 進入第五關時，預設顯示防鏽指南
  }

  lucide.createIcons();
}
// ================= 第一關：空氣解密雷達 =================

// 1. 核心數據定義 (保持不變)
const gasData = {
  n2: {
    id: 'n2', name: '氮氣', target: 7, realPercent: 78, color: 'bg-blue-400', icon: '氮氣', size: 64, speed: 1,
    desc: '佔最多數的邊緣人！化學性質穩定，不助燃也不可燃。常被用來充在食物包裝裡防腐保鮮喔！'
  },
  o2: {
    id: 'o2', name: '氧氣', target: 2, realPercent: 21, color: 'bg-red-400', icon: '氧氣', size: 64, speed: 5,
    desc: '生命不可或缺的氣體！具有強烈的「助燃性」，會讓火燒得更旺，也是我們呼吸所需的氣體。'
  },
  other: {
    id: 'other', name: '其他', target: 1, realPercent: 1, color: 'bg-slate-400', icon: '其他', size: 56, speed: 2.5,
    desc: '包含氬氣、二氧化碳、水氣等。雖然只有 1%，但像是二氧化碳對植物光合作用可是超級重要的！'
  }
};

// 2. 狀態變數
let gasCollected = { n2: 0, o2: 0, other: 0 };
let particleInterval; // 生成泡泡的計時器
let activeParticles = []; // 存儲當前畫面上所有泡泡的物理狀態
let animationFrameId; // 遊戲迴圈的 ID
let isLevel1Active = false; // 關卡是否處於活躍狀態

// 3. 關卡初始化
function initLevel1() {
  // 重置狀態
  isLevel1Active = true;
  gasCollected = { n2: 0, o2: 0, other: 0 };
  activeParticles = [];
  updatePieChartUI(); // 更新右側圖表歸零

  const container = document.getElementById('particle-container');
  container.innerHTML = `
        <div class="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
            <i data-lucide="wind" class="w-64 h-64 text-sky-300 animate-spin-slow"></i>
        </div>`;
  lucide.createIcons();

  // 清除舊的計時器
  if (particleInterval) clearInterval(particleInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // 【修改重點 1】：設定固定的氣體陣列 (7個氮氣, 2個氧氣, 1個其他)
  const fixedGases = ['n2', 'n2', 'n2', 'n2', 'n2', 'n2', 'n2', 'o2', 'o2', 'other'];

  // 每 0.3 秒生成一顆，製造出泡泡依序進場的效果
  let spawnIndex = 0;
  particleInterval = setInterval(() => {
    if (spawnIndex < fixedGases.length) {
      spawnParticle(fixedGases[spawnIndex]); // 傳入指定的氣體類型
      spawnIndex++;
    } else {
      clearInterval(particleInterval); // 10 顆都生成完畢就停止計時器
    }
  }, 300);

  // 啟動遊戲迴圈 (物理引擎)
  startGameLoop();
}

// 4. 生成氣體泡泡 (接收固定類型，不再隨機)
function spawnParticle(fixedType) {
  if (!isLevel1Active) return;

  const container = document.getElementById('particle-container');
  const cw = Math.max(container.offsetWidth, 300);
  const ch = Math.max(container.offsetHeight, 300);
  const padding = 10;

  // 【修改重點 2】：使用傳入的指定氣體類型
  const type = fixedType;
  const gas = gasData[type];

  const bubble = document.createElement('div');
  // 【修改重點 3】：加上 text-lg 和 font-bold 讓中文在圓圈內比較好看
  bubble.className = `absolute particle-bubble rounded-full flex items-center justify-center text-white text-lg font-bold ${gas.color}`;
  bubble.style.width = `${gas.size}px`;
  bubble.style.height = `${gas.size}px`;
  bubble.innerText = gas.icon; // 這裡就會顯示中文了

  const initialX = padding + Math.random() * (cw - gas.size - padding * 2);
  const initialY = padding + Math.random() * (ch - gas.size - padding * 2);
  bubble.style.left = `${initialX}px`;
  bubble.style.top = `${initialY}px`;

  let vx = (Math.random() - 0.5) * 2 * gas.speed;
  let vy = (Math.random() - 0.5) * 2 * gas.speed;
  if (Math.abs(vx) < 0.5) vx = vx > 0 ? gas.speed : -gas.speed;
  if (Math.abs(vy) < 0.5) vy = vy > 0 ? gas.speed : -gas.speed;

  const pId = Date.now() + Math.random();
  bubble.onclick = function () { collectGas(bubble, pId); };

  container.appendChild(bubble);

  const pObject = {
    id: pId,
    type: type,
    size: gas.size,
    element: bubble,
    x: initialX,
    y: initialY,
    vx: vx,
    vy: vy,
    popping: false
  };
  activeParticles.push(pObject);
}

// 5. 遊戲迴圈 (碰撞檢測引擎)
function startGameLoop() {
  const container = document.getElementById('particle-container');
  const borderBumper = 4;

  function update() {
    if (!isLevel1Active) return;

    // 確保抓到正確的容器寬高
    const cw = Math.max(container.offsetWidth, 300);
    const ch = Math.max(container.offsetHeight, 300);

    // 步驟 1：更新位置與處理「撞牆」邊界反彈
    for (let i = 0; i < activeParticles.length; i++) {
      let p = activeParticles[i];
      if (p.popping) continue;

      p.x += p.vx;
      p.y += p.vy;

      // 防卡牆邊界檢測
      if (p.x <= borderBumper) {
        p.vx = Math.abs(p.vx);
        p.x = borderBumper;
      } else if (p.x >= (cw - p.size - borderBumper)) {
        p.vx = -Math.abs(p.vx);
        p.x = cw - p.size - borderBumper;
      }

      if (p.y <= borderBumper) {
        p.vy = Math.abs(p.vy);
        p.y = borderBumper;
      } else if (p.y >= (ch - p.size - borderBumper)) {
        p.vy = -Math.abs(p.vy);
        p.y = ch - p.size - borderBumper;
      }
    }

    // 步驟 2：處理「泡泡互相碰撞」與彈開物理效果
    for (let i = 0; i < activeParticles.length; i++) {
      for (let j = i + 1; j < activeParticles.length; j++) {
        let p1 = activeParticles[i];
        let p2 = activeParticles[j];

        if (p1.popping || p2.popping) continue;

        // 計算兩顆泡泡的圓心座標
        let r1 = p1.size / 2;
        let r2 = p2.size / 2;
        let c1x = p1.x + r1;
        let c1y = p1.y + r1;
        let c2x = p2.x + r2;
        let c2y = p2.y + r2;

        let dx = c2x - c1x;
        let dy = c2y - c1y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // 【關鍵修復 1】：防呆，避免圓心完全重疊導致距離為 0 產生 NaN 錯誤
        if (distance === 0) {
          dx = 0.1;
          dy = 0.1;
          distance = 0.1414;
        }

        // 如果距離小於兩顆泡泡的半徑相加，代表發生碰撞！
        if (distance < r1 + r2) {
          // 1. 位置修正 (防止黏在一起)
          let overlap = (r1 + r2) - distance;
          let nx = dx / distance;
          let ny = dy / distance;

          // 將重疊部分平均推開
          p1.x -= nx * (overlap / 2);
          p1.y -= ny * (overlap / 2);
          p2.x += nx * (overlap / 2);
          p2.y += ny * (overlap / 2);

          // 2. 速度計算 (彈性碰撞)
          let kx = p1.vx - p2.vx;
          let ky = p1.vy - p2.vy;
          let p = (nx * kx + ny * ky);

          if (p > 0) {
            // 計算出反彈後的新方向與速度
            p1.vx = p1.vx - p * nx;
            p1.vy = p1.vy - p * ny;
            p2.vx = p2.vx + p * nx;
            p2.vy = p2.vy + p * ny;

            // 【新增重點：強制速度校正 (Normalization)】
            // 取得兩顆泡泡原本應該要有的速度
            let targetSpeed1 = gasData[p1.type].speed;
            let targetSpeed2 = gasData[p2.type].speed;

            // 計算它們碰撞後當下的實際速度大小 (畢氏定理)
            let currentSpeed1 = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
            let currentSpeed2 = Math.sqrt(p2.vx * p2.vx + p2.vy * p2.vy);

            // 將它們的速度等比例縮放回原本設定的 targetSpeed
            if (currentSpeed1 > 0) {
              p1.vx = (p1.vx / currentSpeed1) * targetSpeed1;
              p1.vy = (p1.vy / currentSpeed1) * targetSpeed1;
            }
            if (currentSpeed2 > 0) {
              p2.vx = (p2.vx / currentSpeed2) * targetSpeed2;
              p2.vy = (p2.vy / currentSpeed2) * targetSpeed2;
            }
          }
        }
      }
    }
    // 步驟 3：將計算好的最終座標更新到 DOM 畫面上
    for (let i = 0; i < activeParticles.length; i++) {
      let p = activeParticles[i];
      if (p.popping) continue;
      p.element.style.left = `${p.x}px`;
      p.element.style.top = `${p.y}px`;
    }

    animationFrameId = requestAnimationFrame(update);
  }

  update();
}

// 6. 收集氣體邏輯
function collectGas(bubbleElement, pId) {
  // 在物理陣列中找到對應的泡泡
  const pIndex = activeParticles.findIndex(p => p.id === pId);
  if (pIndex === -1) return; // 如果已經收集過，避免重複

  const p = activeParticles[pIndex];
  const type = p.type;
  p.popping = true; // 標記為破裂中，物理引擎會停止移動它

  // 播放破裂動畫
  bubbleElement.classList.add('bubble-pop');

  // 增加計數
  const maxTarget = gasData[type].target;
  if (gasCollected[type] < maxTarget) {
    gasCollected[type]++;
    updatePieChartUI();
    checkLevel1Win();
  }

  // 動畫結束後從畫面上移除
  setTimeout(() => {
    bubbleElement.remove();
    // 並從物理活躍陣列中移除
    activeParticles = activeParticles.filter(p => p.id !== pId);
  }, 300);
}

// 更新圖表與文字 UI
function updatePieChartUI() {
  let totalProgress = 0;
  let accumulatedOffset = 0; // 用來計算圓餅圖的起點偏移量

  // 依照 N2 -> O2 -> Other 的順序畫圓餅圖
  ['n2', 'o2', 'other'].forEach(type => {
    const gas = gasData[type];
    const currentCount = gasCollected[type];
    const target = gas.target;

    // 更新文字計數
    document.getElementById(`count-${type}`).innerText = `${currentCount} / ${target}`;

    // 計算該氣體目前該顯示的百分比面積 (收集滿才會達到 realPercent)
    const percentToDraw = (currentCount / target) * gas.realPercent;
    totalProgress += percentToDraw;

    // 更新 SVG Stroke-dasharray
    // SVG circumference = 100 (因為 r=16, 2*pi*r 約為 100)
    const circle = document.getElementById(`pie-${type}`);
    circle.setAttribute('stroke-dasharray', `${percentToDraw} 100`);
    // 設定起點 (因為 SVG dasharray 是從右邊 3 點鐘方向開始，前面 HTML 我們旋轉了 -90 度變成 12 點鐘)
    circle.setAttribute('stroke-dashoffset', -accumulatedOffset);

    accumulatedOffset += percentToDraw;
  });

  document.getElementById('total-progress').innerText = `${Math.floor(totalProgress)}%`;
}

// 滑鼠懸停顯示資訊
function showGasInfo(type) {
  const infoBox = document.getElementById('gas-info-box');
  const gas = gasData[type];

  infoBox.classList.remove('opacity-50');
  infoBox.classList.add('opacity-100');

  // 重點：使用 flex-col 確保垂直堆疊，items-center 讓標題置中
  infoBox.innerHTML = `
        <div class="flex flex-col items-center w-full">
            <h4 class="text-xl font-black ${type === 'n2' ? 'text-blue-600' : (type === 'o2' ? 'text-red-600' : 'text-slate-600')} mb-2 text-center">
                ${gas.name} (${gas.realPercent}%)
            </h4>
            
            <p class="text-slate-700 font-medium text-sm md:text-base leading-relaxed text-left w-full px-2">
                ${gas.desc}
            </p>
        </div>
    `;
}

// 滑鼠移開恢復原狀
function hideGasInfo() {
  const infoBox = document.getElementById('gas-info-box');
  infoBox.classList.remove('opacity-100');
  infoBox.classList.add('opacity-50');
  infoBox.innerHTML = `<p class="text-slate-500 text-center text-sm mt-8">滑鼠移到圓餅圖的顏色區塊上，查看氣體小秘密！</p>`;
}

// 9. 檢查是否過關 (將 alert 換成彈出視窗)
function checkLevel1Win() {
  if (gasCollected.n2 === gasData.n2.target &&
    gasCollected.o2 === gasData.o2.target &&
    gasCollected.other === gasData.other.target) {

    isLevel1Active = false;
    clearInterval(particleInterval);
    cancelAnimationFrame(animationFrameId);

    // 延遲 0.5 秒讓最後一個泡泡破裂動畫跑完，再顯示置中彈出視窗
    setTimeout(() => {
      document.getElementById('win-modal').classList.remove('hidden');
    }, 500);
  }
}

// 將 closeModal 改名為 closeWinModal
function closeWinModal() {
  document.getElementById('win-modal').classList.add('hidden');
}

// 分頁切換功能
function switchTab(tabName) {
  // 取得按鈕與內容區塊
  const btnRadar = document.getElementById('tab-btn-radar');
  const btnLavoisier = document.getElementById('tab-btn-lavoisier');
  const contentRadar = document.getElementById('tab-content-radar');
  const contentLavoisier = document.getElementById('tab-content-lavoisier');

  // 重置兩個按鈕的樣式為未選取狀態
  const inactiveClass = ['bg-white', 'text-sky-600', 'border-2', 'border-sky-200', 'hover:bg-sky-50'];
  const activeClass = ['bg-sky-500', 'text-white', 'shadow-md'];

  btnRadar.classList.remove(...activeClass);
  btnRadar.classList.add(...inactiveClass);
  btnLavoisier.classList.remove(...activeClass);
  btnLavoisier.classList.add(...inactiveClass);

  // 隱藏所有內容
  contentRadar.classList.add('hidden');
  contentLavoisier.classList.add('hidden');

  // 顯示選中的分頁並套用選取樣式
  if (tabName === 'radar') {
    btnRadar.classList.remove(...inactiveClass);
    btnRadar.classList.add(...activeClass);
    contentRadar.classList.remove('hidden');
  } else if (tabName === 'lavoisier') {
    btnLavoisier.classList.remove(...inactiveClass);
    btnLavoisier.classList.add(...activeClass);
    contentLavoisier.classList.remove('hidden');
    lucide.createIcons(); // 重新渲染拉瓦節分頁內的圖示

    // 👇 把原本的 enableHotspotHelper(); 刪掉，改成這行：
    setupEquipmentHotspots();
  }
}
/* ========================================================================= */
/* 拉瓦節實驗：互動與動畫邏輯 (全互動版 + 階段切換)                            */
/* ========================================================================= */

// 1. 實驗狀態管理
let lavoisierState = {
  mercuryPlaced: false,
  mercuryClicks: 0, // 新增：紀錄水銀按鈕點擊次數
  firePlaced: false,
  charcoalPlaced: false,
  isSealed: false,
  stage1Finished: false
};

// 2. 放置實驗物品函數 (支援分次點擊)
function placeItem(itemType) {
  if (lavoisierState.isSealed) return;
  const simArea = document.getElementById('lavoisier-simulation-area');

  if (itemType === 'mercury' && !lavoisierState.mercuryPlaced) {
    lavoisierState.mercuryClicks++;
    const simArea = document.getElementById('lavoisier-simulation-area');

    if (lavoisierState.mercuryClicks === 1) {

      // 1. 右側水盆模具
      let basinMask = document.createElement('div');
      basinMask.id = 'sim-basin-mask';
      basinMask.className = 'absolute inset-0 z-10 overflow-hidden';

      // 🎯 【等比例縮放的完美平滑曲線】：結合了平滑度與正確的真實位置
      basinMask.style.clipPath = 'polygon(64.7% 40.0%, 65.1% 52.8%, 65.9% 55.8%, 67.5% 57.6%, 70.0% 58.5%, 73.3% 58.9%, 76.9% 59.0%, 80.6% 58.9%, 83.9% 58.5%, 86.3% 57.6%, 88.0% 55.8%, 88.8% 52.8%, 89.2% 40.0%)';
      simArea.appendChild(basinMask);

      // 2. 右側水銀
      let bellJarMercury = document.createElement('div');
      bellJarMercury.id = 'sim-hg-belljar';
      bellJarMercury.className = 'absolute w-full mercury-liquid transition-all duration-700 ease-in-out';

      // 🎯 【位置與高度配合】：模具最低點在 59.0%，所以 bottom 設在 40% 剛好墊底
      bellJarMercury.style.bottom = '40%';
      bellJarMercury.style.height = '3%'; // 第一次點擊：淹過底部一點點

      basinMask.appendChild(bellJarMercury);
      updateMercuryButton(1);
    }
    else if (lavoisierState.mercuryClicks === 2) {
      let bellJarMercury = document.getElementById('sim-hg-belljar');
      // 第二次點擊：水位上升
      bellJarMercury.style.height = '6%';
      updateMercuryButton(2);
    }
    else if (lavoisierState.mercuryClicks === 3) {
      let bellJarMercury = document.getElementById('sim-hg-belljar');
      // 第三次點擊：到達圖片中淹過支架的目標水位
      bellJarMercury.style.height = '9%';

      // --- 🧪 左側曲頸瓶處理開始 (修正處) ---
      let retortMask = document.createElement('div');
      retortMask.id = 'sim-retort-mask';
      // 改用 inset-0 確保 clip-path 座標與背景對齊
      retortMask.className = 'absolute inset-0 z-10 overflow-hidden pointer-events-none';

      // 這是相對於整張圖的座標
      retortMask.style.clipPath = 'polygon(20% 38.0%, 22.5% 41.8%, 24% 44.0%, 25% 45.6%, 27% 46.4%, 29% 45.6%, 30% 44.0%, 32% 41.8%, 35% 38.0%)';
      simArea.appendChild(retortMask);

      let retortMercury = document.createElement('div');
      retortMercury.id = 'sim-hg-retort';
      retortMercury.className = 'absolute mercury-liquid transition-all duration-1000 ease-in-out';

      retortMercury.style.left = '20%';
      retortMercury.style.width = '15%';
      // 💡 【修正點 4】：確保初始位置也是 53.6%
      retortMercury.style.bottom = '53.6%';
      retortMercury.style.height = '4%';

      retortMask.appendChild(retortMercury);
      // --- 🧪 左側曲頸瓶處理結束 ---

      lavoisierState.mercuryPlaced = true;
      markButtonAsPlaced('place-mercury-btn');
    }
  }
  // 👇 【關鍵修改】：把爐火跟木炭獨立出來，與 mercury 的 if 齊平
  else if (itemType === 'fire' && !lavoisierState.firePlaced) {
    lavoisierState.firePlaced = true;

    // 1. 建立火焰 Emoji 元素
    let fireEmoji = document.createElement('div');
    fireEmoji.id = 'sim-fire-emoji';
    fireEmoji.className = 'absolute text-4xl animate-pulse z-20 pointer-events-none';
    fireEmoji.innerText = '🔥';
    fireEmoji.style.bottom = '35%';
    fireEmoji.style.left = '27%';
    fireEmoji.style.transform = 'translate(-50%, 0)';

    simArea.appendChild(fireEmoji);
    markButtonAsPlaced('place-fire-btn');
  }

  else if (itemType === 'charcoal' && !lavoisierState.charcoalPlaced) {
    lavoisierState.charcoalPlaced = true;

    // 🌟 關鍵修正：必須先「創造」元素，才能對它設定樣式
    let charcoalDiv = document.createElement('div');
    charcoalDiv.id = 'sim-charcoal-rect';

    // 1. 保留基礎定位類別與動畫
    charcoalDiv.className = 'absolute rounded z-10 pointer-events-none animate-pulse';

    // 2. 使用漸層色：從黑色 (#1a1a1a) 轉到 深紅色 (#800000)
    charcoalDiv.style.background = 'linear-gradient(45deg, #1a1a1a 30%, #b22222 100%)';

    // 3. 增加紅色發光陰影，讓它看起來像在發熱
    charcoalDiv.style.boxShadow = '0 0 8px #ff4500, inset 0 0 5px #000';

    // 4. 設定位置與大小
    charcoalDiv.style.bottom = '35%';
    charcoalDiv.style.left = '27%';
    charcoalDiv.style.width = '7%';
    charcoalDiv.style.height = '3%';
    charcoalDiv.style.transform = 'translate(-50%, 0) rotate(-2deg)';

    simArea.appendChild(charcoalDiv);
    markButtonAsPlaced('place-charcoal-btn');
  }

  // 最後一定要呼叫這個函數，檢查是否三個按鈕都按過了
  checkAllItemsPlaced();
}

function markButtonAsPlaced(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.remove('bg-slate-100', 'bg-blue-50', 'text-slate-700', 'hover:bg-slate-200', 'border-blue-400');
    btn.classList.add('bg-green-100', 'text-green-700', 'border-green-400', 'opacity-80');
    // 取出原本的文字，如果是水銀按鈕，把 (3/3) 去掉
    let iconName = btnId === 'place-mercury-btn' ? 'droplets' : (btnId === 'place-fire-btn' ? 'flame' : 'box');
    let itemName = btnId === 'place-mercury-btn' ? '水銀 (汞密封)' : (btnId === 'place-fire-btn' ? '爐火 (放置在爐灶)' : '木炭 (維持火力)');

    btn.innerHTML = `
            <i data-lucide="${iconName}" class="w-8 h-8 ${btnId === 'place-fire-btn' ? 'text-red-500' : 'text-current'}"></i>
            ${itemName}
            <span class="text-sm mt-1">✅ 已放置</span>
        `;
    btn.disabled = true;
    lucide.createIcons();
  }
}

// 3. 檢查是否所有物品都已放置
function checkAllItemsPlaced() {
  if (lavoisierState.mercuryPlaced && lavoisierState.firePlaced && lavoisierState.charcoalPlaced) {
    document.getElementById('prepare-hint').classList.add('hidden');
    document.getElementById('start-seal-btn').classList.remove('hidden');
  }
}

// 4. 開始裝置密封 (進入加熱階段，切換面板)
function startSetupSeal() {
  lavoisierState.isSealed = true;

  // 隱藏準備面板，顯示加熱面板
  document.getElementById('panel-prepare').classList.add('hidden');
  document.getElementById('panel-heating').classList.remove('hidden');
  document.getElementById('panel-heating').classList.add('flex');

  const simArea = document.getElementById('lavoisier-simulation-area');

  // 建立右側鐘罩內水銀柱 (維持不變)
  let hgColumn = document.getElementById('sim-hg-column');
  if (!hgColumn) {
    hgColumn = document.createElement('div');
    hgColumn.id = 'sim-hg-column';
    hgColumn.className = 'absolute mercury-liquid transition-all duration-300 ease-linear z-10';
    hgColumn.style.left = '71.5%';
    hgColumn.style.width = '11.5%';
    hgColumn.style.bottom = '49%';
    hgColumn.style.height = '0%';
    simArea.appendChild(hgColumn);
  }

  // 🧪 左側曲頸瓶處理開始 (使用全圖座標)
  let retortMask = document.getElementById('sim-retort-mask');
  if (!retortMask) {
    retortMask = document.createElement('div');
    retortMask.id = 'sim-retort-mask';
    retortMask.className = 'absolute inset-0 z-0 overflow-hidden pointer-events-none';
    const path = 'polygon(20% 30%, 25% 45.6%, 27% 46.4%, 29% 45.6%, 35% 30%, 35% 38%, 30% 44%, 27% 46.4%, 24% 44%, 20% 38%)';
    retortMask.style.clipPath = path;
    retortMask.style.webkitClipPath = path;
    simArea.appendChild(retortMask);
  }

  // --- 🌟 建立紅色粉末容器 (修改：不需要 borderRadius，移除原本的 dots/solid div) ---
  let powderContainer = document.createElement('div');
  powderContainer.id = 'sim-red-powder';
  powderContainer.className = 'absolute z-20 transition-all duration-300 pointer-events-none opacity-0';

  // 容器位置
  powderContainer.style.left = '20%';
  powderContainer.style.width = '15%';
  // 底部起始點 = 瓶底 53.6% + 初始水銀 4% (這個值在 update 時會更新)
  powderContainer.style.bottom = '57.6%';
  // 🌟 給容器一個固定高度，用來容納生成的點點 (模擬的最大山丘高度)
  powderContainer.style.height = '12%';

  // 把空的容器放進 retortMask 裡 (仍然需要它來裁剪瓶子邊緣)
  retortMask.appendChild(powderContainer);

  // --- 🌟 在全域定義一個函數，用來生成隨機點點 (以便 update 時呼叫) ---
  window._generatePowderParticles = function (container) {
    const particleCount = 80; // 顆粒數量，越多越密集
    const hillBaseHeightPercent = 85; // 山丘基準高度百分比 (相對於容器高度)

    for (let i = 0; i < particleCount; i++) {
      let particle = document.createElement('div');
      // 🌟 核心：使用 bg-red-600 和 rounded-full
      particle.className = 'absolute bg-red-600 rounded-full opacity-80';

      let leftPercent = Math.random(); // 水平隨機位置 0 到 1
      particle.style.left = `${leftPercent * 100}%`;

      // 🌟 核心：山丘狀 bottom 邏輯 (中心高，邊緣低)
      // 計算距離中心的距離 (0 到 0.5)
      let distFromCenter = Math.abs(leftPercent - 0.5);
      // 使用拋物線函數 (中心 1，邊緣 0)
      let hillFactor = (1 - Math.pow(distFromCenter / 0.5, 2));

      // 在山丘曲線下隨機分佈
      let particleBottomPercent = Math.random() * hillFactor * hillBaseHeightPercent;
      particle.style.bottom = `${particleBottomPercent}%`;

      // 隨機大小
      let size = 1 + Math.random() * 2.5; // 1px 到 3.5px 之間的隨機大小
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      container.appendChild(particle);
    }
  }

  // --- 📝 UI 元素建立 (氧氣文字與霧氣) ---

  // 1. 準備氧氣比例顯示文字面板
  let o2Text = document.createElement('div');
  o2Text.id = 'sim-o2-text';
  o2Text.className = 'absolute text-center bg-white/90 px-4 py-2 rounded-xl shadow-md border-2 border-red-200 z-30 transition-all duration-300';
  o2Text.style.top = '5%';
  o2Text.style.left = '77%';
  o2Text.style.transform = 'translate(-50%, 0)';
  simArea.appendChild(o2Text);

  // 2. 藍色霧氣 (代表氮氣等不助燃氣體)
  let fogBlue = document.createElement('div');
  fogBlue.id = 'sim-fog-blue';
  fogBlue.className = 'absolute lav-air-fog z-10 transition-all duration-500 bg-blue-400';
  fogBlue.style.top = '25%';
  fogBlue.style.left = '71.5%';
  fogBlue.style.width = '12%';
  fogBlue.style.height = '24%';
  fogBlue.style.filter = 'blur(6px)';
  fogBlue.style.opacity = '0.75';
  simArea.appendChild(fogBlue);

  // 3. 白色霧氣 (代表氧氣)
  let fogWhite = document.createElement('div');
  fogWhite.id = 'sim-fog-white';
  fogWhite.className = 'absolute lav-air-fog z-10 transition-all duration-500 bg-white';
  fogWhite.style.top = '35%';
  fogWhite.style.left = '71.5%';
  fogWhite.style.width = '12%';
  fogWhite.style.height = '12%';
  fogWhite.style.filter = 'blur(6px)';
  fogWhite.style.opacity = '0.8';
  simArea.appendChild(fogWhite);

  // 初始化狀態
  updateLavoisierExperiment(0);
}

// 5. 核心滑桿聯動與彈出視窗觸發
function updateLavoisierExperiment(day) {
  day = parseInt(day);
  document.getElementById('lav-day-display').innerText = day;

  const titleEl = document.getElementById('lav-title');
  const descEl = document.getElementById('lav-desc');
  const powderContainer = document.getElementById('sim-red-powder');
  const powderDots = document.getElementById('powder-dots');
  const powderSolid = document.getElementById('powder-solid');
  const retortHg = document.getElementById('sim-hg-retort');
  const o2Text = document.getElementById('sim-o2-text');
  const hgColumn = document.getElementById('sim-hg-column');
  const fogBlue = document.getElementById('sim-fog-blue');
  const fogWhite = document.getElementById('sim-fog-white');

  // --- 文字更新邏輯 ---
  let titleText = "";
  let descText = "";
  let titleClass = "";

  if (day === 0) {
    titleText = "Day 0：裝置密封完成";
    descText = "曲頸瓶內裝有銀白色的水銀，與右側鐘罩內的空氣相連。準備開始連續 12 天的加熱實驗！";
    titleClass = "text-xl font-bold text-slate-700 mb-3";
  } else if (day === 1 || day === 2) {
    titleText = `Day ${day}：持續加熱中`;
    descText = "水銀受熱逐漸沸騰並產生蒸氣，但目前還沒有觀察到明顯的化學變化，鐘罩內的水銀面也沒有明顯改變。";
    titleClass = "text-xl font-bold text-orange-500 mb-3";
  } else if (day === 3 || day === 4) {
    titleText = `Day ${day}：紅色斑點現蹤！`;
    descText = "仔細觀察！曲頸瓶內的水銀表面開始出現微小的「紅色斑點」。同時，鐘罩內的氧氣逐漸被消耗，水銀面開始微微上升！";
    titleClass = "text-xl font-bold text-orange-600 mb-3";
  } else if (day === 5 || day === 6) {
    titleText = `Day ${day}：粉末逐漸增加`;
    descText = "紅色的斑點慢慢擴大，變成了明顯的紅色粉末（氧化汞）。鐘罩內的白色霧氣（氧氣）明顯變少，液面持續被往上推。";
    titleClass = "text-xl font-bold text-red-500 mb-3";
  } else if (day === 7 || day === 8) {
    titleText = `Day ${day}：劇烈的氧化反應`;
    descText = "紅色粉末大量生成，覆蓋了大部分的水銀表面！鐘罩內的氣體體積明顯縮小，代表氧氣正大量與水銀結合。";
    titleClass = "text-xl font-bold text-red-600 mb-3";
  } else if (day === 9 || day === 10) {
    titleText = `Day ${day}：反應逐漸趨緩`;
    descText = "生成紅色粉末的速度變慢了，鐘罩內液面上升的幅度也開始減小。這代表鐘罩內的氧氣快要被消耗殆盡了。";
    titleClass = "text-xl font-bold text-red-700 mb-3";
  } else if (day === 11) {
    titleText = `Day ${day}：幾乎停止變化`;
    descText = "液面幾乎不再上升，紅色粉末的量也沒有明顯增加。看來密閉空間內的氧氣已經完全用盡。";
    titleClass = "text-xl font-bold text-red-700 mb-3";
  } else if (day === 12) {
    titleText = "Day 12：實驗結束，得出結論！";
    descText = "液面完全停止上升！拉瓦節測量發現，消失的氣體剛好佔了整體空氣的 1/5。他將這被消耗的助燃氣體命名為「氧氣」。";
    titleClass = "text-xl font-bold text-red-800 mb-3";

    if (!lavoisierState.stage1Finished) {
      lavoisierState.stage1Finished = true;
      setTimeout(() => {
        document.getElementById('stage2-modal').classList.remove('hidden');
      }, 800);
    }
  }

  titleEl.innerText = titleText;
  descEl.innerText = descText;
  titleEl.className = titleClass;

  // --- 動畫狀態更新 ---
  if (powderContainer) {
    powderContainer.classList.add('opacity-0');
  }

  // 🌟 右側鐘罩內的水銀柱與霧氣變化
  if (hgColumn) {
    hgColumn.style.height = `${4 * (day / 12)}%`;
  }
  if (fogWhite) {
    fogWhite.style.opacity = 0.8 - (0.8 * (day / 12));
  }
  if (fogBlue) {
    let initialBlueHeight = 24;
    let finalBlueHeight = 20;
    fogBlue.style.height = `${initialBlueHeight - ((initialBlueHeight - finalBlueHeight) * (day / 12))}%`;
  }

  // 🧪 左側曲頸瓶內水銀下降
  let baseRetortHeight = 4;
  let maxDecrease = 2.5;
  let currentRetortHeight = baseRetortHeight - (maxDecrease * (day / 12));

  if (retortHg) {
    retortHg.style.height = `${currentRetortHeight}%`;
  }

  // 🔴 紅色粉末生長邏輯 (完全重寫)
  if (day >= 3 && powderContainer) {
    powderContainer.classList.remove('opacity-0');
    powderContainer.style.visibility = 'visible';

    // --- 🌟 🌟 🌟 核心修改：檢查點點是否已經生成，如果沒有，則生成 🌟 🌟 🌟 ---
    if (powderContainer.children.length === 0 && typeof window._generatePowderParticles === 'function') {
      window._generatePowderParticles(powderContainer);
    }

    let currentDaySince3 = day - 3;
    let totalDays = 9;
    let growthPerc = currentDaySince3 / totalDays;

    // --- 🌟 🌟 🌟 關鍵調整 1：容器高度保持固定 🌟 🌟 🌟 ---
    // 點點已經設定好位置了。我們只需要改變容器整體的 opacity 來模擬顆粒逐漸出現。
    // 第 3 天是 0.3 透明度，第 12 天是 1.0
    powderContainer.style.opacity = 0.3 + (growthPerc * 0.7);

    // --- 🌟 🌟 🌟 關鍵調整 2：容器的位置必須跟隨水銀液面 🌟 🌟 🌟 ---
    // 粉末容器的底部起始點 = 瓶底 53.6% + 當前水銀高度
    powderContainer.style.bottom = `${53.6 + currentRetortHeight}%`;

  } else if (day < 3 && powderContainer) {
    powderContainer.classList.add('opacity-0');
    // 🌟 🌟 🌟 可選但推薦：當拉回第 3 天以前時，清空點點。🌟 🌟 🌟
    // 這確保當用戶重複拖動滑桿時，粉末可以重新隨機生成，視覺效果更好。
    if (powderContainer.children.length > 0) {
      while (powderContainer.firstChild) {
        powderContainer.removeChild(powderContainer.firstChild);
      }
    }
  }
  // 🌟 獨立更新氧氣比例顯示文字 (確保在函數的大括號內)
  if (o2Text) {
    let o2Percent = 21 - (21 * (day / 12));
    let displayPercent = Math.max(0, o2Percent).toFixed(1);

    o2Text.innerHTML = `
      <div class="text-xs text-slate-500 font-bold mb-1">鐘罩內氧氣殘留</div>
      <div class="text-2xl font-black text-red-500">${displayPercent}%</div>
    `;
  }
}
// 6. 彈出視窗與進入第二階段控制
// 將 closeModal 改名為 closeStage2Modal
function closeStage2Modal() {
  document.getElementById('stage2-modal').classList.add('hidden');
}

// 7. 重設物品 (完整還原所有面板與狀態)
function resetPlacement() {  // <--- 這裡必須加上函數宣告與大括號

  // 🌟 補上 'sim-retort-mask' 以確保左側曲頸瓶遮罩也被正確清除
  ['sim-basin-mask', 'sim-retort-mask', 'sim-hg-belljar', 'sim-hg-retort', 'sim-fire-emoji', 'sim-charcoal-rect', 'sim-red-powder', 'sim-o2-text', 'sim-fog-blue', 'sim-fog-white', 'sim-hg-column'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // 如果 el 是紅色粉末容器，先移除它的子層，防止記憶體洩漏
      if (id === 'sim-red-powder') {
        const dots = document.getElementById('powder-dots');
        const solid = document.getElementById('powder-solid');
        if (dots) dots.remove();
        if (solid) solid.remove();
      }
      el.remove();
    }
  });

  // 狀態歸零
  lavoisierState = { mercuryPlaced: false, mercuryClicks: 0, firePlaced: false, charcoalPlaced: false, isSealed: false, stage1Finished: false };

  // 還原按鈕外觀
  resetButtonHtml('place-mercury-btn', '<i data-lucide="droplets" class="w-8 h-8 text-blue-500"></i>水銀 (汞密封)');
  resetButtonHtml('place-fire-btn', '<i data-lucide="flame" class="w-8 h-8 text-red-500"></i>爐火 (放置在爐灶)');
  resetButtonHtml('place-charcoal-btn', '<i data-lucide="box" class="w-8 h-8 text-slate-800"></i>木炭 (維持火力)');

  // 關閉所有彈窗
  closeStage2Modal();

  // 【還原面板顯示】：只顯示面板A
  document.getElementById('panel-prepare').classList.remove('hidden');
  document.getElementById('panel-heating').classList.add('hidden');
  document.getElementById('panel-heating').classList.remove('flex');
  document.getElementById('panel-stage2').classList.add('hidden');
  document.getElementById('panel-stage2').classList.remove('flex');

  // 還原第一階段的按鈕與提示
  document.getElementById('start-seal-btn').classList.add('hidden');
  document.getElementById('prepare-hint').classList.remove('hidden');
  document.getElementById('lav-slider').value = 0;
} // <--- 這裡原本就有下括號，保留即可

function resetButtonHtml(btnId, innerHTML) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.className = 'flex flex-col items-center justify-center gap-2 p-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold border border-slate-300 transition-colors';
    btn.innerHTML = innerHTML;
    btn.disabled = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}
// ================= 第二關：氣體實驗室邏輯 =================
let beaker = [];
let beakerNames = [];
let gasProduced = null;
let discoveredO2Recipes = new Set(); // 🌟 新增：用來記錄已經發現的氧氣配方

function addIngredient(id, name) {
  if (!beaker.includes(id) && beaker.length < 2) {
    beaker.push(id);
    beakerNames.push(name);

    // 更新按鈕狀態 (反灰)
    const btn = document.getElementById(`btn-${id}`);
    btn.classList.add('opacity-50', 'bg-gray-100', 'cursor-not-allowed');
    btn.classList.remove('hover:scale-105', 'active:scale-95');
    btn.disabled = true;

    checkReaction();
    updateBeakerUI();
  }
}

function checkReaction() {
  const hasH2O2 = beaker.includes('h2o2');
  const hasCatalyst = beaker.includes('mushroom') || beaker.includes('liver') || beaker.includes('carrot');
  const hasBleachCombo = beaker.includes('bleach') && beaker.includes('warmwater');

  const hasAcid = beaker.includes('vinegar') || beaker.includes('citric');
  const hasCarbonate = beaker.includes('bakingSoda') || beaker.includes('eggshell');

  if ((hasH2O2 && hasCatalyst) || hasBleachCombo) {
    gasProduced = 'O2';

    // 🌟 新增：記錄成功的配方並更新 UI 進度
    // 將材料 ID 排序後組合成字串當作鑰匙 (例如: "h2o2+mushroom")，避免加入順序不同被重複計算
    let recipeKey = [...beaker].sort().join('+');
    if (!discoveredO2Recipes.has(recipeKey)) {
      discoveredO2Recipes.add(recipeKey);
      // 更新右上角的數字
      document.getElementById('o2-progress').innerText = discoveredO2Recipes.size;
    }

  } else if (hasAcid && hasCarbonate) {
    gasProduced = 'CO2';
  } else {
    gasProduced = null;
  }

  document.getElementById('test-result-box').classList.add('hidden');
}

function updateBeakerUI() {
  // 更新廣口瓶文字
  const display = document.getElementById('beaker-display');

  if (beaker.length === 0) {
    display.innerHTML = '空廣口瓶';
  } else {
    // ✅ 將加號的顏色改為 text-slate-500 或 text-slate-600 (深色調)
    // 這樣整串文字（材料名 + 加號）在淺色背景下都會非常清晰
    display.innerHTML = beakerNames.join('<br><span class="text-slate-500 text-sm font-normal">+</span><br>');
  }

  // 更新產生氣體的 UI 顯示
  const gasAnim = document.getElementById('gas-animation');
  const gasResult = document.getElementById('gas-result');
  const gasIcons = document.querySelectorAll('.gas-icon');

  if (gasProduced) {
    gasAnim.classList.remove('hidden');
    const iconChar = gasProduced === 'O2' ? '🫧' : '🌫️';
    gasIcons.forEach(icon => icon.innerText = iconChar);

    if (gasProduced === 'O2') {
      gasResult.innerHTML = '<div class="text-2xl font-black text-blue-600 bg-white px-4 py-2 rounded-full shadow-md inline-block">✨ 成功製造出：氧氣 (O₂)</div>';
    } else {
      gasResult.innerHTML = '<div class="text-2xl font-black text-slate-700 bg-white px-4 py-2 rounded-full shadow-md inline-block">✨ 成功製造出：二氧化碳 (CO₂)</div>';
    }
  } else {
    gasAnim.classList.add('hidden');
    if (beaker.length === 2) {
      gasResult.innerHTML = '<div class="text-xl font-bold text-red-500 bg-white px-4 py-2 rounded-full shadow-md inline-block">❌ 沒有產生化學反應，配方錯誤喔！</div>';
    } else {
      gasResult.innerHTML = '';
    }
  }
}

function clearBeaker() {
  beaker = [];
  beakerNames = [];
  gasProduced = null;

  // 將所有 10 種材料的 ID 列出來
  const allIngredients = [
    'h2o2', 'bleach', 'warmwater', 'mushroom', 'liver',
    'carrot', 'vinegar', 'citric', 'bakingSoda', 'eggshell'
  ];

  // 恢復所有按鈕狀態
  allIngredients.forEach(id => {
    const btn = document.getElementById(`btn-${id}`);
    if (btn) {
      btn.classList.remove('opacity-50', 'bg-gray-100', 'cursor-not-allowed');
      btn.classList.add('hover:scale-105', 'active:scale-95');
      btn.disabled = false;

      // ✅ 新增這段：清空廣口瓶時，順便把瓶內的白霧抽風抽掉
      const jarFog = document.getElementById('jar-fog');
      if (jarFog) {
        jarFog.classList.remove('jar-cloudy-fog');
        jarFog.classList.add('hidden');
      }
    }
  });

  document.getElementById('test-result-box').classList.add('hidden');
  updateBeakerUI();
}

// 🌟 新增一個變數，用來防止動畫播放中被重複點擊
let isTesting = false;

function runTest(testType) {
  // 如果正在檢驗中，就不理會新的點擊，避免動畫錯亂
  if (isTesting) return;

  const resultBox = document.getElementById('test-result-box');
  const resultText = document.getElementById('test-result-text');

  // 每次點擊檢驗時，先隱藏上一次的結果
  resultBox.classList.add('hidden');

  if (testType === 'incense') {
    isTesting = true; // 鎖定狀態

    // 取得我們剛剛在 HTML 準備好的線香元素
    const incenseContainer = document.getElementById('incense-container');
    const incenseFlame = document.getElementById('incense-flame');

    // 1. 顯示線香，準備播放插入廣口瓶的動畫
    incenseContainer.classList.remove('hidden');
    incenseContainer.classList.add('flex', 'animate-dip');

    // 2. 觸發重繪 (Reflow) 小技巧：確保瀏覽器每次都能重新播放動畫
    void incenseContainer.offsetWidth;

    // 3. 根據收集到的氣體，決定火焰要變大還是熄滅，並準備好要顯示的文字
    let resultMessage = '';

    // 先把火焰重置到預設狀態
    incenseFlame.className = 'text-4xl mb-[-8px] z-10 transition-all';

    if (!gasProduced) {
      // 沒產生氣體，線香放進去也會熄滅
      incenseFlame.classList.add('animate-flame-die');
      resultMessage = '沒有收集到任何氣體喔！瓶子裡的空氣不足以讓線香繼續燃燒。';
    } else if (gasProduced === 'O2') {
      // 遇到氧氣：加上變大燃燒的動畫
      incenseFlame.classList.add('animate-flame-grow');
      resultMessage = '🔥 劇烈燃燒！點燃的線香放進去，火焰變得更大了！這證明了「氧氣」具有【助燃性】。';
    } else if (gasProduced === 'CO2') {
      // 遇到二氧化碳：加上熄滅的動畫
      incenseFlame.classList.add('animate-flame-die');
      resultMessage = '💨 噗哧！點燃的線香放進去立刻熄滅了。這證明了「二氧化碳」【不具助燃性】。';
    }

    // 4. 設定計時器：等待 3.5 秒 (動畫播完) 後，隱藏線香並顯示解說文字
    setTimeout(() => {
      // 隱藏並重置線香
      incenseContainer.classList.remove('flex', 'animate-dip');
      incenseContainer.classList.add('hidden');
      incenseFlame.className = 'text-4xl mb-[-8px] z-10 transition-all';

      // 顯示文字
      resultText.innerText = resultMessage;
      resultBox.classList.remove('hidden');
      resultBox.classList.add('animate-fade-in-up');

      isTesting = false; // 解除鎖定，允許進行下一次測試
    }, 3500);

  } else if (testType === 'limewater') {
    isTesting = true; // 鎖定狀態

    const limewaterContainer = document.getElementById('limewater-container');
    const limewaterLiquid = document.getElementById('limewater-liquid');
    const jarFog = document.getElementById('jar-fog'); // 🌟 取得廣口瓶的霧氣元素

    // 1. 顯示試管並播放全新升級的 4 秒倒入搖晃動畫
    limewaterContainer.classList.remove('hidden');
    limewaterContainer.classList.add('flex', 'animate-pour');
    void limewaterContainer.offsetWidth; // 觸發重繪

    // 每次重新檢驗時，確保液體和廣口瓶都是乾淨透明的
    limewaterLiquid.classList.remove('liquid-cloudy');
    jarFog.classList.remove('jar-cloudy-fog');
    jarFog.classList.remove('hidden'); // 讓霧氣元素準備好 (目前透明度是 0)

    let resultMessage = '';

    // 2. 抓準動畫時機：大約在 1.5 秒時，試管剛好倒出液體並開始搖晃！
    setTimeout(() => {
      if (gasProduced === 'CO2') {
        limewaterLiquid.classList.add('liquid-cloudy'); // 試管變白
        jarFog.classList.add('jar-cloudy-fog');         // 🌟 廣口瓶內同時泛起白霧
      }
    }, 1500);

    // 準備好最後要顯示的文字
    if (!gasProduced) {
      resultMessage = '沒有收集到任何氣體喔！石灰水沒有變化。';
    } else if (gasProduced === 'O2') {
      resultMessage = '💧 澄清石灰水沒有變化，還是透明的。這證明氧氣不會讓石灰水變混濁。';
    } else if (gasProduced === 'CO2') {
      resultMessage = '☁️ 變混濁了！氣體和澄清石灰水產生交互作用，產生了白色的「碳酸鈣」懸浮微粒，讓石灰水變混濁了！';
    }

    // 3. 等待 4 秒動畫結束後，隱藏試管並顯示文字結果
    setTimeout(() => {
      limewaterContainer.classList.remove('flex', 'animate-pour');
      limewaterContainer.classList.add('hidden');

      resultText.innerText = resultMessage;
      resultBox.classList.remove('hidden');
      resultBox.classList.add('animate-fade-in-up');

      isTesting = false; // 解除鎖定
    }, 4000); // 🌟 配合 CSS 改成 4000 毫秒
  }
}
// 隨機打亂左側材料按鈕順序的函數
function shuffleIngredients() {
  const grid = document.getElementById('ingredients-grid');
  if (!grid) return;

  // 取得所有按鈕
  const buttons = Array.from(grid.children);

  // 使用隨機排序法打亂陣列
  for (let i = buttons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // appendChild 會把現有的元素移到最後面，藉此達成洗牌的視覺效果
    grid.appendChild(buttons[j]);
  }
}

// =========================================================================
// 拉瓦節實驗：器材介紹互動 (小幫手模式)
// =========================================================================

// 1. 器材說明資料庫 (目前先大約抓個位置，你可以稍後微調)
const equipmentData = {
  retort: {
    name: '曲頸瓶',
    desc: '盛裝水銀及受熱的玻璃容器，彎曲的長頸讓氣體能與右側連通。',
    left: '21.6%', top: '29.5%', width: '12.7%', height: '13.6%'
  },
  bellJar: {
    name: '鐘罩',
    desc: '蓋在水盆上形成密閉空間，用來收集氣體並觀察體積變化。',
    left: '70.0%', top: '21.3%', width: '13.4%', height: '28.4%'
  },
  furnace: {
    name: '加熱爐灶',
    desc: '在實驗中連續12天提供穩定的高溫，讓曲頸瓶內發生氧化反應。',
    left: '15.8%', top: '49.4%', width: '23.9%', height: '32.3%'
  },
  basin: {
    name: '水銀槽',
    desc: '底部裝有水銀以封閉鐘罩，讓內部空氣與外界完全隔絕。',
    left: '83.6%', top: '43.3%', width: '5.1%', height: '4.3%'
  },
  sandBath: {
    name: '沙盤',
    desc: '放在爐火與曲頸瓶之間，用來均勻傳遞熱量，避免玻璃瓶因直接接觸高溫而破裂。',
    left: '19.3%', top: '43.7%', width: '17.0%', height: '4.5%'
  },
  stand: {
    name: '支架',
    desc: '用來穩固支撐水銀槽與鐘罩，確保實驗過程不會因晃動而傾倒。',
    left: '70.5%', top: '50.6%', width: '12.7%', height: '7.0%'
  },
  mercurySealLeft: {
    name: '水銀密封',
    desc: '利用密度極高的液態水銀淹過鐘罩邊緣，完美隔絕外界空氣，確保內部是真正的密閉空間。',
    left: '64.8%', top: '50.0%', width: '5.1%', height: '6.7%'
  },
  mercurySealRight: {
    name: '水銀密封',
    desc: '利用密度極高的液態水銀淹過鐘罩邊緣，完美隔絕外界空氣，確保內部是真正的密閉空間。',
    left: '84.1%', top: '48.2%', width: '5.2%', height: '9.4%'
  },
};

// 2. 建立器材互動感應區 (正式上線版 - 無延遲、智慧防撞邊緣)
function setupEquipmentHotspots() {
  const simArea = document.getElementById('lavoisier-simulation-area');
  if (!simArea) return;

  const devContainer = document.getElementById('dev-container');
  if (devContainer) devContainer.remove();

  let tooltip = document.getElementById('eq-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'eq-tooltip';
    // 🚨 移除了 transition 和 opacity 等動畫屬性，改為純粹的顯示/隱藏
    tooltip.className = 'absolute hidden z-50 bg-slate-800/95 text-white p-4 rounded-xl shadow-2xl text-sm w-64 pointer-events-none border border-slate-600';
    simArea.appendChild(tooltip);
  }

  for (const key in equipmentData) {
    const eq = equipmentData[key];
    let hotspot = document.getElementById(`hotspot-${key}`);

    if (!hotspot) {
      hotspot = document.createElement('div');
      hotspot.id = `hotspot-${key}`;
      simArea.appendChild(hotspot);
    }

    hotspot.className = 'absolute z-40 cursor-help';
    hotspot.style.left = eq.left;
    hotspot.style.top = eq.top;
    hotspot.style.width = eq.width;
    hotspot.style.height = eq.height;

    hotspot.style.resize = 'none';
    hotspot.style.overflow = 'visible';
    hotspot.innerHTML = '';

    let cleanHotspot = hotspot.cloneNode(true);
    hotspot.parentNode.replaceChild(cleanHotspot, hotspot);
    hotspot = cleanHotspot;

    // 🖱️ 滑鼠移入：直接顯示
    hotspot.addEventListener('mouseenter', (e) => {
      tooltip.innerHTML = `
        <div class="font-black text-sky-300 mb-2 text-base flex items-center">
            <i data-lucide="info" class="w-5 h-5 mr-2"></i>${eq.name}
        </div>
        <div class="leading-relaxed text-slate-200">${eq.desc}</div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();

      // 🚨 移除延遲，瞬間顯示
      tooltip.classList.remove('hidden');
    });

    // 🖱️ 滑鼠移動：加入「智慧防撞邊緣」邏輯
    hotspot.addEventListener('mousemove', (e) => {
      const areaRect = simArea.getBoundingClientRect();
      let mouseX = e.clientX - areaRect.left;
      let mouseY = e.clientY - areaRect.top;

      const tooltipWidth = 256; // Tailwind w-64 大約是 256px
      const tooltipHeight = tooltip.offsetHeight; // 取得內容撐開後的實際高度

      // 預設位置：滑鼠右下方
      let tooltipX = mouseX + 15;
      let tooltipY = mouseY + 15;

      // 🛡️ 邊界偵測：如果右邊的空間不夠放提示框，就強制把它移到滑鼠的「左邊」
      if (tooltipX + tooltipWidth > areaRect.width) {
        tooltipX = mouseX - tooltipWidth - 15;
      }

      // 🛡️ 邊界偵測：如果下方空間不夠，就把它往上移
      if (tooltipY + tooltipHeight > areaRect.height) {
        tooltipY = mouseY - tooltipHeight - 15;
      }

      tooltip.style.left = `${tooltipX}px`;
      tooltip.style.top = `${tooltipY}px`;
    });

    // 🖱️ 滑鼠移出：瞬間隱藏
    hotspot.addEventListener('mouseleave', () => {
      // 🚨 移除延遲，瞬間消失
      tooltip.classList.add('hidden');
    });
  }
}
// ================= 第三關：滅火大師邏輯 =================

// 切換「燃燒三要素」與「情境演練」分頁
function switchFireTab(tabName) {
  const btnElements = document.getElementById('tab-btn-elements');
  const btnGame = document.getElementById('tab-btn-game');
  const contentElements = document.getElementById('tab-content-elements');
  const contentGame = document.getElementById('tab-content-game');

  const inactiveClass = ['bg-white', 'text-orange-600', 'border-2', 'border-orange-200', 'hover:bg-orange-50'];
  const activeClass = ['bg-orange-500', 'text-white', 'shadow-md'];

  // 重置樣式
  btnElements.classList.remove(...activeClass, ...inactiveClass);
  btnGame.classList.remove(...activeClass, ...inactiveClass);
  contentElements.classList.add('hidden');
  contentGame.classList.add('hidden');

  if (tabName === 'elements') {
    btnElements.classList.add(...activeClass);
    btnGame.classList.add(...inactiveClass);
    contentElements.classList.remove('hidden');
  } else {
    btnGame.classList.add(...activeClass);
    btnElements.classList.add(...inactiveClass);
    contentGame.classList.remove('hidden');
    startFireGame(); // 每次點擊進入遊戲分頁，就開啟新的一局
  }
}

// 遊戲狀態變數
let currentFireRound = 0;
const totalFireRounds = 5;
let selectedScenarios = [];
let currentScenarioKey = '';
let fireScore = 0; // 紀錄答對題數

// 10 種生活火災情境資料庫
const fireScenariosData = {
  // 隔絕氧氣類 (Smother)
  oil: { title: '廚房油鍋起火了！', icon: '🍳🔥', correct: 'smother', correctDesc: '蓋上鍋蓋', wrongMsg: '危險！油比水輕，灑水會讓沸騰的油花四濺，火勢會跟著擴大！' },
  alcohol: { title: '實驗室酒精燈打翻！', icon: '⚗️🔥', correct: 'smother', correctDesc: '用濕抹布覆蓋', wrongMsg: '酒精會隨水流動，灑水可能會讓火海蔓延！' },
  clothes: { title: '身上衣服不慎起火！', icon: '👕🔥', correct: 'smother', correctDesc: '停、躺、滾 (或用厚衣物包覆)', wrongMsg: '亂跑會增加氧氣供給，讓火燒得更旺！' },
  chemical: { title: '化學溶劑起火！', icon: '🧪🔥', correct: 'smother', correctDesc: '使用滅火毯或沙子覆蓋', wrongMsg: '化學物質遇水可能產生劇烈反應或毒氣！' },

  // 移除可燃物類 (Starve)
  gas: { title: '瓦斯爐管線漏氣起火！', icon: '🔥⛽', correct: 'starve', correctDesc: '關閉瓦斯開關', wrongMsg: '沒有切斷氣源，火勢就會不斷竄出！' },
  forest: { title: '森林大火持續蔓延！', icon: '🌲🔥', correct: 'starve', correctDesc: '開闢防火巷 (砍除周圍樹木)', wrongMsg: '火勢太大，單純灑水或覆蓋無法阻止火勢向旁邊的樹木延燒！' },
  electrical: { title: '延長線插座走火！', icon: '🔌🔥', correct: 'starve', correctDesc: '拔除插頭 / 關閉電源', wrongMsg: '危險！水會導電，在未斷電的情況下灑水會導致嚴重觸電！' },

  // 灑水降溫類 (Water)
  campfire: { title: '露營結束，營火未熄滅！', icon: '🪵🔥', correct: 'water', correctDesc: '大量灑水', wrongMsg: '單純用土掩蓋可能內部還在悶燒，需要大量降溫才能徹底撲滅。' },
  trash: { title: '垃圾桶裡的紙張起火！', icon: '🗑️🔥', correct: 'water', correctDesc: '直接灑水', wrongMsg: '對於普通的紙張木材，最快速有效的方法就是大量降溫。' },
  curtain: { title: '客廳窗簾被波及起火！', icon: '🕯️🔥', correct: 'water', correctDesc: '使用滅火器或大量灑水', wrongMsg: '窗簾面積大且垂直，單純想移除或覆蓋太困難，需要快速降溫滅火。' }
};

const toolsInfo = {
  water: { name: '灑水降溫', principle: '降低溫度達不到燃點' },
  starve: { name: '移除可燃物', principle: '移除可燃物' },
  smother: { name: '隔絕氧氣', principle: '隔絕助燃物 (氧氣)' }
};

// 洗牌函數
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 初始化新遊戲
function startFireGame() {
  currentFireRound = 0;
  fireScore = 0;
  // 從 10 個題庫中洗牌並抽出前 5 個
  const allKeys = Object.keys(fireScenariosData);
  selectedScenarios = shuffleArray(allKeys).slice(0, totalFireRounds);

  loadFireScenario();
}

// 載入當前關卡
function loadFireScenario() {
  currentScenarioKey = selectedScenarios[currentFireRound];
  const scenarioInfo = fireScenariosData[currentScenarioKey];

  // 更新 UI 進度文字
  document.getElementById('game-round-text').innerText = currentFireRound + 1;
  updateProgressDots();

  // 重置火災畫面
  const display = document.getElementById('fire-display');
  display.className = "p-12 rounded-3xl text-center mb-8 transition-colors duration-500 bg-red-100 border-4 border-red-500";
  document.getElementById('fire-icon').innerText = scenarioInfo.icon;
  document.getElementById('fire-icon').classList.add('animate-pulse');
  document.getElementById('fire-title').innerText = scenarioInfo.title;

  // 顯示工具，隱藏回饋
  document.getElementById('tools-section').classList.remove('hidden');
  document.getElementById('feedback-box').classList.add('hidden');
  document.getElementById('next-round-section').classList.add('hidden');
}

// 更新進度點點 UI
function updateProgressDots() {
  const dotsContainer = document.getElementById('game-progress-dots');
  dotsContainer.innerHTML = '';

  for (let i = 0; i < totalFireRounds; i++) {
    const dot = document.createElement('div');
    if (i < currentFireRound) {
      dot.className = 'w-4 h-4 rounded-full bg-green-500'; // 已完成
    } else if (i === currentFireRound) {
      dot.className = 'w-4 h-4 rounded-full bg-orange-500 animate-bounce'; // 進行中
    } else {
      dot.className = 'w-4 h-4 rounded-full bg-slate-300'; // 未開始
    }
    dotsContainer.appendChild(dot);
  }
}

// 處理滅火邏輯
function handleExtinguish(toolId) {
  const scenarioInfo = fireScenariosData[currentScenarioKey];
  const display = document.getElementById('fire-display');
  const feedbackBox = document.getElementById('feedback-box');
  const feedbackText = document.getElementById('feedback-text');
  const feedbackDetail = document.getElementById('feedback-detail');
  const feedbackIcon = document.getElementById('feedback-icon');

  // 隱藏工具，準備顯示結果
  document.getElementById('tools-section').classList.add('hidden');
  document.getElementById('fire-icon').classList.remove('animate-pulse');

  if (toolId === scenarioInfo.correct) {
    // 答對了
    fireScore++;
    display.className = "p-12 rounded-3xl text-center mb-8 transition-colors duration-500 bg-green-100 border-4 border-green-500";
    document.getElementById('fire-icon').innerText = '💨✨';
    document.getElementById('fire-title').innerText = '火勢已完全撲滅！';

    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-green-50 border-green-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-green-800";
    feedbackText.innerText = `🎉 滅火成功！動作：${scenarioInfo.correctDesc}`;
    feedbackDetail.className = "text-green-700 font-medium text-lg mt-1";
    feedbackDetail.innerText = `原理：你利用了「${toolsInfo[toolId].principle}」成功破壞了燃燒三要素！`;
    feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" class="text-green-600 w-10 h-10"></i>`;
  } else {
    // 答錯了
    display.className = "p-12 rounded-3xl text-center mb-8 transition-colors duration-500 bg-red-900 border-4 border-orange-500 text-white";
    document.getElementById('fire-icon').innerText = '💥💀💥';
    document.getElementById('fire-title').innerText = '火勢失控大爆發！';

    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-red-50 border-red-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-red-800";
    feedbackText.innerText = `🚨 滅火失敗！`;
    feedbackDetail.className = "text-red-700 font-medium text-lg mt-1";
    feedbackDetail.innerHTML = `${scenarioInfo.wrongMsg}<br><br>👉 正確做法應該是：<span class="font-bold border-b-2 border-red-500">${scenarioInfo.correctDesc} (${toolsInfo[scenarioInfo.correct].name})</span>`;
    feedbackIcon.innerHTML = `<i data-lucide="x-circle" class="text-red-500 w-10 h-10"></i>`;
  }

  lucide.createIcons();
  document.getElementById('feedback-box').classList.remove('hidden');

  // 顯示下一題或結算按鈕
  const nextBtn = document.getElementById('next-btn');
  if (currentFireRound < totalFireRounds - 1) {
    nextBtn.innerText = '前往下一個情境 ➡️';
    nextBtn.className = 'px-8 py-3 bg-orange-500 text-white font-black text-lg rounded-full hover:bg-orange-600 hover:scale-105 transition-all shadow-md';
  } else {
    nextBtn.innerText = '🏆 查看最終成績';
    nextBtn.className = 'px-8 py-3 bg-sky-500 text-white font-black text-lg rounded-full hover:bg-sky-600 hover:scale-105 transition-all shadow-md animate-pulse';
  }
  document.getElementById('next-round-section').classList.remove('hidden');
}

// 進入下一回合或結算
function nextFireRound() {
  currentFireRound++;
  if (currentFireRound < totalFireRounds) {
    loadFireScenario();
  } else {
    showFireResult();
  }
}

// 顯示最終結算畫面
function showFireResult() {
  const display = document.getElementById('fire-display');
  const feedbackBox = document.getElementById('feedback-box');
  const nextBtnSection = document.getElementById('next-round-section');

  document.getElementById('game-progress-dots').innerHTML = '';
  document.getElementById('game-round-text').innerText = '完成';
  feedbackBox.classList.add('hidden');
  nextBtnSection.classList.add('hidden');

  display.className = "p-12 rounded-3xl text-center mb-8 transition-colors duration-500 bg-amber-50 border-4 border-amber-400";

  let resultHTML = '';
  if (fireScore === 5) {
    document.getElementById('fire-icon').innerText = '🎖️🚒';
    resultHTML = `<h3 class="text-4xl font-black text-amber-600 mb-4">完美的首席消防員！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">答對題數：<span class="text-red-500 text-4xl mx-2">${fireScore}</span> / 5</p>
                      <p class="text-lg text-slate-600">你完全掌握了燃燒三要素的訣竅，太厲害了！</p>`;
  } else if (fireScore >= 3) {
    document.getElementById('fire-icon').innerText = '👍🧯';
    resultHTML = `<h3 class="text-3xl font-black text-amber-600 mb-4">表現不錯的滅火小幫手！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">答對題數：<span class="text-red-500 text-4xl mx-2">${fireScore}</span> / 5</p>
                      <p class="text-lg text-slate-600">差一點點就完美了，再挑戰一次看看能不能拿滿分吧！</p>`;
  } else {
    document.getElementById('fire-icon').innerText = '📝🔥';
    resultHTML = `<h3 class="text-3xl font-black text-slate-700 mb-4">再多複習一下喔！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">答對題數：<span class="text-red-500 text-4xl mx-2">${fireScore}</span> / 5</p>
                      <p class="text-lg text-slate-600">可以去旁邊的「燃燒三要素」分頁再看一次重點再回來挑戰！</p>`;
  }

  resultHTML += `<button onclick="startFireGame()" class="mt-8 px-8 py-3 bg-slate-700 text-white font-bold text-lg rounded-full hover:bg-slate-800 transition-all shadow-md">🔄 重新挑戰隨機 5 題</button>`;

  document.getElementById('fire-title').innerHTML = resultHTML;
}
// ================= 第四關：火場逃生邏輯 =================

// 切換「逃生守則」、「是非考驗」與「實戰演練」分頁
function switchEscapeTab(tabName) {
  const btnInfo = document.getElementById('tab-btn-escape-info');
  const btnOx = document.getElementById('tab-btn-escape-ox');
  const btnGame = document.getElementById('tab-btn-escape-game');
  const contentInfo = document.getElementById('tab-content-escape-info');
  const contentOx = document.getElementById('tab-content-escape-ox');
  const contentGame = document.getElementById('tab-content-escape-game');

  // 防呆：如果按鈕還是鎖定狀態，點擊無效
  if (tabName === 'ox' && btnOx.classList.contains('tab-locked')) return;
  if (tabName === 'game' && btnGame.classList.contains('tab-locked')) return;

  const inactiveClass = ['bg-white', 'text-slate-600', 'border-2', 'border-slate-300', 'hover:bg-slate-100'];
  const activeClass = ['bg-slate-600', 'text-white', 'shadow-md'];

  // 重置所有未鎖定按鈕的樣式
  [btnInfo, btnOx, btnGame].forEach(btn => {
    if (!btn.classList.contains('tab-locked')) {
      btn.classList.remove(...activeClass, ...inactiveClass);
      btn.classList.add(...inactiveClass);
    }
  });
  contentInfo.classList.add('hidden');
  contentOx.classList.add('hidden');
  contentGame.classList.add('hidden');

  // 顯示對應內容
  if (tabName === 'info') {
    btnInfo.classList.add(...activeClass);
    btnInfo.classList.remove(...inactiveClass);
    contentInfo.classList.remove('hidden');
  } else if (tabName === 'ox') {
    btnOx.classList.add(...activeClass);
    btnOx.classList.remove(...inactiveClass);
    contentOx.classList.remove('hidden');
    startOxGame(); // 每次進入開啟新的一局
  } else if (tabName === 'game') {
    btnGame.classList.add(...activeClass);
    btnGame.classList.remove(...inactiveClass);
    contentGame.classList.remove('hidden');
    startEscapeGame(); // 每次進入開啟新的一局
  }
}

// 遊戲狀態變數
let currentEscapeRound = 0;
const totalEscapeRounds = 5;
let selectedEscapeScenarios = [];
let escapeScore = 0; // 紀錄答對題數

// 10 種火場逃生情境題庫 (包含 1 個正確選項與 2 個錯誤選項)
const escapeScenariosData = [
  {
    title: '睡夢中聽到火災警報，打開房門發現走廊充滿黑色濃煙！',
    icon: '🚪🌫️',
    options: [
      { text: '立刻退回房間關門，塞住門縫', isCorrect: true, feedback: '正確！濃煙是火場頭號殺手，關門可以阻擋濃煙與高溫，爭取救援時間。', principle: '濃煙關門避難' },
      { text: '憋氣閉眼，用力往前衝出去', isCorrect: false, feedback: '錯誤！濃煙中含有劇毒(如一氧化碳)，吸入幾口就會昏迷致命。' },
      { text: '衝去浴室拿濕毛巾摀住口鼻', isCorrect: false, feedback: '錯誤！濕毛巾擋不住有毒氣體，且會浪費逃生或避難的黃金時間。' }
    ]
  },
  {
    title: '在百貨公司逛街時發生火災，但你所在的位置還沒看到濃煙。',
    icon: '🏬🔥',
    options: [
      { text: '尋找「綠色小人」指示燈，走樓梯往下逃', isCorrect: true, feedback: '正確！無煙狀況下應把握時間「往下、往外」逃生，並跟隨避難器具指示。', principle: '往下往外逃生' },
      { text: '搭乘電梯逃生比較快', isCorrect: false, feedback: '危險！火災時隨時會斷電，搭電梯非常容易被困在半空中。' },
      { text: '往樓頂跑，等待直升機救援', isCorrect: false, feedback: '錯誤！煙霧每秒上升 3~5 公尺，往上跑絕對跑不贏煙霧！' }
    ]
  },
  {
    title: '炒菜時油鍋突然起火，火勢越來越大，你無法撲滅！',
    icon: '🍳🔥',
    options: [
      { text: '大喊「失火了」，迅速離開廚房並關上廚房門', isCorrect: true, feedback: '正確！無法滅火時，首要任務是逃生並警告他人，關門可以把火勢侷限在廚房。', principle: '小火快逃，大火關門' },
      { text: '趕快用水盆裝水潑上去', isCorrect: false, feedback: '危險！油鍋起火絕對不能用水潑，會造成油花四濺，引起大爆炸！' },
      { text: '躲在流理台下方或冰箱旁邊', isCorrect: false, feedback: '錯誤！躲起來會讓消防員找不到你，火災時千萬不能躲藏。' }
    ]
  },
  {
    title: '你在逃生過程中，發現不小心讓衣服沾到火苗燒起來了！',
    icon: '👕🔥',
    options: [
      { text: '立刻停下，雙手摀住臉部，在地上來回打滾', isCorrect: true, feedback: '正確！「停、躺、滾」可以利用地板壓熄火焰，雙手摀臉可保護呼吸道。', principle: '停、躺、滾' },
      { text: '驚慌失措地到處亂跑找水', isCorrect: false, feedback: '錯誤！奔跑會增加氧氣供應，反而會讓身上的火燒得更旺！' },
      { text: '用手用力拍打身上的火焰', isCorrect: false, feedback: '錯誤！用手拍打不僅難以滅火，還會讓雙手嚴重燒燙傷。' }
    ]
  },
  {
    title: '你打開房門準備逃生，發現門把非常燙！',
    icon: '🚪🔥',
    options: [
      { text: '絕對不要開門！退回房內塞住門縫，撥打 119 求救', isCorrect: true, feedback: '正確！門把很燙代表門外已經是高溫火海，開門會引發「爆燃」！', principle: '關門避難' },
      { text: '用衣服墊著手，快速打開門衝出去', isCorrect: false, feedback: '危險！一開門，幾百度的熱氣和濃煙會瞬間衝入房間致命。' },
      { text: '躲到衣櫥裡面等待救援', isCorrect: false, feedback: '錯誤！絕對不能躲在衣櫥、床下，這會讓消防人員很難發現你。' }
    ]
  },
  {
    title: '逃生路線上，有一段走廊上方飄著一層淡淡的白煙。',
    icon: '🚶🌫️',
    options: [
      { text: '採「低姿勢」爬行，沿著牆壁邊緣逃生', isCorrect: true, feedback: '正確！熱煙會往上飄，靠近地面 15~30 公分處通常還有新鮮空氣。', principle: '低姿勢逃生' },
      { text: '站起來快速跑過去', isCorrect: false, feedback: '錯誤！站立的高度剛好會吸入最濃的煙霧。' },
      { text: '雙手雙腳著地的「狗爬式」', isCorrect: false, feedback: '錯誤！狗爬式頭部抬太高，應該要手肘雙膝著地，盡量貼近地面。' }
    ]
  },
  {
    title: '房間門外都是濃煙，你退回房間關好門，接下來該去哪裡？',
    icon: '🪟🆘',
    options: [
      { text: '走到靠近馬路的窗邊或陽台，大聲呼救等待救援', isCorrect: true, feedback: '正確！在窗邊呼吸新鮮空氣，並讓消防員容易發現你的位置。', principle: '尋求救援' },
      { text: '躲進浴室裡把門關上', isCorrect: false, feedback: '錯誤！浴室塑膠門一燒就熔化，且沒有對外窗，非常危險。' },
      { text: '找繩子或床單綁在一起，從窗戶爬下去', isCorrect: false, feedback: '錯誤！未受過專業訓練使用緩降機或繩索，極易墜樓傷亡。' }
    ]
  },
  {
    title: '你成功從火場逃出來了！但你發現你的寵物/手機還在裡面。',
    icon: '🏃💨',
    options: [
      { text: '留在安全的集合地點，並把情報告訴消防員', isCorrect: true, feedback: '正確！生命最重要，絕對不能重返火場，應交給專業消防員處理。', principle: '絕不重返火場' },
      { text: '深吸一口氣，衝進去把東西拿出來', isCorrect: false, feedback: '錯誤！火場情況瞬息萬變，重返火場是造成嚴重傷亡的主因之一。' },
      { text: '站在大門口往裡面看', isCorrect: false, feedback: '錯誤！應遠離火場建築物，避免被掉落物砸傷或阻礙消防車動線。' }
    ]
  },
  {
    title: '你正在走樓梯往下逃生，卻發現下方樓層有濃煙往上竄！',
    icon: '🌫️',
    options: [
      { text: '立刻轉身往上走，尋找安全無煙的樓層或屋頂避難', isCorrect: true, feedback: '正確！絕對不能穿越濃煙！如果往下受阻，應往上尋找安全的避難空間。', principle: '不穿越濃煙' },
      { text: '不管了，閉著眼睛往下衝', isCorrect: false, feedback: '錯誤！濃煙溫度極高且有毒，往下衝絕對會致命。' },
      { text: '躲在樓梯間的轉角處', isCorrect: false, feedback: '錯誤！樓梯間如果有煙，會產生「煙囪效應」，濃煙會迅速充滿整個樓梯間。' }
    ]
  },
  {
    title: '客廳垃圾桶剛起火，火勢還很小，你拿起滅火器準備滅火。',
    icon: '🧯🔥',
    options: [
      { text: '拔插銷，握皮管瞄準「火源底部」，壓把手掃射', isCorrect: true, feedback: '正確！記住口訣「拉、瞄、壓、掃」，一定要瞄準火源底部才有效！', principle: '拉瞄壓掃' },
      { text: '拔插銷，瞄準火焰的「最上方」噴射', isCorrect: false, feedback: '錯誤！噴灑在火焰上方無法冷卻燃燒物，火是不會熄滅的。' },
      { text: '把滅火器直接丟進垃圾桶裡', isCorrect: false, feedback: '危險！滅火器受高溫加熱可能會發生爆炸！' }
    ]
  }
];

// 初始化新遊戲
function startEscapeGame() {
  currentEscapeRound = 0;
  escapeScore = 0;

  // 複製題庫避免更動原始資料
  let scenariosCopy = JSON.parse(JSON.stringify(escapeScenariosData));

  // 洗牌並抽出 5 題
  shuffleArray(scenariosCopy);
  selectedEscapeScenarios = scenariosCopy.slice(0, totalEscapeRounds);

  // 把每一題的 3 個選項也洗牌，避免正確答案都在同一個位置
  selectedEscapeScenarios.forEach(scenario => {
    shuffleArray(scenario.options);
  });

  loadEscapeScenario();
}

// 載入當前關卡
function loadEscapeScenario() {
  const scenarioInfo = selectedEscapeScenarios[currentEscapeRound];

  // 更新 UI 進度文字
  document.getElementById('escape-round-text').innerText = currentEscapeRound + 1;
  updateEscapeProgressDots();

  // 重置畫面
  const display = document.getElementById('escape-display');
  display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-slate-100 border-4 border-slate-300";
  document.getElementById('escape-icon').innerText = scenarioInfo.icon;
  document.getElementById('escape-icon').classList.add('animate-bounce');
  document.getElementById('escape-title').innerText = scenarioInfo.title;

  // 更新三個選項按鈕文字
  for (let i = 0; i < 3; i++) {
    document.getElementById(`escape-opt-${i}`).innerText = scenarioInfo.options[i].text;
  }

  // 顯示工具，隱藏回饋
  document.getElementById('escape-tools-section').classList.remove('hidden');
  document.getElementById('escape-feedback-box').classList.add('hidden');
  document.getElementById('escape-next-section').classList.add('hidden');
}

// 更新進度點點 UI
function updateEscapeProgressDots() {
  const dotsContainer = document.getElementById('escape-progress-dots');
  dotsContainer.innerHTML = '';

  for (let i = 0; i < totalEscapeRounds; i++) {
    const dot = document.createElement('div');
    if (i < currentEscapeRound) {
      dot.className = 'w-4 h-4 rounded-full bg-emerald-500'; // 已完成
    } else if (i === currentEscapeRound) {
      dot.className = 'w-4 h-4 rounded-full bg-sky-500 animate-pulse'; // 進行中
    } else {
      dot.className = 'w-4 h-4 rounded-full bg-slate-300'; // 未開始
    }
    dotsContainer.appendChild(dot);
  }
}

// 處理選擇邏輯
function handleEscapeAction(optionIndex) {
  const scenarioInfo = selectedEscapeScenarios[currentEscapeRound];
  const selectedOption = scenarioInfo.options[optionIndex];

  const display = document.getElementById('escape-display');
  const feedbackBox = document.getElementById('escape-feedback-box');
  const feedbackText = document.getElementById('escape-feedback-text');
  const feedbackDetail = document.getElementById('escape-feedback-detail');
  const feedbackIcon = document.getElementById('escape-feedback-icon');

  // 隱藏選項，準備顯示結果
  document.getElementById('escape-tools-section').classList.add('hidden');
  document.getElementById('escape-icon').classList.remove('animate-bounce');

  if (selectedOption.isCorrect) {
    // 答對了
    escapeScore++;
    display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-emerald-100 border-4 border-emerald-500";
    document.getElementById('escape-icon').innerText = '✅🏃';
    document.getElementById('escape-title').innerText = '逃生行動正確！';

    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-emerald-50 border-emerald-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-emerald-800";
    feedbackText.innerText = `🎉 觀念正確！[ ${selectedOption.principle} ]`;
    feedbackDetail.className = "text-emerald-700 font-medium text-lg mt-1";
    feedbackDetail.innerText = selectedOption.feedback;
    feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" class="text-emerald-600 w-10 h-10"></i>`;
  } else {
    // 答錯了
    display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-red-900 border-4 border-red-500 text-white";
    document.getElementById('escape-icon').innerText = '💀⚠️';
    document.getElementById('escape-title').innerText = '陷入致命危機！';

    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-red-50 border-red-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-red-800";
    feedbackText.innerText = `🚨 行動錯誤！`;
    feedbackDetail.className = "text-red-700 font-medium text-lg mt-1";

    // 找出正確答案來提示
    const correctOption = scenarioInfo.options.find(opt => opt.isCorrect);
    feedbackDetail.innerHTML = `${selectedOption.feedback}<br><br>👉 正確做法應該是：<span class="font-bold border-b-2 border-red-500 text-red-600">${correctOption.text}</span>`;
    feedbackIcon.innerHTML = `<i data-lucide="x-circle" class="text-red-500 w-10 h-10"></i>`;
  }

  lucide.createIcons();
  document.getElementById('escape-feedback-box').classList.remove('hidden');

  // 顯示下一題或結算按鈕
  const nextBtn = document.getElementById('escape-next-btn');
  if (currentEscapeRound < totalEscapeRounds - 1) {
    nextBtn.innerText = '前往下一個情境 ➡️';
    nextBtn.className = 'px-10 py-4 bg-slate-700 text-white font-black text-xl rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-md';
  } else {
    nextBtn.innerText = '🏆 查看生存評估報告';
    nextBtn.className = 'px-10 py-4 bg-sky-500 text-white font-black text-xl rounded-full hover:bg-sky-600 hover:scale-105 transition-all shadow-md animate-pulse';
  }
  document.getElementById('escape-next-section').classList.remove('hidden');
}

// 進入下一回合或結算
function nextEscapeRound() {
  currentEscapeRound++;
  if (currentEscapeRound < totalEscapeRounds) {
    loadEscapeScenario();
  } else {
    showEscapeResult();
  }
}

// 顯示最終結算畫面
function showEscapeResult() {
  const display = document.getElementById('escape-display');
  const feedbackBox = document.getElementById('escape-feedback-box');
  const nextBtnSection = document.getElementById('escape-next-section');

  document.getElementById('escape-progress-dots').innerHTML = '';
  document.getElementById('escape-round-text').innerText = '完成';
  feedbackBox.classList.add('hidden');
  nextBtnSection.classList.add('hidden');

  display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-sky-50 border-4 border-sky-400";

  let resultHTML = '';
  if (escapeScore === 5) {
    document.getElementById('escape-icon').innerText = '🦸‍♂️✨';
    resultHTML = `<h3 class="text-4xl font-black text-sky-700 mb-4">絕佳的防災專家！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">成功存活率：<span class="text-emerald-500 text-4xl mx-2">100%</span> (${escapeScore}/5)</p>
                      <p class="text-lg text-slate-600">你擁有了完全正確的求生觀念，非常棒！</p>`;
  } else if (escapeScore >= 3) {
    document.getElementById('escape-icon').innerText = '🤕👍';
    resultHTML = `<h3 class="text-3xl font-black text-sky-700 mb-4">驚險逃脫！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">成功存活率：<span class="text-amber-500 text-4xl mx-2">${escapeScore * 20}%</span> (${escapeScore}/5)</p>
                      <p class="text-lg text-slate-600">雖然成功逃生，但有些觀念還需要加強，火場中一個錯誤決定就很致命喔！</p>`;
  } else {
    document.getElementById('escape-icon').innerText = '👻💦';
    resultHTML = `<h3 class="text-3xl font-black text-slate-700 mb-4">生存觀念需要更新！</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-6">成功存活率：<span class="text-red-500 text-4xl mx-2">${escapeScore * 20}%</span> (${escapeScore}/5)</p>
                      <p class="text-lg text-slate-600">請務必到旁邊的「逃生與滅火守則」重新閱讀觀念，再回來挑戰一次！</p>`;
  }

  resultHTML += `<button onclick="startEscapeGame()" class="mt-8 px-8 py-3 bg-slate-700 text-white font-bold text-lg rounded-full hover:bg-slate-800 transition-all shadow-md">🔄 重新挑戰隨機 5 題</button>`;

  document.getElementById('escape-title').innerHTML = resultHTML;
}
// ================= 第四關：滅火器拖曳排序邏輯 =================

function setupExtinguisherSortable() {
  const container = document.getElementById('extinguisher-sortable-container');
  if (!container) return;

  // 取得所有卡片並利用現有的 shuffleArray 進行洗牌
  const cardsArray = Array.from(container.querySelectorAll('.sortable-item'));
  shuffleArray(cardsArray);
  cardsArray.forEach(card => container.appendChild(card)); // 將洗牌後的順序重新塞回畫面中

  // 重新抓取洗牌後的卡片節點，綁定事件
  const sortables = container.querySelectorAll('.sortable-item');
  let draggedItem = null;
  let clickedItem = null; // 🌟 新增：用於記錄目前被點擊選取的卡片

  // 輔助函數：清除點選狀態
  function clearSelection() {
    if (clickedItem) {
      clickedItem.classList.remove('ring-4', 'ring-sky-400', 'scale-105', 'shadow-xl', 'z-10');
      clickedItem = null;
    }
  }

  // 輔助函數：DOM 元素互換
  function swapElements(el1, el2) {
    const temp = document.createElement('div');
    el1.parentNode.insertBefore(temp, el1);
    el2.parentNode.insertBefore(el1, el2);
    temp.parentNode.insertBefore(el2, temp);
    temp.parentNode.removeChild(temp);
  }

  sortables.forEach(sortable => {
    // === 原有：拖曳邏輯 (保留給電腦版) ===
    sortable.addEventListener('dragstart', function () {
      if (this.classList.contains('sort-success-card')) return; // 過關後禁止
      draggedItem = this;
      clearSelection(); // 開始拖曳時，清除任何點擊選取狀態
      setTimeout(() => this.classList.add('dragging'), 0);
    });

    sortable.addEventListener('dragend', function () {
      this.classList.remove('dragging');
      draggedItem = null;
      checkExtinguisherOrder(); // 檢查順序
    });

    sortable.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    sortable.addEventListener('dragenter', function (e) {
      e.preventDefault();
      if (draggedItem !== this && draggedItem !== null) {
        let allItems = [...container.querySelectorAll('.sortable-item')];
        let draggedIndex = allItems.indexOf(draggedItem);
        let targetIndex = allItems.indexOf(this);

        if (draggedIndex < targetIndex) {
          this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
          this.parentNode.insertBefore(draggedItem, this);
        }
      }
    });

    // === 🌟 新增：點擊互換邏輯 (支援平板與手機) ===
    sortable.addEventListener('click', function () {
      if (this.classList.contains('sort-success-card')) return; // 過關後禁止點擊

      if (!clickedItem) {
        // 情況 1：還沒選取任何卡片 -> 選取自己，並加上亮醒目的藍色外框與放大效果
        clickedItem = this;
        this.classList.add('ring-4', 'ring-sky-400', 'scale-105', 'shadow-xl', 'z-10');
      } else if (clickedItem === this) {
        // 情況 2：再次點擊自己 -> 取消選取
        clearSelection();
      } else {
        // 情況 3：已經選了一張，現在點擊第二張 -> 互換位置！
        swapElements(clickedItem, this);
        clearSelection(); // 互換後清除選取狀態
        checkExtinguisherOrder(); // 檢查順序是否正確
      }
    });
  });
}

// 檢查排序是否正確 (拉 -> 瞄 -> 壓 -> 掃)
function checkExtinguisherOrder() {
  const container = document.getElementById('extinguisher-sortable-container');
  const currentItems = [...container.querySelectorAll('.sortable-item')];

  // 取得目前畫面上卡片的順序陣列
  const currentOrder = currentItems.map(item => item.getAttribute('data-step'));
  const correctOrder = ['pull', 'aim', 'squeeze', 'sweep'];

  // 判斷陣列是否與正確答案完全吻合
  const isCorrect = currentOrder.every((val, index) => val === correctOrder[index]);

  if (isCorrect) {
    // --- 🎉 排序成功！執行解鎖動畫 ---

    // 1. 鎖定卡片，變成過關的綠色
    currentItems.forEach(item => {
      item.setAttribute('draggable', 'false');
      item.classList.remove('cursor-grab', 'active:cursor-grabbing', 'hover:border-red-400');
      item.classList.add('sort-success-card');

      // 隱藏右上角的拖曳把手圖示
      const handle = item.querySelector('.absolute');
      if (handle) handle.remove();
    });

    // 2. 更新上方提示訊息
    const statusBox = document.getElementById('sort-status-box');
    statusBox.className = 'flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-300 shadow-inner animate-fade-in-up';
    statusBox.innerHTML = `
            <span class="text-4xl">🔓</span>
            <div>
                <p class="font-bold text-emerald-800 text-lg mb-1">任務完成：口訣順序正確！</p>
                <p class="text-sm text-emerald-600 font-bold">右上方「是非考驗」已解鎖，快去挑戰吧！</p>
            </div>
        `;

    // 3. 解鎖「是非大考驗」分頁按鈕 (更改解鎖目標)
    const oxBtn = document.getElementById('tab-btn-escape-ox');
    // 移除鎖定狀態的 CSS
    oxBtn.classList.remove('tab-locked', 'text-slate-400', 'border-slate-200', 'cursor-not-allowed');
    // 加上解鎖後的 CSS
    oxBtn.classList.add('text-slate-600', 'border-slate-300', 'hover:bg-slate-100',);
    oxBtn.innerHTML = '<i data-lucide="unlock" class="w-5 h-5 inline-block mr-1"></i> 是非考驗';

    // 同時更新提示文字
    document.getElementById('sort-msg').innerText = '右上方「是非考驗」已解鎖，快去挑戰吧！';

    lucide.createIcons();
    setTimeout(() => { oxBtn.classList.remove('animate-pulse'); }, 4000);
  }
}

// 網頁載入時啟動拖曳功能
setupExtinguisherSortable();
// ================= 第四關：是非大考驗 (O/X 邏輯) =================
let currentOxRound = 0;
const totalOxRounds = 5;
let selectedOxQuestions = [];
let oxScore = 0;

// 15 題火場觀念題庫 (由老師提供的資料生成)
const oxQuestionsData = [
  { text: '火災發生時，為了怕重要財物被燒毀，應該趕快把存摺和手機找齊再逃跑？', isTrue: false, feedback: '不可為收拾財物延誤逃生！火場變化極快，生命永遠比財物重要。' },
  { text: '發生火災時，為了節省時間，搭乘電梯逃生是最快的選擇？', isTrue: false, feedback: '不可搭乘電梯逃生！火災極易造成斷電，搭乘電梯會把你困在半空中。' },
  { text: '火場中如果遇到濃煙，躲進有水的浴室裡面最安全？', isTrue: false, feedback: '不可躲在浴室裡！浴室多為塑膠門遇熱會熔化，且排水孔有水封無法提供新鮮空氣。' },
  { text: '逃生時可以使用塑膠袋套住頭部，以免吸入濃煙？', isTrue: false, feedback: '不可用塑膠袋套頭！塑膠袋遇熱會熔化並黏在皮膚上，造成嚴重灼傷與窒息。' },
  { text: '發生火災時，一定要先找到濕毛巾摀住口鼻才能開始逃生？', isTrue: false, feedback: '不可浪費時間找溼毛巾！濕毛巾無法阻擋劇毒濃煙，尋找毛巾反而會延誤逃生黃金時間。' },
  { text: '火場求生的三個最重要步驟是：「阻隔火煙、開窗呼救、等待救援」？', isTrue: true, feedback: '沒錯！當無法往外逃生時，這三個步驟是保命的關鍵。' },
  { text: '發現火災時，就算火還很小，第一個動作也應該是大喊「失火了」警告大家？', isTrue: true, feedback: '正確！大喊警示可以讓周圍的人及早應變與逃生。' },
  { text: '逃生時如果走廊沒有濃煙，應該把握時間採取「往下、往外」的原則逃生？', isTrue: true, feedback: '完全正確！因為煙霧會迅速往上竄，往下往外逃生才是最安全的路線。' },
  { text: '逃離起火的房間時，應該「隨手關門」，這樣可以阻擋火勢與濃煙擴散？', isTrue: true, feedback: '非常好！隨手關門可以把火煙侷限在原本的房間，為其他人爭取逃生時間。' },
  { text: '打開門準備逃生時，如果發現門外充滿濃煙，應該立刻退回房間並關上門？', isTrue: true, feedback: '正確！這就是「濃煙關門」的保命鐵則，千萬不能硬闖濃煙。' },
  { text: '退回房間避難時，可以用衣物或毛巾把門縫塞緊，防止濃煙竄入房間？', isTrue: true, feedback: '完全正確！塞緊門縫可以有效阻擋致命濃煙進入你避難的房間。' },
  { text: '在房間內關門避難後，應該走到靠近馬路的窗邊呼救，並撥打 119 告知受困位置？', isTrue: true, feedback: '正確！在窗邊不僅有新鮮空氣，也方便消防人員發現並救援你。' },
  { text: '如果摸到房間門把覺得非常燙，代表門外溫度極高，這時候絕對不能開門？', isTrue: true, feedback: '沒錯！門把燙代表門外已是火海，貿然開門會讓致命高溫與濃煙瞬間灌入。' },
  { text: '好不容易逃出火場，如果發現寵物還在裡面，應該立刻深吸一口氣衝回去救牠？', isTrue: false, feedback: '絕對不可重返火場！火場情況瞬息萬變，應將情報交給專業消防員處理。' },
  { text: '煙霧每秒可以上升 3 到 5 公尺，速度比人跑得快，所以遇到火災絕對不能往樓上跑？', isTrue: true, feedback: '正確！人絕對跑不贏煙霧，往上跑只會讓自己陷入濃煙的包圍中。' }
];

function startOxGame() {
  currentOxRound = 0;
  oxScore = 0;
  // 從 15 題中洗牌並抽出 5 題
  let copyData = JSON.parse(JSON.stringify(oxQuestionsData));
  shuffleArray(copyData);
  selectedOxQuestions = copyData.slice(0, totalOxRounds);
  loadOxQuestion();
}

function loadOxQuestion() {
  const qInfo = selectedOxQuestions[currentOxRound];
  document.getElementById('ox-round-text').innerText = currentOxRound + 1;
  updateOxProgressDots();

  const display = document.getElementById('ox-display');
  display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-sky-50 border-4 border-sky-200";
  document.getElementById('ox-title').innerText = qInfo.text;

  document.getElementById('ox-tools-section').classList.remove('hidden');
  document.getElementById('ox-feedback-box').classList.add('hidden');
  document.getElementById('ox-next-section').classList.add('hidden');
}

function updateOxProgressDots() {
  const dotsContainer = document.getElementById('ox-progress-dots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalOxRounds; i++) {
    const dot = document.createElement('div');
    if (i < currentOxRound) dot.className = 'w-4 h-4 rounded-full bg-sky-500';
    else if (i === currentOxRound) dot.className = 'w-4 h-4 rounded-full bg-orange-400 animate-pulse';
    else dot.className = 'w-4 h-4 rounded-full bg-slate-200';
    dotsContainer.appendChild(dot);
  }
}

function handleOxAction(userChoice) {
  const qInfo = selectedOxQuestions[currentOxRound];
  const display = document.getElementById('ox-display');
  const feedbackBox = document.getElementById('ox-feedback-box');
  const feedbackText = document.getElementById('ox-feedback-text');
  const feedbackDetail = document.getElementById('ox-feedback-detail');
  const feedbackIcon = document.getElementById('ox-feedback-icon');

  document.getElementById('ox-tools-section').classList.add('hidden');

  if (userChoice === qInfo.isTrue) {
    oxScore++;
    display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-emerald-50 border-4 border-emerald-400";
    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-emerald-50 border-emerald-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-emerald-800";
    feedbackText.innerText = `⭕ 答對了！`;
    feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" class="text-emerald-600 w-10 h-10"></i>`;
  } else {
    display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-red-50 border-4 border-red-400";
    feedbackBox.className = "mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 bg-red-50 border-red-300 animate-fade-in-up";
    feedbackText.className = "text-xl font-bold text-red-800";
    feedbackText.innerText = `❌ 答錯了！`;
    feedbackIcon.innerHTML = `<i data-lucide="x-circle" class="text-red-500 w-10 h-10"></i>`;
  }

  feedbackDetail.className = "text-slate-700 font-medium text-lg mt-1";
  feedbackDetail.innerText = qInfo.feedback;

  lucide.createIcons();
  feedbackBox.classList.remove('hidden');
  document.getElementById('ox-next-section').classList.remove('hidden');
}

function nextOxRound() {
  currentOxRound++;
  if (currentOxRound < totalOxRounds) {
    loadOxQuestion();
  } else {
    showOxResult();
  }
}

function showOxResult() {
  const display = document.getElementById('ox-display');
  const feedbackBox = document.getElementById('ox-feedback-box');
  const nextBtnSection = document.getElementById('ox-next-section');

  document.getElementById('ox-progress-dots').innerHTML = '';
  document.getElementById('ox-round-text').innerText = '完成';
  feedbackBox.classList.add('hidden');
  nextBtnSection.classList.add('hidden');

  display.className = "p-10 rounded-3xl text-center mb-8 transition-colors duration-500 bg-sky-50 border-4 border-sky-400";

  let resultHTML = '';
  if (oxScore === 5) {
    resultHTML = `<div class="text-6xl mb-4">🎓</div>
                      <h3 class="text-3xl font-black text-sky-700 mb-4">觀念滿分！獲得實戰資格！</h3>
                      <p class="text-lg text-slate-700 mb-6">你答對了所有題目，建立起了完美的火場防線。</p>`;

    // ✨ 解鎖第三個按鈕「實戰演練」
    const gameBtn = document.getElementById('tab-btn-escape-game');
    if (gameBtn.classList.contains('tab-locked')) {
      gameBtn.classList.remove('tab-locked', 'text-slate-400', 'border-slate-200', 'cursor-not-allowed');
      gameBtn.classList.add('text-slate-600', 'border-slate-300', 'hover:bg-slate-100',);
      gameBtn.innerHTML = '<i data-lucide="swords" class="w-5 h-5 inline-block mr-1"></i> 實戰演練';
      lucide.createIcons();
      setTimeout(() => { gameBtn.classList.remove('animate-pulse'); }, 4000);

      resultHTML += `<p class="text-emerald-600 font-bold text-xl animate-pulse mt-4">👉 上方「實戰演練」已解鎖，點擊前往挑戰吧！</p>`;
    } else {
      resultHTML += `<button onclick="startOxGame()" class="mt-4 px-8 py-3 bg-slate-700 text-white font-bold text-lg rounded-full hover:bg-slate-800 transition-all shadow-md">🔄 再玩一次隨機 5 題</button>`;
    }
  } else {
    resultHTML = `<div class="text-6xl mb-4">📝</div>
                      <h3 class="text-3xl font-black text-slate-700 mb-4">還差一點點！再挑戰一次</h3>
                      <p class="text-2xl font-bold text-slate-700 mb-4">答對題數：<span class="text-red-500 text-4xl mx-2">${oxScore}</span> / 5</p>
                      <p class="text-lg text-slate-600 mb-6">必須要 <strong class="text-red-500">5 題全對</strong> 才能確保你的安全並解鎖「實戰演練」喔！</p>
                      <button onclick="startOxGame()" class="px-8 py-3 bg-sky-600 text-white font-bold text-lg rounded-full hover:bg-sky-700 transition-all shadow-md">🔄 重新挑戰</button>`;
  }
  document.getElementById('ox-title').innerHTML = resultHTML;
}
// ================= 第五關：防鏽兵工廠邏輯 =================

// 切換「防鏽指南」、「誰會生鏽？」與「時光機實戰」分頁
function switchRustTab(tabName) {
    const btnInfo = document.getElementById('tab-btn-rust-info');
    const btnMetals = document.getElementById('tab-btn-rust-metals'); // 新增：金屬大解密按鈕
    const btnGame = document.getElementById('tab-btn-rust-game');
    
    const contentInfo = document.getElementById('tab-content-rust-info');
    const contentMetals = document.getElementById('tab-content-rust-metals'); // 新增：金屬大解密內容
    const contentGame = document.getElementById('tab-content-rust-game');

    const inactiveClass = ['bg-white', 'text-slate-500', 'border-2', 'border-slate-300', 'hover:bg-slate-200'];
    const activeClass = ['bg-slate-600', 'text-white', 'shadow-md'];

    // 1. 先把所有按鈕都設為「未選取」狀態，並隱藏所有內容
    [btnInfo, btnMetals, btnGame].forEach(btn => {
        if (btn) {
            btn.classList.remove(...activeClass, ...inactiveClass);
            btn.classList.add(...inactiveClass);
        }
    });
    
    if (contentInfo) contentInfo.classList.add('hidden');
    if (contentMetals) contentMetals.classList.add('hidden');
    if (contentGame) contentGame.classList.add('hidden');

    // 2. 根據點擊的目標，顯示對應內容並套用「已選取」樣式
    if (tabName === 'info') {
        btnInfo.classList.add(...activeClass);
        btnInfo.classList.remove(...inactiveClass);
        if (contentInfo) contentInfo.classList.remove('hidden');
    } else if (tabName === 'metals') {
        btnMetals.classList.add(...activeClass);
        btnMetals.classList.remove(...inactiveClass);
        if (contentMetals) contentMetals.classList.remove('hidden');
    } else if (tabName === 'game') {
        btnGame.classList.add(...activeClass);
        btnGame.classList.remove(...inactiveClass);
        if (contentGame) contentGame.classList.remove('hidden');
        startRustGame(); // 每次進入實戰區就重置開啟新局
    }
    
    // 重新渲染圖示 (確保新分頁裡的 Lucide icon 都有正常顯示)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 遊戲狀態變數
let currentRustRound = 0;
const totalRustRounds = 5; // 🌟 設定每次抽出 5 題
let selectedRustScenarios = [];
let rustScore = 0;

// 🌟 擴充至 15 題的防鏽情境題庫
const rustScenariosData = {
    bike: { 
        title: '淋過雨的腳踏車鍊條', icon: '🚲', correct: 'oil', correctDesc: '塗油', 
        successMsg: '塗油不僅能隔絕水氣防鏽，還能保持齒輪順暢！腳踏車騎得像飛一樣！', 
        wrongMsg: { paint: '油漆乾掉裂開，鍊條卡死，腳踏車根本踩不動，又生鏽了！', dry: '鍊條平常在外風吹雨淋，光靠擦乾不夠，而且缺乏潤滑很難騎！', plate: '鍊條需要靈活彎曲，電鍍層容易在摩擦中剝落失效！' } 
    },
    gate: { 
        title: '戶外斑駁的鐵窗', icon: '🪟', correct: 'paint', correctDesc: '上漆', 
        successMsg: '重新漆上漂亮的防水漆，完美隔絕空氣和雨水，鐵窗煥然一新！', 
        wrongMsg: { oil: '太陽一曬油都流光了，而且黏滿了灰塵跟蚊子，最後還是生鏽了！', dry: '鐵窗在戶外每天日曬雨淋，不可能隨時保持乾燥啊！', plate: '鐵窗體積太大且已固定，很難拆下來放進電鍍池裡面處理！' } 
    },
    camera: { 
        title: '昂貴的單眼相機', icon: '📸', correct: 'dry', correctDesc: '保持乾燥', 
        successMsg: '放進防潮箱保持乾燥，切斷生鏽條件，內部精密零件安全過關！', 
        wrongMsg: { paint: '相機整台毀了！鏡頭和按鈕被油漆黏死，完全不能拍照！', oil: '油污滲透進去弄髒了鏡頭和精密電路板，相機直接報銷！', plate: '相機內部零件太精密，不能隨便拿去通電電鍍！' } 
    },
    screw: { 
        title: '潮濕浴室的鐵螺絲', icon: '🔩', correct: 'plate', correctDesc: '電鍍', 
        successMsg: '鍍上一層保護金屬（如鋅），就算在潮濕的浴室也不怕生鏽了！', 
        wrongMsg: { paint: '鎖螺絲的時候，表面的油漆很容易就被起子刮掉，結果還是生鏽！', oil: '油會被浴室的熱水和肥皂洗掉，沒多久又生鏽了！', dry: '浴室每天都在洗澡，濕氣超重，不可能保持乾燥！' } 
    },
    slide: { 
        title: '公園的鐵製溜滑梯', icon: '🛝', correct: 'paint', correctDesc: '上漆', 
        successMsg: '漆上鮮豔的防水漆，不但防鏽，小朋友玩起來也很開心安全！', 
        wrongMsg: { oil: '溜滑梯塗滿油，小朋友溜下來全身衣服都毀了！', dry: '溜滑梯在戶外會遇到下雨和露水，無法一直保持乾燥！', plate: '溜滑梯體積太龐大了，很難進行全身電鍍！' } 
    },
    door: { 
        title: '發出怪聲的生鏽門軸', icon: '🚪', correct: 'oil', correctDesc: '塗油', 
        successMsg: '點上潤滑油後，成功隔絕濕氣，而且開門再也沒有可怕的怪聲了！', 
        wrongMsg: { paint: '油漆乾掉後會把門軸黏死，門反而打不開了！', dry: '即使保持乾燥，原本卡住的地方還是沒有潤滑，依然會發出怪聲！', plate: '門軸已經固定在牆上，拆卸去電鍍太費時費力了！' } 
    },
    scissors: { 
        title: '剛洗好的美術剪刀', icon: '✂️', correct: 'dry', correctDesc: '保持乾燥', 
        successMsg: '立刻用乾布擦乾水分，切斷生鏽條件，剪刀依舊鋒利好用！', 
        wrongMsg: { paint: '塗上油漆後，剪刀的刀刃被覆蓋，完全剪不開紙了！', oil: '塗滿油的剪刀去剪勞作，會把整張圖畫紙弄得油膩膩的！', plate: '普通的文具剪刀拿去重新電鍍成本太高，不符合經濟效益！' } 
    },
    roof: { 
        title: '新建的鐵皮屋頂', icon: '🏠', correct: 'plate', correctDesc: '電鍍', 
        successMsg: '出廠前先經過「鍍鋅」處理，即使日曬雨淋也能擁有強大的防鏽力！', 
        wrongMsg: { oil: '下幾次大雨，屋頂上的油就被沖進排水溝裡，不但沒效還污染環境！', paint: '雖然可以上漆，但大面積金屬出廠前先做「鍍鋅(電鍍)」防護效果更持久！', dry: '屋頂天天在外面風吹雨打，絕對不可能保持乾燥！' } 
    },
    cookie: { 
        title: '存放餅乾的鐵盒內部', icon: '🍪', correct: 'dry', correctDesc: '保持乾燥', 
        successMsg: '放入食品級乾燥劑，不但鐵盒不會生鏽，餅乾也能保持酥脆！', 
        wrongMsg: { oil: '鐵盒裡面塗滿油... 餅乾吸滿了機油，誰敢吃啊！', paint: '一般的防鏽漆有化學毒性，不適合直接塗在會接觸食物的盒子內部！', plate: '鐵盒已經成型，而且只是防潮，不需要動用到電鍍這麼複雜的工法。' } 
    },
    bridge: { 
        title: '跨海大橋的巨大鋼柱', icon: '🌉', correct: 'paint', correctDesc: '上漆', 
        successMsg: '塗上好幾層特製的防鏽漆（防蝕塗料），抵擋住了海風與鹽水的侵襲！', 
        wrongMsg: { oil: '海水一下就把油沖走了，而且會造成嚴重的海洋生態污染！', dry: '橋柱就泡在海水裡，每天吹海風，根本不可能乾燥！', plate: '跨海大橋的鋼柱比大樓還高，世界上沒有這麼大的電鍍池可以裝得下！' } 
    },
    needle: { 
        title: '裁縫用的細小鐵針', icon: '🪡', correct: 'dry', correctDesc: '保持乾燥', 
        successMsg: '收進乾燥的針線盒裡，不接觸水分，鐵針常保尖銳亮麗！', 
        wrongMsg: { paint: '塗上油漆後，針頭變鈍，而且根本穿不過布料了！', oil: '沾滿油的針去縫衣服，會把漂亮的布料弄出一大堆油漬！', plate: '針頭非常細小尖銳，電鍍可能會改變它的形狀讓它變鈍。' } 
    },
    faucet: { 
        title: '浴室的新水龍頭', icon: '🚰', correct: 'plate', correctDesc: '電鍍', 
        successMsg: '表面經過鍍鉻（電鍍）處理，不但防鏽還能閃閃發光，超有質感！', 
        wrongMsg: { paint: '水龍頭每天轉來轉去，表面的油漆很快就會剝落掉光了！', oil: '水龍頭塗滿油，洗手的時候手越洗越油，太崩潰了！', dry: '它就是用來出水的水龍頭，怎麼可能不碰到水啦！' } 
    },
    fan: { 
        title: '運轉卡卡的電風扇馬達', icon: '🌀', correct: 'oil', correctDesc: '塗油', 
        successMsg: '滴入少許馬達潤滑油，隔絕空氣的同時讓轉軸恢復順暢，涼風又吹來了！', 
        wrongMsg: { paint: '油漆把馬達的轉軸黏死，一通電馬達就燒毀冒煙了！', dry: '馬達已經很乾燥了，它現在需要的是潤滑，否則會因為摩擦過熱！', plate: '馬達裡面有精密的銅線圈，通電電鍍會讓整台電風扇短路！' } 
    },
    can: { 
        title: '玉米罐頭的內部', icon: '🥫', correct: 'plate', correctDesc: '電鍍', 
        successMsg: '內部經過「鍍錫」處理（又稱馬口鐵），可以防鏽且安全保護食物！', 
        wrongMsg: { paint: '工業防鏽漆含有毒物質，塗在食物罐頭裡面會讓人食物中毒！', oil: '把玉米泡在防鏽機油裡面... 這罐頭打開應該會嚇壞大家！', dry: '玉米罐頭裡面充滿了湯汁水分，絕對不可能是乾燥的！' } 
    },
    watch: { 
        title: '名貴的古董懷錶內部', icon: '⏱️', correct: 'dry', correctDesc: '保持乾燥', 
        successMsg: '妥善存放在控制濕度的防潮箱中，古董懷錶的精密齒輪完美保存！', 
        wrongMsg: { paint: '油漆會把懷錶內部幾百個微小的齒輪全部黏死，手錶直接報廢！', oil: '雖然有些零件需要微量專用油，但整顆泡油或塗滿防鏽油會損壞精密結構！', plate: '古董懷錶非常脆弱，隨便拿去電鍍會破壞它的歷史價值與結構！' } 
    }
};

const rustToolsInfo = {
    dry: { name: '保持乾燥', icon: '🧽' },
    paint: { name: '上漆', icon: '🖌️' },
    oil: { name: '塗油', icon: '🛢️' },
    plate: { name: '電鍍', icon: '⚡' }
};

// 初始化新遊戲
function startRustGame() {
    currentRustRound = 0;
    rustScore = 0;
    // 🌟 將 15 個題目洗牌，並抽出前 5 題
    const allKeys = Object.keys(rustScenariosData);
    shuffleArray(allKeys); // 使用原本已有的洗牌函數
    selectedRustScenarios = allKeys.slice(0, totalRustRounds);
    
    loadRustScenario();
}
// 【修復點 2】：補上缺失的進度點點更新函數，解決按鈕卡住的問題
function updateRustProgressDots() {
    const dotsContainer = document.getElementById('rust-progress-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < totalRustRounds; i++) {
        const dot = document.createElement('div');
        if (i < currentRustRound) {
            dot.className = 'w-4 h-4 rounded-full bg-emerald-500'; // 已完成
        } else if (i === currentRustRound) {
            dot.className = 'w-4 h-4 rounded-full bg-sky-500 animate-pulse'; // 進行中
        } else {
            dot.className = 'w-4 h-4 rounded-full bg-slate-300'; // 未開始
        }
        dotsContainer.appendChild(dot);
    }
}
// 1. 載入當前關卡
function loadRustScenario() {
    const scenarioKey = selectedRustScenarios[currentRustRound];
    const scenarioInfo = rustScenariosData[scenarioKey];

    // 更新 UI 進度
    document.getElementById('rust-round-text').innerText = currentRustRound + 1; // 🌟 補回這一行！更新進度數字
    document.getElementById('rust-title').className = "text-lg md:text-xl font-bold text-slate-800 leading-snug relative z-10 px-2";
    updateRustProgressDots();

    // 重置展示區
    const display = document.getElementById('rust-display');
    display.className = "flex-[3] p-8 rounded-3xl text-center transition-colors duration-500 bg-slate-100 border-4 border-slate-300 relative overflow-hidden min-h-[280px] flex flex-col justify-center items-center";
    
    document.getElementById('rust-icon').innerText = scenarioInfo.icon;
    document.getElementById('rust-icon').className = "text-7xl md:text-8xl mb-4 relative z-10 drop-shadow-md transition-transform duration-300";
    document.getElementById('rust-title').innerText = scenarioInfo.title;

    // 顯示工具，隱藏回饋、下一步與結算畫面
    const toolsContainer = document.getElementById('rust-tools-container');
    const finalResult = document.getElementById('rust-final-result');

    if (toolsContainer) toolsContainer.classList.remove('hidden');
    if (finalResult) {
        finalResult.classList.add('hidden');
        finalResult.classList.remove('flex');
    }
    document.getElementById('rust-feedback-box').classList.add('hidden');
    document.getElementById('rust-next-section').classList.add('hidden');
}

// 2. 處理選擇與時光機特效
function handleRustAction(toolId) {
    // 隱藏選項按鈕區
    document.getElementById('rust-tools-container').classList.add('hidden');
    document.getElementById('rust-icon').classList.remove('animate-pulse');

    const overlay = document.getElementById('time-machine-overlay');
    
    // 【修復點 1】：顯示時必須明確加入 flex，讓置中屬性生效
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    void overlay.offsetWidth; // 觸發重繪
    overlay.classList.replace('opacity-0', 'opacity-100');

    setTimeout(() => {
        overlay.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => {
            // 隱藏時也要記得把 flex 拿掉
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
        }, 500); 
        evaluateRustResult(toolId);
    }, 2000);
}

// 3. 評估結果並顯示回饋
function evaluateRustResult(toolId) {
    const scenarioKey = selectedRustScenarios[currentRustRound];
    const scenarioInfo = rustScenariosData[scenarioKey];
    
    const display = document.getElementById('rust-display');
    const feedbackBox = document.getElementById('rust-feedback-box');
    const feedbackText = document.getElementById('rust-feedback-text');
    const feedbackDetail = document.getElementById('rust-feedback-detail');
    const feedbackIcon = document.getElementById('rust-feedback-icon');

    if (toolId === scenarioInfo.correct) {
        // 答對的邏輯
        rustScore++;
        display.className = "flex-[3] p-8 rounded-3xl text-center transition-colors duration-500 bg-emerald-50 border-4 border-emerald-400 relative overflow-hidden min-h-[280px] flex flex-col justify-center items-center";
        document.getElementById('rust-icon').innerText = '✨' + scenarioInfo.icon + '✨';
        document.getElementById('rust-icon').classList.add('scale-125');
        document.getElementById('rust-title').innerText = '防鏽大成功！';

        // 成功畫面的深色清晰文字
        feedbackBox.className = "mt-6 p-6 rounded-2xl border-4 border-emerald-300 bg-emerald-50 flex items-start gap-4 transition-all w-full animate-fade-in-up";
        feedbackText.className = "text-xl md:text-2xl font-bold text-emerald-950 mb-2";
        feedbackText.innerText = `🏆 維修成功：${scenarioInfo.correctDesc}`;
        feedbackDetail.className = "text-emerald-900 font-medium text-base md:text-lg leading-relaxed";
        feedbackDetail.innerText = scenarioInfo.successMsg;
        feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" class="text-emerald-600 w-10 h-10 md:w-12 md:h-12"></i>`;
    } else {
        // 答錯的邏輯
        display.className = "flex-[3] p-8 rounded-3xl text-center transition-colors duration-500 bg-red-50 border-4 border-red-400 relative overflow-hidden min-h-[280px] flex flex-col justify-center items-center";
        document.getElementById('rust-icon').innerText = '🟤防鏽失敗';
        document.getElementById('rust-title').innerText = '物品損壞！';

        // 失敗畫面的深色清晰文字
        feedbackBox.className = "mt-6 p-6 rounded-2xl border-4 border-red-300 bg-red-50 flex items-start gap-4 transition-all w-full animate-fade-in-up";
        feedbackText.className = "text-xl md:text-2xl font-bold text-red-950 mb-2";
        feedbackText.innerText = `❌ 維修失敗：使用了「${rustToolsInfo[toolId].name}」`;
        feedbackDetail.className = "text-red-900 font-medium text-base md:text-lg leading-relaxed";
        
        // 正確抓取失敗原因
        let errorReason = scenarioInfo.wrongMsg[toolId] || '這個方法不適合這個物品喔！';
        feedbackDetail.innerHTML = `${errorReason}<br><br>👉 正確做法應該是：<span class="font-bold border-b-2 border-red-500">${scenarioInfo.correctDesc}</span>`;
        feedbackIcon.innerHTML = `<i data-lucide="x-circle" class="text-red-500 w-10 h-10 md:w-12 md:h-12"></i>`;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    feedbackBox.classList.remove('hidden');

    // 顯示下一題或結算按鈕
    const nextBtn = document.getElementById('rust-next-btn');
    if (currentRustRound < totalRustRounds - 1) {
        nextBtn.innerText = '處理下一個委託 ➡️';
        nextBtn.className = 'px-10 py-4 bg-sky-600 text-white font-black text-xl rounded-full hover:bg-sky-700 hover:scale-105 transition-all shadow-md w-full md:w-auto';
    } else {
        nextBtn.innerText = '🏆 查看防鏽認證';
        nextBtn.className = 'px-10 py-4 bg-slate-700 text-white font-black text-xl rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-md w-full md:w-auto animate-pulse';
    }
    document.getElementById('rust-next-section').classList.remove('hidden');
}

function nextRustRound() {
    currentRustRound++;
    if (currentRustRound < totalRustRounds) {
        loadRustScenario();
    } else {
        showRustResult();
    }
}

// 3. 顯示最終結算
function showRustResult() {
    const display = document.getElementById('rust-display');
    const toolsContainer = document.getElementById('rust-tools-container');
    const finalResult = document.getElementById('rust-final-result');
    const feedbackBox = document.getElementById('rust-feedback-box');
    const nextBtnSection = document.getElementById('rust-next-section');

    document.getElementById('rust-progress-dots').innerHTML = '';
    document.getElementById('rust-round-text').innerText = '完成';
    
    // 隱藏右側工具區、下方回饋與下一步按鈕
    if (toolsContainer) toolsContainer.classList.add('hidden');
    if (feedbackBox) feedbackBox.classList.add('hidden');
    if (nextBtnSection) nextBtnSection.classList.add('hidden');

    // 顯示右側結算專用區塊
    if (finalResult) {
        finalResult.classList.remove('hidden');
        finalResult.classList.add('flex');
    }

    // 左側舞台區改為結算展示樣式
    display.className = "flex-[3] p-8 rounded-3xl text-center transition-colors duration-500 bg-sky-50 border-4 border-sky-400 relative overflow-hidden min-h-[280px] flex flex-col justify-center items-center";

    let resultHTML = '';
    if (rustScore === 5) {
        document.getElementById('rust-icon').innerText = '🏅';
        document.getElementById('rust-icon').className = "text-8xl md:text-9xl mb-4 relative z-10 drop-shadow-md animate-bounce";
        document.getElementById('rust-title').innerText = '防鏽兵工廠完美結業！';

        resultHTML = `<h3 class="text-3xl md:text-4xl font-black text-sky-700 mb-4">首席防鏽大師！</h3>
                      <p class="text-xl md:text-2xl font-bold text-slate-700 mb-6">完美修復：<span class="text-emerald-500 text-4xl mx-2">5</span> / 5</p>
                      <p class="text-base md:text-lg text-slate-600 mb-8">你非常清楚如何針對不同物品對症下藥，完美阻絕了水和空氣！</p>`;
    } else if (rustScore >= 3) {
        document.getElementById('rust-icon').innerText = '🔧';
        document.getElementById('rust-icon').className = "text-8xl md:text-9xl mb-4 relative z-10 drop-shadow-md animate-pulse";
        document.getElementById('rust-title').innerText = '防鏽任務完成！';

        resultHTML = `<h3 class="text-2xl md:text-3xl font-black text-sky-700 mb-4">熟練的維修員！</h3>
                      <p class="text-xl md:text-2xl font-bold text-slate-700 mb-6">修復成功：<span class="text-amber-500 text-4xl mx-2">${rustScore}</span> / 5</p>
                      <p class="text-base md:text-lg text-slate-600 mb-8">防鏽觀念不錯，但有些特殊物品的處理方式還要再熟悉一下喔！</p>`;
    } else {
        document.getElementById('rust-icon').innerText = '💥';
        document.getElementById('rust-icon').className = "text-8xl md:text-9xl mb-4 relative z-10 drop-shadow-md";
        document.getElementById('rust-title').innerText = '兵工廠需要支援！';

        resultHTML = `<h3 class="text-2xl md:text-3xl font-black text-slate-700 mb-4">兵工廠遭到鐵鏽吞噬！</h3>
                      <p class="text-xl md:text-2xl font-bold text-slate-700 mb-6">修復成功：<span class="text-red-500 text-4xl mx-2">${rustScore}</span> / 5</p>
                      <p class="text-base md:text-lg text-slate-600 mb-8">請回頭複習「防鏽指南」中的武器庫介紹，再回來拯救這些物品吧！</p>`;
    }

    resultHTML += `<button onclick="startRustGame()" class="px-8 py-4 bg-slate-700 text-white font-black text-xl rounded-full hover:bg-slate-800 transition-all shadow-md w-full">🔄 重新隨機抽取 5 題</button>`;

    // 將成績與按鈕渲染到右側框架中
    if (finalResult) finalResult.innerHTML = resultHTML;
}