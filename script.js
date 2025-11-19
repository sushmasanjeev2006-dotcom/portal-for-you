/* script.js — unified controller for all pages (lightweight) */
/* Pages detect their behavior by body.classList (page-login, page-portal, page-stage1, page-ttt, page-memory, page-gym, page-emotion, page-cert, page-warning) */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // ---------- LOGIN (index.html) ----------
  if (body.classList.contains('page-login')) {
    const loginBtn = document.getElementById('login-btn');
    const err = document.getElementById('err');
    loginBtn.addEventListener('click', () => {
      const u = document.getElementById('username').value?.trim();
      const p = document.getElementById('password').value?.trim();
      if (u === 'Shub@princess' && p === 'Fast-text') {
        localStorage.setItem('shub_logged', '1');
        window.location.href = 'portal.html';
      } else {
        err.classList.remove('hidden');
        setTimeout(()=> err.classList.add('hidden'), 2500);
      }
    });
    return;
  }

  // if not logged, redirect to login (mobile safe)
  const logged = localStorage.getItem('shub_logged');
  if (!logged && !body.classList.contains('page-login')) {
    // allow certificate.html to still show if certificate exists
    if (!body.classList.contains('page-cert')) location.href = 'index.html';
  }

  // ---------- PORTAL (portal.html) ----------
  if (body.classList.contains('page-portal')) {
    const b = document.getElementById('bracelet');
    const skip = document.getElementById('skip-portal');
    b.addEventListener('click', () => {
      b.style.transform = 'scale(1.12)';
      b.style.transition = 'transform .34s ease';
      // small glow
      setTimeout(()=> window.location.href = 'stage1.html', 700);
    });
    skip.addEventListener('click', ()=> window.location.href = 'stage1.html');
    return;
  }

  // ---------- COIN GAME (stage1.html) ----------
  if (body.classList.contains('page-stage1')) {
    const canvas = document.getElementById('coinCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-coins');
    const timeEl = document.getElementById('coinTime');
    const countEl = document.getElementById('coinCount');

    let particles = [];
    let timer = 14;
    let running = false;
    let anim = null;
    let tick = null;
    let coinsCollected = parseInt(localStorage.getItem('mystic_coins') || '0',10);

    countEl.textContent = coinsCollected;

    function resize(){
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(1,0,0,1,0,0);
    }
    window.addEventListener('resize', resize); resize();

    function spawn(n=18){
      particles = [];
      for(let i=0;i<n;i++){
        particles.push({
          x: Math.random()*canvas.width,
          y: -Math.random()*canvas.height*Math.random(),
          vy: 0.9 + Math.random()*1.6,
          r: (10 + Math.random()*12)*devicePixelRatio,
          tapped:false
        });
      }
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const p of particles){
        const grad = ctx.createLinearGradient(p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r);
        grad.addColorStop(0,'#ffd681'); grad.addColorStop(1,'#ffb3e6');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#ffd18a'; ctx.lineWidth = 2; ctx.stroke();
        p.y += p.vy;
        if (p.y > canvas.height + 40){ p.y = -20; p.x = Math.random()*canvas.width; p.tapped=false; }
      }
      anim = requestAnimationFrame(draw);
    }
    function startRound(){
      if (running) return;
      running = true; timer = 14; timeEl.textContent = timer;
      spawn(20); draw();
      tick = setInterval(()=> {
        timer--; timeEl.textContent = timer;
        if (timer <= 0) stopRound();
      }, 1000);
    }
    function stopRound(){
      running = false; clearInterval(tick); cancelAnimationFrame(anim);
      // persist coins
      localStorage.setItem('mystic_coins', String(coinsCollected));
      // go to next stage
      setTimeout(()=> location.href = 'tictactoe.html', 400);
    }
    canvas.addEventListener('click', (e) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      for(const p of particles){
        const dx = x - p.x, dy = y - p.y;
        if(!p.tapped && dx*dx + dy*dy <= p.r*p.r){
          p.tapped = true;
          coinsCollected++;
          countEl.textContent = coinsCollected;
          break;
        }
      }
    });
    startBtn.addEventListener('click', startRound);
    return;
  }

  // ---------- TIC TAC TOE (tictactoe.html) ----------
  if (body.classList.contains('page-ttt')) {
    const boardEl = document.getElementById('tttBoard');
    const msg = document.getElementById('tttMsg');
    const resetBtn = document.getElementById('tttReset');
    const nextBtn = document.getElementById('tttNext');

    let board = Array(9).fill(null);

    function renderBoard(){
      boardEl.innerHTML = '';
      for(let i=0;i<9;i++){
        const c = document.createElement('div'); c.className='cell';
        c.textContent = board[i] || '';
        if (board[i]) c.classList.add('disabled');
        c.addEventListener('click', ()=> humanMove(i));
        boardEl.appendChild(c);
      }
      const w = checkWinner(board);
      if (w) msg.textContent = w === 'X' ? 'You win!' : 'Portal wins.';
      else if (isFull(board)) msg.textContent = "Draw.";
      else msg.textContent = 'Your move.';
    }

    function humanMove(i){
      if(board[i] || checkWinner(board)) return;
      board[i] = 'X'; renderBoard();
      if (checkWinner(board) || isFull(board)) return;
      // AI move (minimax)
      setTimeout(()=> {
        const aiIndex = minimaxRoot(board, 'O');
        if (aiIndex != null) board[aiIndex] = 'O';
        renderBoard();
      }, 240);
    }

    function isFull(b){ return b.every(Boolean); }
    function checkWinner(b){
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for(const ln of lines){ const [a,b1,c] = ln; if(b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a]; }
      return null;
    }

    // minimax
    function minimaxRoot(boardState, player){
      const avail = boardState.map((v,i)=> v ? null : i).filter(x=>x!==null);
      let best = -Infinity, move = null;
      for(const i of avail){
        boardState[i] = player;
        const score = minimax(boardState, 0, false);
        boardState[i] = null;
        if(score > best){ best = score; move = i; }
      }
      return move;
    }
    function minimax(boardState, depth, isMax){
      const res = checkWinner(boardState);
      if(res === 'O') return 10 - depth;
      if(res === 'X') return depth - 10;
      if(isFull(boardState)) return 0;
      if(isMax){
        let best = -Infinity;
        for(let i=0;i<9;i++){
          if(!boardState[i]){ boardState[i] = 'O'; best = Math.max(best, minimax(boardState, depth+1, false)); boardState[i] = null; }
        }
        return best;
      } else {
        let best = Infinity;
        for(let i=0;i<9;i++){
          if(!boardState[i]){ boardState[i] = 'X'; best = Math.min(best, minimax(boardState, depth+1, true)); boardState[i] = null; }
        }
        return best;
      }
    }

    resetBtn.addEventListener('click', ()=> { board = Array(9).fill(null); renderBoard(); });
    nextBtn.addEventListener('click', ()=> location.href = 'memory.html');

    renderBoard();
    return;
  }

  // ---------- MEMORY (memory.html) ----------
  if (body.classList.contains('page-memory')) {
    const ring = document.getElementById('memoryRing');
    const msg = document.getElementById('memMsg');
    const start = document.getElementById('memStart');
    const skip = document.getElementById('memSkip');

    // build ring of 6 beads
    const beads = [];
    for(let i=0;i<6;i++){
      const b = document.createElement('div'); b.className = 'memory-bead'; b.dataset.i = i;
      b.style.opacity = .35;
      ring.appendChild(b); beads.push(b);
    }

    let sequence = [];
    let pos = 0;
    function lightUp(index, time=450){
      beads[index].style.opacity = 1;
      setTimeout(()=> beads[index].style.opacity = .35, time);
    }
    function playSequence(){
      let idx = 0;
      sequence = [];
      // random length 4-6
      const len = 4 + Math.floor(Math.random()*3);
      for(let i=0;i<len;i++) sequence.push(Math.floor(Math.random()*beads.length));
      msg.textContent = 'Watch closely...';
      let delay = 0;
      sequence.forEach((s, i) => {
        setTimeout(()=> lightUp(s), delay);
        delay += 700;
      });
      setTimeout(()=> { msg.textContent = 'Repeat the sequence'; pos = 0; enableTap(); }, delay+300);
    }
    function enableTap(){
      beads.forEach((b, i)=> {
        b.onclick = ()=>{
          lightUp(i,200);
          if(i === sequence[pos]) {
            pos++;
            if(pos === sequence.length){
              // success
              msg.textContent = 'Success — bracelet resonates.';
              localStorage.setItem('mystic_coins', String((parseInt(localStorage.getItem('mystic_coins')||'0',10) + 5)));
              setTimeout(()=> location.href = 'gym.html', 900);
            }
          } else {
            msg.textContent = 'Sequence broken. Try again.';
            disableTap();
            setTimeout(()=> msg.textContent = 'Tap Start to watch again.', 900);
          }
        };
      });
    }
    function disableTap(){ beads.forEach(b=> b.onclick = null); }
    start.addEventListener('click', ()=> { playSequence(); });
    skip.addEventListener('click', ()=> location.href = 'gym.html');
    return;
  }

  // ---------- GYM (gym.html) ----------
  if (body.classList.contains('page-gym')) {
    const dumb = document.getElementById('dumbbell');
    const counter = document.getElementById('reps');
    const nextBtn = document.getElementById('gymNext');
    let reps = 0;
    dumb.addEventListener('click', ()=> {
      reps++; counter.textContent = reps;
      if(reps >= 18){ nextBtn.classList.remove('hidden'); localStorage.setItem('mystic_coins', String((parseInt(localStorage.getItem('mystic_coins')||'0',10)+3))); }
    });
    document.getElementById('gymSkip').addEventListener('click', ()=> location.href = 'emotional.html');
    nextBtn.addEventListener('click', ()=> location.href = 'emotional.html');
    return;
  }

  // ---------- EMOTIONAL (emotional.html) ----------
  if (body.classList.contains('page-emotion')) {
    document.getElementById('emotionNext').addEventListener('click', ()=> location.href = 'certificate.html');
    return;
  }

  // ---------- CERTIFICATE (certificate.html) ----------
  if (body.classList.contains('page-cert')) {
    const canvas = document.getElementById('certCanvas');
    const ctx = canvas.getContext('2d');
    // draw certificate (async img loads)
    function draw(){
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0,0,W,H);
      // parchment
      ctx.fillStyle = '#fff7f9'; ctx.fillRect(0,0,W,H);
      // border
      ctx.strokeStyle = '#d1a07a'; ctx.lineWidth = 12;
      roundRect(ctx,28,28,W-56,H-56,24,false,true);
      // title
      ctx.fillStyle = '#3b0d26'; ctx.font = '32px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('Certificate of Eternal Friendship', W/2, 120);
      // name
      ctx.font = '48px Georgia'; ctx.fillStyle = '#1f0416';
      ctx.fillText('SHUB', W/2, 220);
      // message
      ctx.font = '20px Inter, sans-serif'; ctx.fillStyle = '#3b2432';
      const msg = `This certifies that SHUB is now bound by the bracelet’s promise. The white beads and the single black bead are honored. White Monster energy recognized. Escape attempts will be voided.`;
      wrapText(ctx, msg, W/2, 280, W-260, 26);
      // place monster and bracelet if available
      const monster = new Image();
      const brace = new Image();
      let loaded = 0;
      monster.onload = ()=> { loaded++; tryDraw(); };
      monster.onerror = ()=> { loaded++; tryDraw(); };
      brace.onload = ()=> { loaded++; tryDraw(); };
      brace.onerror = ()=> { loaded++; tryDraw(); };
      monster.src = 'assets/monster.png';
      brace.src = 'assets/bracelet.png';
      function tryDraw(){
        // draw regardless; some images may fail
        if (monster.complete) ctx.drawImage(monster, W-340, H-340, 220, 320);
        if (brace.complete) ctx.drawImage(brace, W/2 - 110, H-200, 220, 220);
        // seal
        ctx.beginPath(); ctx.fillStyle = '#ffb3e6'; ctx.arc(140, H-160, 64, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4a1534'; ctx.font='16px Georgia'; ctx.fillText('OFFICIAL SEAL', 140, H-156);
        // save to localStorage (base64)
        const dataUrl = canvas.toDataURL('image/png');
        try { localStorage.setItem('shub_cert', dataUrl); } catch(e){ console.warn(e); }
      }
    }
    draw();

    document.getElementById('downloadCert').addEventListener('click', ()=> {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'Shub_certificate.png'; a.click();
    });
    return;
  }

  // ---------- WARNING page does not need JS ----------
});

// helpers
function roundRect(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  if(fill) ctx.fill(); if(stroke) ctx.stroke();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  ctx.textAlign = 'center';
  const words = text.split(' '); let line=''; let row=0;
  for(let n=0;n<words.length;n++){
    const testLine = line + words[n] + ' ';
    if(ctx.measureText(testLine).width > maxWidth && n>0){
      ctx.fillText(line, x, y + row*lineHeight);
      line = words[n] + ' ';
      row++;
    } else line = testLine;
  }
  ctx.fillText(line, x, y + row*lineHeight);
}
