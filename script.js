/* script.js — main site behavior for the Shub portal
   - Keep this file at project root and include on pages that need it
   - Relies on small DOM ids/classes described in the HTML files
*/

(function () {
  'use strict';

  // ----- basic routing guard: require login for most pages -----
  const allowedWithoutLogin = [
    '/', '/index.html', '/certificate.html', '/warning.html'
  ];
  const logged = !!localStorage.getItem('shub_logged');

  // If not logged in and not on allowed pages, redirect to login
  (function guard() {
    const path = location.pathname.split('/').pop() || 'index.html';
    if (!logged && !allowedWithoutLogin.includes('/' + path)) {
      // allow direct certificate view if already generated
      if (path === 'certificate.html' && localStorage.getItem('shub_cert')) return;
      location.href = 'index.html';
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // ------------------- LOGIN PAGE -------------------
    if (body.classList.contains('login-screen')) {
      const loginBtn = document.querySelector('.login-box button');
      const errEl = document.getElementById('error');

      loginBtn && loginBtn.addEventListener('click', () => {
        const user = document.getElementById('username').value?.trim();
        const pass = document.getElementById('password').value?.trim();
        if (user === 'Shub@princess' && pass === 'Fast-text') {
          localStorage.setItem('shub_logged', '1');
          // small success flash then go to portal
          loginBtn.textContent = 'Access granted';
          setTimeout(() => location.href = 'portal.html', 420);
        } else {
          errEl.textContent = 'Invalid credentials — try again';
          setTimeout(() => errEl.textContent = '', 2500);
        }
      });
      return;
    }

    // ------------------- PORTAL PAGE -------------------
    if (body.classList.contains('portal-bg')) {
      const bracelet = document.getElementById('bracelet');
      if (bracelet) {
        bracelet.addEventListener('click', () => {
          bracelet.style.transform = 'scale(1.06)';
          bracelet.style.transition = 'transform .28s ease';
          setTimeout(() => location.href = 'bracelet.html', 600);
        });
      }
      return;
    }

    // ------------------- BRACELET / MONSTER / ANIME PAGES -----
    // These are simple navigation pages: no special JS needed.
    // No blocking behaviors here.

    // ------------------- TIC TAC TOE (page: tictactoe.html) -------------------
    if (document.querySelector('.tictac-grid')) {
      initTicTacToe();
      return;
    }

    // ------------------- QUIZ PAGE -------------------
    if (location.pathname.endsWith('quiz.html')) {
      const form = document.getElementById('quizForm');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const answers = Array.from(form.querySelectorAll('input[type="checkbox"]')).map(cb => !!cb.checked);
        localStorage.setItem('shub_quiz', JSON.stringify(answers));
        // go to certificate
        location.href = 'certificate.html';
      });

      // If there is a Next/anchor instead of a submit button, add click handler
      const nextBtn = document.querySelector('.next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const answers = Array.from(form.querySelectorAll('input[type="checkbox"]')).map(cb => !!cb.checked);
          localStorage.setItem('shub_quiz', JSON.stringify(answers));
          location.href = 'certificate.html';
        });
      }
      return;
    }

    // ------------------- CERTIFICATE PAGE -------------------
    if (location.pathname.endsWith('certificate.html')) {
      // Try to draw to canvas if present; otherwise show stored resource
      const canvas = document.getElementById('certCanvas');
      const img = document.getElementById('certImg');
      const downloadBtn = document.getElementById('downloadCert') || document.getElementById('downloadCertBtn');

      if (canvas && canvas.getContext) {
        drawCertificateToCanvas(canvas).then((dataUrl) => {
          // persist for later pages
          try { localStorage.setItem('shub_cert', dataUrl); } catch (e) { /* ignore */ }
        }).catch((err) => console.warn('Cert draw failed', err));
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            const url = canvas.toDataURL('image/png');
            triggerDownload(url, 'Shub_certificate.png');
          });
        }
      } else if (img) {
        // fallback: load saved base64 image if exists
        const saved = localStorage.getItem('shub_cert');
        if (saved) img.src = saved;
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            const url = img.src;
            if (!url) return alert('No certificate found. Generate it from the portal first.');
            triggerDownload(url, 'Shub_certificate.png');
          });
        }
      }
      return;
    }

    // ------------------- DEFAULT: nothing specific -------------------
  });

  // ------------------- TicTacToe Implementation -------------------
  function initTicTacToe() {
    const boardEl = document.getElementById('board') || document.getElementById('tttBoard') || document.querySelector('.tictac-grid');
    if (!boardEl) return;
    // create 9 cells if empty
    boardEl.innerHTML = '';
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.dataset.index = i;
      cell.addEventListener('click', () => humanMove(i));
      boardEl.appendChild(cell);
      cells.push(cell);
    }

    let board = Array(9).fill(null);

    function render() {
      for (let i = 0; i < 9; i++) {
        cells[i].textContent = board[i] || '';
        cells[i].classList.toggle('disabled', !!board[i]);
      }
    }

    function humanMove(i) {
      if (board[i] || checkWinner(board)) return;
      board[i] = 'X';
      render();
      if (checkWinner(board) || isFull(board)) return;
      setTimeout(() => {
        const ai = minimaxRoot(board, 'O');
        if (ai !== null) board[ai] = 'O';
        render();
      }, 220);
    }

    // helper check & minimax
    function isFull(b) { return b.every(Boolean); }
    function checkWinner(b) {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a,b1,c] of lines) {
        if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
      }
      return null;
    }

    function minimaxRoot(boardState, player) {
      const avail = boardState.map((v,i) => v ? null : i).filter(v => v !== null);
      let best = -Infinity, move = null;
      for (const i of avail) {
        boardState[i] = player;
        const score = minimax(boardState, 0, false);
        boardState[i] = null;
        if (score > best) { best = score; move = i; }
      }
      return move;
    }

    function minimax(bd, depth, isMax) {
      const winner = checkWinner(bd);
      if (winner === 'O') return 10 - depth;
      if (winner === 'X') return depth - 10;
      if (isFull(bd)) return 0;
      if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!bd[i]) { bd[i] = 'O'; best = Math.max(best, minimax(bd, depth+1, false)); bd[i] = null; }
        }
        return best;
      } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
          if (!bd[i]) { bd[i] = 'X'; best = Math.min(best, minimax(bd, depth+1, true)); bd[i] = null; }
        }
        return best;
      }
    }
    // expose restart via global (if a button exists)
    window.restartTicTacToe = () => {
      board = Array(9).fill(null); render();
    };
    render();
  }

  // ------------------- Certificate Drawing -------------------
  async function drawCertificateToCanvas(canvas) {
    return new Promise((resolve, reject) => {
      try {
        const W = canvas.width || 1400;
        const H = canvas.height || 900;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // background (parchment)
        ctx.fillStyle = '#fff6f8';
        ctx.fillRect(0,0,W,H);

        // subtle texture (cheap)
        ctx.fillStyle = 'rgba(0,0,0,0.015)';
        for (let i=0;i<900;i++) ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);

        // border
        ctx.strokeStyle = '#d1a07a'; ctx.lineWidth = 12;
        roundRect(ctx, 30, 30, W-60, H-60, 26, false, true);

        // title
        ctx.fillStyle = '#3b0d26'; ctx.font = '34px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('Certificate of Eternal Friendship', W/2, 120);

        // name
        ctx.font = '48px Georgia'; ctx.fillStyle = '#1f0416';
        ctx.fillText('SHUB', W/2, 210);

        // message
        ctx.font = '20px "Poppins", sans-serif'; ctx.fillStyle = '#3b2432';
        const msg = 'This certifies that SHUB is now forcefully enrolled in this friendship. The white beads and the single black bead are honored. White Monster energy recognized. Escape attempts will be voided.';
        wrapText(ctx, msg, W/2, 260, W-260, 26);

        // attempt to draw monster and bracelet images
        const monster = new Image();
        const brace = new Image();
        let loaded = 0;
        function attemptFinalize(){
          // draw images if loaded
          if (monster.complete && monster.naturalWidth) {
            ctx.drawImage(monster, W-360, H-380, 240, 320);
          }
          if (brace.complete && brace.naturalWidth) {
            ctx.drawImage(brace, W/2 - 110, H-220, 220, 220);
          }
          // seal
          ctx.beginPath(); ctx.fillStyle = '#ffb3e6'; ctx.arc(140, H-160, 64, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#4a1534'; ctx.font = '16px Georgia'; ctx.fillText('OFFICIAL SEAL', 140, H-156);

          const dataUrl = canvas.toDataURL('image/png');
          try { localStorage.setItem('shub_cert', dataUrl); } catch(e) { /* ignore */ }
          resolve(dataUrl);
        }

        monster.onload = () => { loaded++; attemptFinalize(); };
        monster.onerror = () => { loaded++; attemptFinalize(); };
        brace.onload = () => { loaded++; attemptFinalize(); };
        brace.onerror = () => { loaded++; attemptFinalize(); };

        // start loading (may fail if missing; finalize will still run)
        monster.crossOrigin = 'anonymous'; brace.crossOrigin = 'anonymous';
        monster.src = 'assets/white-monster.png';
        brace.src = 'assets/bracelet-real.png';

        // safety finalize if images don't trigger events in time
        setTimeout(attemptFinalize, 1200);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ------------------- small helpers -------------------
  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    if (typeof stroke === 'undefined') stroke = true;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    ctx.textAlign = 'center';
    const words = text.split(' ');
    let line = '', row = 0;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        ctx.fillText(line, x, y + row * lineHeight);
        line = words[n] + ' ';
        row++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y + row * lineHeight);
  }

  function triggerDownload(uri, filename) {
    const a = document.createElement('a');
    a.href = uri;
    a.download = filename || 'download.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

})();
