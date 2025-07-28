// 在现有JS中添加
let audioContext;
let analyser;
let dataArray;
let animationId;

// 创建可视化画布
function createVisualizer() {
  const visualizerContainer = document.createElement('div');
  visualizerContainer.className = 'w-full h-24 mb-6 rounded-lg overflow-hidden bg-dark/50';
  
  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full';
  visualizerContainer.appendChild(canvas);
  
  // 插入到进度条上方
  progressBar.parentElement.parentNode.insertBefore(visualizerContainer, progressBar.parentElement);
  
  const ctx = canvas.getContext('2d');
  
  // 初始化音频上下文
  function initAudioContext() {
    if (audioContext) return;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioPlayer);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // 开始绘制
      drawVisualizer();
    } catch (e) {
      console.error('音频可视化初始化失败:', e);
    }
  }
  
  // 绘制频谱
  function drawVisualizer() {
    if (!analyser) return;
    
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    animationId = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width / dataArray.length) * 2.5;
    let x = 0;
    
    // 渐变色彩
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#ec4899');
    
    dataArray.forEach(value => {
      const barHeight = (value / 255) * height;
      
      ctx.fillStyle = gradient;
      // 绘制圆角矩形
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(x + radius, 0);
      ctx.lineTo(x + barWidth - radius, 0);
      ctx.arcTo(x + barWidth, 0, x + barWidth, radius, radius);
      ctx.arcTo(x + barWidth, barHeight, x + barWidth - radius, barHeight, radius);
      ctx.lineTo(x + radius, barHeight);
      ctx.arcTo(x, barHeight, x, barHeight - radius, radius);
      ctx.arcTo(x, 0, x + radius, 0, radius);
      ctx.closePath();
      ctx.fill();
      
      x += barWidth + 1;
    });
  }
  
  // 监听播放事件初始化
  audioPlayer.addEventListener('play', () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    } else {
      initAudioContext();
    }
  });
  
  // 窗口大小变化时重绘
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  });
  
  // 停止播放时清理
  audioPlayer.addEventListener('pause', () => {
    if (audioContext && animationId) {
      cancelAnimationFrame(animationId);
    }
  });
}

// 页面加载完成后初始化可视化
window.addEventListener('load', createVisualizer);
// 收藏功能实现
function initFavoriteFeature() {
  // 添加收藏按钮到歌曲信息区域
  const favoriteButton = document.createElement('button');
  favoriteButton.id = 'favoriteButton';
  favoriteButton.className = 'mt-3 text-gray-400 hover:text-secondary btn-hover ripple btn-click particle-trigger';
  favoriteButton.innerHTML = '<i class="fa fa-heart-o text-xl"></i>';
  favoriteButton.title = '收藏歌曲';
  favoriteButton.disabled = true;
  
  // 插入到歌曲信息区域
  songArtist.parentNode.appendChild(favoriteButton);
  
  // 从本地存储加载收藏
  function getFavorites() {
    return JSON.parse(localStorage.getItem('musicFavorites') || '[]');
  }
  
  // 保存收藏到本地存储
  function saveFavorites(favorites) {
    localStorage.setItem('musicFavorites', JSON.stringify(favorites));
  }
  
  // 检查是否收藏
  function isFavorite(fileName) {
    return getFavorites().includes(fileName);
  }
  
  // 切换收藏状态
  function toggleFavorite() {
    if (currentIndex === -1 || !songs[currentIndex]) return;
    
    const fileName = songs[currentIndex].name;
    const favorites = getFavorites();
    const index = favorites.indexOf(fileName);
    
    if (index === -1) {
      favorites.push(fileName);
      favoriteButton.innerHTML = '<i class="fa fa-heart text-xl text-secondary"></i>';
      // 添加收藏动画
      favoriteButton.classList.add('animate-pulse');
      setTimeout(() => favoriteButton.classList.remove('animate-pulse'), 1000);
    } else {
      favorites.splice(index, 1);
      favoriteButton.innerHTML = '<i class="fa fa-heart-o text-xl"></i>';
    }
    
    saveFavorites(favorites);
    // 更新播放列表中的收藏图标
    updatePlaylistFavorites();
  }
  
  // 更新播放列表中的收藏图标
  function updatePlaylistFavorites() {
    const favorites = getFavorites();
    document.querySelectorAll('#playlist li').forEach((item, index) => {
      const favIcon = item.querySelector('.favorite-icon');
      if (favIcon && songs[index]) {
        if (favorites.includes(songs[index].name)) {
          favIcon.className = 'fa fa-heart text-secondary favorite-icon';
        } else {
          favIcon.className = 'fa fa-heart-o text-gray-500 favorite-icon';
        }
      }
    });
  }
  
  // 播放新歌曲时更新收藏按钮状态
  function updateFavoriteButton() {
    if (currentIndex === -1 || !songs[currentIndex]) {
      favoriteButton.disabled = true;
      favoriteButton.innerHTML = '<i class="fa fa-heart-o text-xl"></i>';
      return;
    }
    
    favoriteButton.disabled = false;
    if (isFavorite(songs[currentIndex].name)) {
      favoriteButton.innerHTML = '<i class="fa fa-heart text-xl text-secondary"></i>';
    } else {
      favoriteButton.innerHTML = '<i class="fa fa-heart-o text-xl"></i>';
    }
  }
  
  // 为播放列表项添加收藏图标
  // 修改原有的addSongToPlaylist函数，添加收藏图标
  const originalAddSongToPlaylist = addSongToPlaylist; // 假设原函数存在
  addSongToPlaylist = function(song) {
    originalAddSongToPlaylist(song);
    updatePlaylistFavorites();
  };
  
  // 绑定事件
  favoriteButton.addEventListener('click', toggleFavorite);
  
  // 监听播放变化
  audioPlayer.addEventListener('ended', updateFavoriteButton);
  prevButton.addEventListener('click', () => setTimeout(updateFavoriteButton, 100));
  nextButton.addEventListener('click', () => setTimeout(updateFavoriteButton, 100));
  
  // 初始化
  updateFavoriteButton();
}

