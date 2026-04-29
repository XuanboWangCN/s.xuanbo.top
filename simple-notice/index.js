/**
 * SimpleNotify - 多功能通知库
 * 功能：
 * - 纯色简约设计风格
 * - 修复进度条边框问题
 * - 优化动画效果
 */


const SimpleNotify = (function() {
  // 配置参数
  const config = {
    defaultDuration: 3000,
    maxNotifications: 10,
    spacing: 15,
    showProgressBar: false
  };

  // 状态变量
  let isDOMReady = false;
  let pendingNotifications = [];
  let activeNotifications = 0;
  let container = null;

  // 初始化函数
  function init() {
    if (isDOMReady) return;

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      /* 容器样式 */
      .simple-notify-container {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 350px;
        width: calc(100% - 40px);
        z-index: 9999;
        font-family: 'Helvetica Neue', system-ui, -apple-system, sans-serif;
        pointer-events: none;
      }
      
      /* 通知主体 */
      .simple-notify {
        position: relative;
        padding: 18px 20px;
        margin-bottom: ${config.spacing}px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        color: #fff;
        pointer-events: auto;
        transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        opacity: 0;
        transform: translateX(120%);
        will-change: transform, opacity;
        overflow: hidden; /* 修复进度条溢出问题 */
      }
      
      .simple-notify.show {
        opacity: 1;
        transform: translateX(0);
      }
      
      .simple-notify.hide {
        opacity: 0;
        transform: translateY(-24px);
        transition-timing-function: linear; /* 改为线性动画 */
      }
      
      /* 进度条样式 */
      .simple-notify-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255,255,255,0.3);
        width: 100%;
        transform-origin: left;
        transform: scaleX(1);
        transition: transform linear;
        border-radius: 0 0 0 0; /* 移除圆角 */
      }
      
      /* 头部样式 */
      .simple-notify-header {
        display: flex;
        align-items: center;
        margin-bottom: 14px;
        gap: 12px;
      }
      
      .simple-notify-icon {
        font-size: 20px;
        flex-shrink: 0;
        line-height: 1;
        margin-top: 1px;
      }
      
      .simple-notify-title {
        flex-grow: 1;
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.02em;
        margin: 0;
        line-height: 1.3;
      }
      
      /* 关闭按钮 */
      .simple-notify-close {
        cursor: pointer;
        opacity: 0.85;
        transition: opacity 0.2s ease;
        font-size: 24px;
        line-height: 0.75;
        padding: 2px;
        margin-left: 4px;
        font-weight: 300;
      }
      
      .simple-notify-close:hover {
        opacity: 1;
      }
      
      /* 内容区域 */
      .simple-notify-content {
        font-size: 14px;
        line-height: 1.5;
        letter-spacing: 0.01em;
        opacity: 0.95;
      }
      
      /* 媒体元素样式 */
      .simple-notify-content audio,
      .simple-notify-content video,
      .simple-notify-content img,
      .simple-notify-content iframe {
        display: block;
        margin: 10px 0 6px;
      }
      
      /* 纯色配色方案 */
      .simple-notify-info { background-color: #3498db; }
      .simple-notify-warning { background-color: #f1c40f; }
      .simple-notify-error { background-color: #e74c3c; }
      
      /* 移动端适配 */
      @media (max-width: 480px) {
        .simple-notify-container {
          top: 15px;
          right: 15px;
          width: calc(100% - 30px);
        }
        
        .simple-notify {
          padding: 16px;
          border-radius: 6px;
        }
        
        .simple-notify-title {
          font-size: 15px;
        }
      }
    `;
    document.head.appendChild(style);

    // 创建容器
    container = document.createElement('div');
    container.className = 'simple-notify-container';
    document.body.appendChild(container);

    isDOMReady = true;
    
    // 处理等待中的通知
    pendingNotifications.forEach(notification => {
      show(notification.options);
    });
    pendingNotifications = [];
  }

  // 图标定义
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  // 显示通知
  function show(options) {
    if (!isDOMReady) {
      pendingNotifications.push({ options });
      return {
        close: () => console.warn('Notification not yet shown, cannot close')
      };
    }

    // 参数验证
    if (!options || !options.mode || !options.content) {
      console.error('SimpleNotify: mode and content are required');
      return;
    }

    const validModes = ['info', 'warning', 'error'];
    if (!validModes.includes(options.mode)) {
      console.error(`SimpleNotify: invalid mode "${options.mode}". Use one of: ${validModes.join(', ')}`);
      return;
    }

    // 限制最大通知数量
    if (activeNotifications >= config.maxNotifications) {
      console.warn(`SimpleNotify: maximum notifications (${config.maxNotifications}) reached`);
      return;
    }

    const duration = typeof options.duration !== 'undefined' ? options.duration : config.defaultDuration;
    const notify = document.createElement('div');
    notify.className = `simple-notify simple-notify-${options.mode}`;
    
    notify.innerHTML = `
      <div class="simple-notify-header">
        <div class="simple-notify-icon">${icons[options.mode]}</div>
        <div class="simple-notify-title">${options.title || options.mode.toUpperCase()}</div>
        <div class="simple-notify-close">×</div>
      </div>
      <div class="simple-notify-content">${options.content}</div>
      ${config.showProgressBar && duration > 0 ? '<div class="simple-notify-progress"></div>' : ''}
    `;

    container.appendChild(notify);
    activeNotifications++;
    
    // 触发动画
    void notify.offsetWidth;
    notify.classList.add('show');
    
    // 自动关闭定时器
    let autoCloseTimer;
    if (duration > 0) {
      autoCloseTimer = setTimeout(() => {
        closeNotification(notify);
      }, duration);
    }

    // 进度条动画
    if (config.showProgressBar && duration > 0) {
      const progressBar = notify.querySelector('.simple-notify-progress');
      if (progressBar) {
        progressBar.style.transitionDuration = `${duration}ms`;
        progressBar.style.transform = 'scaleX(0)';
      }
    }

    // 关闭按钮事件
    const closeBtn = notify.querySelector('.simple-notify-close');
    closeBtn.addEventListener('click', () => {
      closeNotification(notify);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    });

    return {
      close: () => {
        closeNotification(notify);
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
      },
      element: notify
    };
  }
  
  // 关闭通知
  function closeNotification(notify) {
    if (!notify || !notify.parentNode) return;
    
    notify.classList.remove('show');
    notify.classList.add('hide');
    
    setTimeout(() => {
      if (notify.parentNode) {
        notify.parentNode.removeChild(notify);
        activeNotifications--;
      }
    }, 400);
  }

  // 配置函数
  function configure(newConfig) {
    Object.assign(config, newConfig);
  }

  // 监听DOM加载完成
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 1);
  } else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }

  return {
    show,
    configure
  };
})();

// 全局导出
if (typeof window !== 'undefined') {
  window.SimpleNotify = SimpleNotify;
}

// 模块化导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleNotify;
}
