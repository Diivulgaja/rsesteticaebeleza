(function () {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  let deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[PWA] Service worker não registrado:', err));
    });
  }

  if (isStandalone) return;

  const isMobile = () => window.innerWidth < 768;
  const button = document.createElement('button');
  button.id = 'pwaInstallButton';
  button.type = 'button';
  button.setAttribute('aria-label', 'Instalar aplicativo');
  button.style.cssText = [
    'position:fixed',
    'right:16px',
    'bottom:16px',
    'left:auto',
    'z-index:9999',
    'display:none',
    'align-items:center',
    'justify-content:center',
    'gap:8px',
    'padding:14px 18px',
    'border:none',
    'border-radius:999px',
    'background:linear-gradient(135deg,#a86161,#4f2d2d)',
    'color:#fff',
    'font:600 14px Outfit,system-ui,sans-serif',
    'box-shadow:0 18px 40px rgba(79,45,45,0.28)',
    'cursor:pointer',
    'max-width:calc(100vw - 32px)',
    'white-space:nowrap'
  ].join(';');
  button.innerHTML = '<span style="font-size:16px;line-height:1">⬇</span><span>Instalar app</span>';

  function isVisibleElement(element) {
    if (!element || !document.body.contains(element)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getAvoidanceOffset() {
    const selectors = [
      '#floating-whatsapp',
      '.customer-tabs-floating',
      '.fixed.bottom-0',
      '[data-mobile-sticky-actions]',
      '[data-sticky-install-avoid]'
    ];
    let offset = 16;
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (!isVisibleElement(element) || element === button) return;
        const rect = element.getBoundingClientRect();
        const extra = Math.max(0, window.innerHeight - rect.top) + 16;
        offset = Math.max(offset, extra);
      });
    });
    return offset;
  }

  function updateButtonPlacement() {
    if (!document.body.contains(button)) return;
    const bottom = getAvoidanceOffset();
    button.style.bottom = `${bottom}px`;
    if (isMobile()) {
      button.style.left = '16px';
      button.style.right = 'auto';
      button.style.maxWidth = 'calc(100vw - 32px)';
      button.style.padding = '13px 16px';
      button.style.fontSize = '13px';
    } else {
      button.style.left = 'auto';
      button.style.right = '16px';
      button.style.maxWidth = '420px';
      button.style.padding = '14px 18px';
      button.style.fontSize = '14px';
    }
  }

  button.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('No Android, abra o menu do navegador e toque em “Instalar app” ou “Adicionar à tela inicial”.');
      return;
    }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } finally {
      deferredPrompt = null;
      button.style.display = 'none';
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!document.body.contains(button)) document.body.appendChild(button);
    button.style.display = 'inline-flex';
    updateButtonPlacement();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.style.display = 'none';
  });

  ['load', 'resize', 'scroll'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      if (!document.body.contains(button)) document.body.appendChild(button);
      updateButtonPlacement();
    }, { passive: true });
  });
})();