// 初始化收藏功能
window.addEventListener('load', initFavoriteFeature);
// 播放速度调节功能
function initPlaybackSpeedControl() {
  // 创建速度控制元素
  const speedControlContainer = document.createElement('div');
  speedControlContainer.className = 'flex items-center mt-4 ml-auto mr-2';
  
  const speedLabel = document.createElement('span');
  speedLabel.className = 'text-sm text-gray-400 mr-2';
  speedLabel.textContent = '速度:';
  
  const speedSelect = document.createElement('select');
  speedSelect.className = 'bg-dark-light text-light text-sm rounded-lg px-2 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary';
  
  // 速度选项
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  speeds.forEach(speed => {
    const option = document.createElement('option');
    option.value = speed;
    option.textContent = `${speed}x`;
    if (speed === 1) option.selected = true;
    speedSelect.appendChild(option);
  });
  
  speedControlContainer.appendChild(speedLabel);
  speedControlContainer.appendChild(speedSelect);
  
  // 插入到控制栏
  playPauseButton.parentNode.appendChild(speedControlContainer);
  
  // 速度变化事件
  speedSelect.addEventListener('change', (e) => {
    audioPlayer.playbackRate = parseFloat(e.target.value);
    // 添加速度变化提示
    showToast(`播放速度: ${e.target.value}x`);
  });
}

// 简易提示框功能
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-dark-light text-light px-4 py-2 rounded-lg shadow-lg z-50 transform translate-y-10 opacity-0 transition-all duration-300';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 显示动画
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  }, 10);
  
  // 3秒后隐藏
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// 初始化播放速度控制
window.addEventListener('load', initPlaybackSpeedControl);
// 主题切换功能
function initThemeSwitch() {
  // 创建主题切换按钮
  const themeButton = document.createElement('button');
  themeButton.id = 'themeButton';
  themeButton.className = 'absolute top-4 right-4 text-gray-400 hover:text-primary btn-hover ripple btn-click particle-trigger p-2 rounded-full';
  themeButton.innerHTML = '<i class="fa fa-sun-o text-xl"></i>';
  themeButton.title = '切换主题';
  
  document.body.appendChild(themeButton);
  
  // 检查保存的主题偏好
  const savedTheme = localStorage.getItem('musicPlayerTheme') || 'dark';
  applyTheme(savedTheme);
  
  // 应用主题
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('from-dark', 'via-slate-900', 'to-slate-800');
      document.body.classList.add('from-gray-100', 'via-gray-200', 'to-gray-300');
      document.body.classList.remove('text-light');
      document.body.classList.add('text-dark');
      themeButton.innerHTML = '<i class="fa fa-moon-o text-xl"></i>';
      localStorage.setItem('musicPlayerTheme', 'light');
    } else {
      document.body.classList.remove('from-gray-100', 'via-gray-200', 'to-gray-300');
      document.body.classList.add('from-dark', 'via-slate-900', 'to-slate-800');
      document.body.classList.remove('text-dark');
      document.body.classList.add('text-light');
      themeButton.innerHTML = '<i class="fa fa-sun-o text-xl"></i>';
      localStorage.setItem('musicPlayerTheme', 'dark');
    }
  }
  
  // 切换主题
  themeButton.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('musicPlayerTheme') || 'dark';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}

// 初始化主题切换
window.addEventListener('load', initThemeSwitch);