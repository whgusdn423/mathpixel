// 수학 픽셀 스터디 · Firebase 버전 (GitHub Pages에서 실행)
// 학생 화면과 선생님(관리자) 화면이 모두 이 파일에 들어 있습니다.
import { qrSvg } from './qr.js';
import { CAT, BY, START_OWNED, START_EQ } from './catalog.js';

const C0 = window.MP_CONFIG || {};
const SDK = (C0.sdkBase || 'https://www.gstatic.com/firebasejs/12.2.1/').replace(/\/?$/, '/');
const DOMAIN = 'mathpixel.example.com', ADMIN = 'admin@' + DOMAIN, PWP = 'mps!';   // ※ 보안 규칙과 같아야 함
const DQ = 10, LVP = [0, 3, 5, 8], GRACE = 240000, PING = 180000, MARGIN = 5000, DAYCAP = 30;
const KST = 9 * 3600e3, DAY = 864e5;
const RC = { 일반: '#999', 희귀: '#27a8e8', 전설: '#e83e9c' }, RB = { 일반: '#ffd84d', 희귀: '#7ee0ff', 전설: '#ff9be6' };
const MOB = matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 900;

let A, Fs, auth, db;
let U = null, SID = null, CFG = null, QS = [], OFF = 0, tab = 'home', F = 'char', PV = {}, Q = null, tm = {}, RK = {};
let AFTER = [false, ''], JOINING = false, BUSY = false, lastSync = 0, lastPing = 0, warned = false, lastPick = -1;
const MP = window.MP = {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => Date.now() + OFF;
const dayIdx = t => Math.floor((t + KST) / DAY);
const wkey = t => 'w' + Math.floor((dayIdx(t) + 3) / 7);
const isWeekday = d => { const w = (d + 4) % 7; return w >= 1 && w <= 5; };
const restricted = t => { const h = Math.floor(((t + KST) % DAY) / 3600e3); return isWeekday(dayIdx(t)) && h >= 2 && h < 8; };
const ms = v => v == null ? 0 : typeof v === 'number' ? v : v.toMillis ? v.toMillis() : 0;
const homeUrl = () => C0.homeUrl || (location.origin + location.pathname);
const emailOf = (sid, g) => `${sid}-${g}@${DOMAIN}`;
const sidOf = email => String(email).split('@')[0].split('-')[0];
const normId = s => String(s || '').trim().toLowerCase();
const clsOf = id => { const s = String(id).slice(0, -2); return s ? s[0] + '-' + parseInt(s.slice(1) || '0', 10) : ''; };
const setKey = std => String(std).trim().replace(/\//g, '／').slice(0, 100) || '기타';
const sleep = t => new Promise(r => setTimeout(r, t));
const err = m => Object.assign(new Error(m), { code: 'mp/msg' });
const R = {
  user: id => Fs.doc(db, 'users', id), roster: id => Fs.doc(db, 'roster', id), nick: n => Fs.doc(db, 'nicks', n),
  ans: q => Fs.doc(db, 'answers', String(q)), set: s => Fs.doc(db, 'qsets', s), app: () => Fs.doc(db, 'config', 'app'), shop: () => Fs.doc(db, 'config', 'shop')
};
const TS = () => Fs.serverTimestamp();

// ---------- 알림, 오류 ----------
function toast(m, long) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d);
  setTimeout(() => d.remove(), long ? 4500 : 2600);
}
function msg(e) {
  const c = (e && e.code) || '';
  const M = {
    'auth/invalid-credential': '비밀번호가 틀렸어요.', 'auth/wrong-password': '비밀번호가 틀렸어요.', 'auth/invalid-login-credentials': '비밀번호가 틀렸어요.',
    'auth/user-not-found': '아직 가입 전이에요. 회원가입을 해 주세요.', 'auth/email-already-in-use': '이미 가입된 학번이에요. 로그인해 주세요.',
    'auth/too-many-requests': '요청이 너무 많아 잠시 막혔어요. 몇 분 뒤 다시 해 주세요.', 'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
    'auth/weak-password': '비밀번호가 너무 짧아요.', 'auth/operation-not-allowed': 'Firebase에서 이메일/비밀번호 로그인이 꺼져 있어요. (안내서 2단계)',
    'auth/invalid-api-key': 'config.js의 Firebase 설정값이 올바르지 않아요.', 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'config.js의 apiKey가 올바르지 않아요.',
    'permission-denied': '요청이 거절됐어요. 새로고침한 뒤 다시 해 주세요.', 'unavailable': '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.',
    'deadline-exceeded': '응답이 늦어요. 잠시 후 다시 해 주세요.', 'timeout': '응답이 늦어요. 인터넷 연결을 확인해 주세요.',
    'resource-exhausted': '오늘 무료 사용량을 다 썼어요. 선생님께 알려 주세요.', 'failed-precondition': '데이터베이스 설정이 끝나지 않았어요. (안내서 2단계)',
    'not-found': '데이터베이스를 찾을 수 없어요. (안내서 2단계)'
  };
  return M[c] || (e && e.message) || '알 수 없는 오류가 났어요.';
}
function fail(e, where) { console.error(where || '', e); const tag = where || (e && e.op); toast(msg(e) + (tag && e && e.code === 'permission-denied' ? ` [${tag}]` : ''), true); }
const within = (p, t = 20000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r({ code: 'timeout' }), t))]);
async function run(fn) {   // 버튼 두 번 누르기 방지 + 오류 표시
  if (BUSY) return; BUSY = true; document.body.classList.add('busy');
  try { return await fn(); } catch (e) { fail(e); } finally { BUSY = false; document.body.classList.remove('busy'); }
}
function fatal(m, e) {
  if (e) console.error(e);
  $('#app').innerHTML = `<div class="box"><h2>🧮 수학 픽셀 스터디</h2><p>${esc(m)}</p><button onclick="location.reload()">새로고침</button></div>`;
}

// ---------- 시작 ----------
async function boot() {
  const k = C0.firebase && C0.firebase.apiKey;
  if (!k || /여기|YOUR|붙여/.test(k)) return fatal('아직 config.js에 Firebase 설정값이 들어 있지 않아요. 안내서 5단계를 따라 config.js를 고쳐 주세요.');
  try {
    const [fa, fu, ff] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    A = fu; Fs = ff;
    const app = fa.initializeApp(C0.firebase);
    auth = A.getAuth(app); db = Fs.getFirestore(app);
  } catch (e) { return fatal('Firebase에 연결하지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.', e); }
  await Promise.race([syncClock(), sleep(3000)]);
  A.onAuthStateChanged(auth, user => { onAuth(user).catch(e => fail(e)); });
}
// 휴대폰 시계가 틀려도 날짜 계산이 맞도록 서버 시간과 비교
async function syncClock() {
  try {
    const t0 = Date.now(), r = await fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store' }), t1 = Date.now();
    const d = Date.parse(r.headers.get('date') || '');
    if (d) { const off = d + 500 - (t0 + t1) / 2; OFF = Math.abs(off) > 2500 ? off : 0; }
  } catch (e) { /* 그대로 기기 시간 사용 */ }
}
async function onAuth(user) {
  if (JOINING) return;
  if (!user) { U = null; SID = null; const a = AFTER; AFTER = [false, '']; return login(a[0], a[1]); }
  if (user.email === ADMIN) return adminHome();
  SID = sidOf(user.email);
  await enterGame();
}
async function enterGame() {
  $('#app').innerHTML = '<div class="box">불러오는 중… ⏳</div>';
  const [us, cs] = await within(Promise.all([Fs.getDoc(R.user(SID)), Fs.getDoc(R.app())]));
  if (!us.exists() || us.data().uid !== auth.currentUser.uid) {
    await A.signOut(auth);
    toast('선생님이 비밀번호를 초기화했거나 가입 정보가 없어요. 회원가입을 다시 해 주세요.', true);
    return;
  }
  U = us.data(); CFG = cs.exists() ? cs.data() : { std: [], sets: {}, classes: [] }; lastSync = Date.now();
  await housekeeping();
  draw();
}
async function refreshMe() {
  const s = await within(Fs.getDoc(R.user(SID)));
  if (s.exists()) { U = s.data(); lastSync = Date.now(); }
}
// 남아 있는 채점, 새벽 2시 경고 처리
async function housekeeping() {
  try { if (U.cur && U.cur.c) { const r = await gradeCur(); if (r) toast(`지난번 토벌 결과를 반영했어요 ${r.ok ? '+' + r.pts + 'P' : '(실패)'}`); } }
  catch (e) { console.warn('grade', e); }
  try { await curfewCheck(); } catch (e) { console.warn('curfew', e); }
  try {   // 신호가 끊긴 채 오래 켜져 있던 타이머는 일시정지 (마지막 신호 + 4분까지만 인정)
    if (U.st === 'run' && now() - ms(U.ping) > GRACE) { await pauseNow(); toast('자리를 비운 사이 타이머가 일시정지됐어요.', true); }
  } catch (e) { console.warn('pause', e); }
}

// ---------- 로그인 화면 ----------
function login(signup, id) {
  const url = homeUrl();
  $('#app').innerHTML = `<div class="box"><h2>🧮 수학 픽셀 스터디</h2><h3>${signup ? '회원가입' : '로그인'}</h3>
  <input id="id" placeholder="학번" inputmode="numeric" autocomplete="username" value="${esc(id || '')}">
  ${signup ? '<input id="nick" placeholder="닉네임 (8자 이내)" maxlength="8">' : ''}
  <input id="pw" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="${signup ? '비밀번호 (4자 이상)' : '비밀번호'}">
  ${signup ? '<input id="pw2" type="password" autocomplete="new-password" placeholder="비밀번호 확인">' : ''}
  ${signup ? `<button onclick="MP.signup()">가입하고 시작</button><button onclick="MP.login(false)" style="background:#fff">← 로그인으로</button>
    <p class="hint">선생님이 등록해 둔 학번만 가입할 수 있어요. 예전 기록이 있으면 그대로 이어져요.</p>`
    : `<button onclick="MP.doLogin()">로그인</button><button onclick="MP.login(true)" style="background:var(--bl)">회원가입</button>`}
  </div>
  <div class="box qrbox"><div class="qr" onclick="MP.bigQr()">${qrSvg(url, { size: 132 })}</div>
  <div><b>📱 친구도 바로 접속!</b><br><small>휴대폰 카메라로 QR을 찍으면 이 화면이 열려요.</small><br><small class="url">${esc(url)}</small><br>
  <button onclick="MP.bigQr()">QR 크게 보기</button></div></div>
  <p class="hint" style="text-align:center">홈 화면에 추가하면 앱처럼 쓸 수 있어요 (브라우저 메뉴 → 홈 화면에 추가)</p>`;
  $('#pw').addEventListener('keydown', e => { if (e.key === 'Enter' && !signup) MP.doLogin(); });
}
MP.login = signup => login(signup, $('#id') ? $('#id').value : '');
MP.bigQr = () => {
  const o = document.createElement('div'); o.className = 'qrfull'; o.onclick = () => o.remove();
  o.innerHTML = `<div>${qrSvg(homeUrl(), { size: Math.min(innerWidth, innerHeight) * 0.72 })}<p>수학 픽셀 스터디<br><small>${esc(homeUrl())}</small></p><p><small>화면을 누르면 닫혀요</small></p></div>`;
  document.body.appendChild(o);
};
MP.doLogin = () => run(async () => {
  const id = normId($('#id').value), pw = $('#pw').value;
  if (!id || !pw) throw err('학번과 비밀번호를 입력하세요.');
  if (id === 'admin') {
    try { await A.signInWithEmailAndPassword(auth, ADMIN, PWP + pw); }
    catch (e) { throw /credential|password|user-not-found/.test(e.code) ? err('관리자 비밀번호가 틀렸어요. (처음이라면 회원가입 화면에서 학번 칸에 admin을 넣어 관리자 계정을 만드세요)') : e; }
    return;
  }
  const r = await within(Fs.getDoc(R.roster(id)));
  if (!r.exists()) throw err('등록되지 않은 학번이에요. 선생님께 문의하세요.');
  if (!r.data().c) { toast('아직 가입 전이에요. 회원가입을 해 주세요.'); return login(true, id); }
  await A.signInWithEmailAndPassword(auth, emailOf(id, r.data().g || 0), PWP + pw);
});
MP.signup = () => run(async () => {
  const id = normId($('#id').value), nick = $('#nick').value.trim(), pw = $('#pw').value, pw2 = $('#pw2').value;
  if (id === 'admin') return adminCreate(pw, pw2);
  if (!/^[0-9a-z]{1,20}$/.test(id)) throw err('학번을 확인해 주세요.');
  if (!nick || nick.length > 8) throw err('닉네임은 1~8자로 정해 주세요.');
  if (/[\/.#$\[\]]/.test(nick) || /^__.*__$/.test(nick)) throw err('닉네임에 / . # $ [ ] 는 쓸 수 없어요.');
  if (pw.length < 4) throw err('비밀번호는 4자 이상이에요.');
  if (pw !== pw2) throw err('비밀번호 확인이 서로 달라요.');
  const r = await within(Fs.getDoc(R.roster(id)));
  if (!r.exists()) throw err('등록되지 않은 학번이에요. 선생님께 문의하세요.');
  const ro = r.data();
  if (ro.c) throw err('이미 가입된 학번이에요. 로그인해 주세요. 비밀번호를 잊었다면 선생님께 초기화를 요청하세요.');
  const em = emailOf(id, ro.g || 0);
  JOINING = true;
  try {
    try { await A.createUserWithEmailAndPassword(auth, em, PWP + pw); }
    catch (e) {   // 이미 계정이 있으면(가입하다 멈춘 경우) 같은 비밀번호로 로그인해서 이어서 가입
      if (/weak-password|network|too-many|operation-not-allowed|api-key|invalid-email/.test(e.code || '')) throw e;
      try { await A.signInWithEmailAndPassword(auth, em, PWP + pw); }
      catch (e2) { throw err('이 학번은 가입하다 멈춘 기록이 있어요. 처음에 정한 비밀번호로 다시 해 보거나, 선생님께 비밀번호 초기화를 요청하세요.'); }
    }
    const uid = auth.currentUser.uid, us = await within(Fs.getDoc(R.user(id))), b = Fs.writeBatch(db);
    let used = nick;
    const nickFree = async () => { if ((await Fs.getDoc(R.nick(nick))).exists()) throw err('이미 쓰는 닉네임이에요. 다른 닉네임으로 해 주세요.'); };
    if (us.exists()) {
      const d = us.data();
      if (d.uid) throw err('이미 가입된 학번이에요. 로그인해 주세요.');
      if (d.nick) { used = d.nick; b.update(R.user(id), { op: 'claim', uid }); }
      else { await nickFree(); b.update(R.user(id), { op: 'claim', uid, nick }); b.set(R.nick(nick), { sid: id }); }
    } else {
      await nickFree();
      b.set(R.user(id), blankUser({ uid, nick, cls: ro.cls || '' }));
      b.set(R.nick(nick), { sid: id });
    }
    b.update(R.roster(id), { c: true });
    try { await within(b.commit()); }
    catch (e) { throw e.code === 'permission-denied' ? err('가입을 마치지 못했어요. 닉네임이 이미 쓰이고 있을 수 있어요. 다른 닉네임으로 다시 해 주세요.') : e; }
    JOINING = false; SID = id;
    if (used !== nick) toast(`예전 닉네임 '${used}'을(를) 그대로 써요.`, true);
    await enterGame();
  } catch (e) {
    AFTER = [true, id];
    if (auth.currentUser) await A.signOut(auth).catch(() => {});
    JOINING = false;
    login(true, id);
    throw e;
  }
});
async function adminCreate(pw, pw2) {
  if (pw.length < 8) throw err('관리자 비밀번호는 8자 이상으로 정해 주세요.');
  if (pw !== pw2) throw err('비밀번호 확인이 서로 달라요.');
  try { await A.createUserWithEmailAndPassword(auth, ADMIN, PWP + pw); }
  catch (e) { throw e.code === 'auth/email-already-in-use' ? err('이미 관리자 계정이 있어요. 로그인 화면에서 admin으로 로그인하세요.') : e; }
}
function blankUser(o) {
  return { uid: null, nick: '', cls: '', study: 0, math: 0, spent: 0, all: 0, warn: 0, owned: [...START_OWNED], eq: { ...START_EQ },
    st: '', run: null, ping: null, acc: 0, qd: 0, qn: 0, ql: 1, cur: null, sd: 0, sp: 0, op: 'join', ...o };
}
MP.logout = () => run(async () => { clearInterval(tm.i); U = null; await A.signOut(auth); });

// ---------- 저장 도우미 ----------
async function save(fields, local) {
  try { await within(Fs.updateDoc(R.user(SID), fields)); }
  catch (e) { if (e && typeof e === 'object') try { e.op = fields.op; } catch (x) {} throw e; }
  Object.assign(U, local || fields);
}
// 날짜·주가 바뀌는 순간에 거절되면 잠시 뒤 다시 계산해서 한 번 더 시도
async function savePts(build, still = () => true) {
  try { const [f, l] = build(now()); return await save(f, l); }
  catch (e) {
    if (e.code !== 'permission-denied') throw e;
    await sleep(2500); await refreshMe();
    if (!still()) return;
    const [f, l] = build(now()); return await save(f, l);
  }
}

// ---------- 화면 틀 ----------
const bal = () => U.study + U.math - U.spent;
function draw() {
  PV = {};
  const N = [['home', '🏠홈'], ['study', '⏱공부'], ['quiz', '⚔토벌'], ['rank', '🏆랭킹'], ['shop', '🎨꾸미기']];
  $('#app').innerHTML = `<div class="box top"><span><b>${esc(U.nick)}</b> (${esc(U.cls)}) 💰${bal()}P ⚠️${U.warn}/3</span>
    <span><button onclick="document.body.classList.toggle('pc')">📱/🖥</button><button onclick="MP.logout()">로그아웃</button></span></div>
    <div id="main"></div><nav>${N.map(a => `<button class="${tab === a[0] ? 'on' : ''}" onclick="MP.go('${a[0]}')">${a[1]}</button>`).join('')}</nav>`;
  V[tab]();
}
MP.go = t => { tab = t; draw(); };
const V = {};
function ch(eq) {
  const c = BY[eq.char] || { g: '2', rar: '일반' }, bg = BY[eq.bg], cl = BY[eq.cloth], sp = BY[eq.shape || 'sh0'];
  return `<div class="ch" style="background:${bg ? bg.g : '#bde7ff'}"><div class="bw"><div class="bd" style="background:${RB[c.rar]};${sp ? sp.g : ''}">${cl ? `<div class="cl" style="background:${cl.g}"></div>` : ''}</div></div><div class="gy">${c.g}</div><span class="fc ey" style="left:51px"></span><span class="fc ey" style="left:83px"></span><span class="fc nz"></span><span class="fc mo"></span>${eq.hat && BY[eq.hat] ? `<i class="hat">${BY[eq.hat].g}</i>` : ''}${eq.glasses && BY[eq.glasses] ? `<i class="gl">${BY[eq.glasses].g}</i>` : ''}${eq.prop && BY[eq.prop] ? `<i class="pr">${BY[eq.prop].g}</i>` : ''}</div>`;
}
V.home = () => {
  $('#main').innerHTML = `<div class="box">${ch(U.eq || {})}<p style="text-align:center">공부 ${U.study}P + 문제 ${U.math}P<br>쓸 수 있는 포인트 <b>${bal()}P</b></p></div>`;
};

// ---------- 공부 타이머 ----------
const spToday = () => U.sd === dayIdx(now()) ? U.sp : 0;
const shownSec = () => (U.acc || 0) + (U.st === 'run' ? Math.max(0, (now() - ms(U.run)) / 1000) : 0);
// 서버가 인정하는 범위 안에서 조금 적게 계산 (마지막 신호 + 4분까지)
const segSec = (cap = Infinity) => U.st !== 'run' ? 0 : Math.max(0, Math.floor((Math.min(cap, now() - MARGIN, ms(U.ping) + GRACE - MARGIN) - ms(U.run)) / 1000));
V.study = () => {
  const can = MOB && !restricted(now());
  $('#main').innerHTML = `<div class="box"><h3>⏱ 공부 타이머</h3><p>10분마다 1P · 오늘 ${spToday()}/${DAYCAP}P<br>다른 앱으로 나가면 자동 일시정지돼요.<br>평일 02:00~08:00는 사용할 수 없고, 02:00에 켜져 있으면 경고 1회예요.</p>
  ${!MOB ? '<p>📵 타이머는 휴대폰에서만 쓸 수 있어요.</p>' : restricted(now()) ? '<p>🌙 지금은 사용할 수 없는 시간이에요.</p>' : ''}
  ${U.st ? '<button onclick="MP.openTimer()">타이머 화면 열기</button>' : `<button ${can ? '' : 'disabled'} onclick="MP.tstart()">▶ 공부 시작</button>`}</div>`;
};
async function startNow() {
  const t0 = now();
  await save({ op: 'tstart', st: 'run', run: TS(), ping: TS(), acc: U.st === 'pause' ? U.acc : 0 });
  Object.assign(U, { run: now(), ping: t0 }); lastPing = Date.now();
}
MP.tstart = () => run(async () => {
  if (U.st === 'run') return openTimer();
  if (restricted(now())) throw err('평일 02:00~08:00에는 타이머를 쓸 수 없어요.');
  await startNow();
  openTimer();
});
function openTimer() {
  let o = $('#tm'); if (!o) { o = document.createElement('div'); o.id = 'tm'; document.body.appendChild(o); }
  o.style.display = 'block';
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
  drawTm(); clearInterval(tm.i); tm.i = setInterval(tick, 1000);
}
MP.openTimer = openTimer;
function drawTm() {
  const o = $('#tm'); if (!o) return;
  const r = U.st === 'run';
  o.innerHTML = `<p>${r ? '공부 중 📖' : '일시정지 ⏸'}</p><div id="tt" class="big"></div><p>오늘 ${spToday()}/${DAYCAP}P</p>${r ? '<button onclick="MP.tpause()">⏸ 일시정지</button>' : '<button onclick="MP.tstart()">▶ 계속</button>'}<button onclick="MP.tstop()">⏹ 공부 끝</button><br><button onclick="MP.closeTm()">닫기</button>`;
  tick();
}
function tick() {
  const s = shownSec(), e = $('#tt');
  if (e) e.textContent = [3600, 60, 1].map((d, i) => String(Math.floor(s / d) % (i ? 60 : 100)).padStart(2, '0')).join(':');
  if (U && U.st && restricted(now()) && !warned) { warned = true; curfewCheck().catch(e => fail(e)).finally(() => { warned = false; }); }
}
async function pauseNow() {
  const add = segSec(), t0 = now();
  await save({ op: 'tpause', st: 'pause', acc: (U.acc || 0) + add, ping: TS() }, { st: 'pause', acc: (U.acc || 0) + add, ping: t0 });
}
MP.tpause = () => run(async () => { if (U.st === 'run') await pauseNow(); drawTm(); });
function stopFields(t, warnIt) {
  const total = (U.acc || 0) + segSec(warnIt ? warnIt : Infinity), today = dayIdx(t), base = U.sd === today ? U.sp : 0, w = wkey(t);
  const pts = Math.max(0, Math.min(Math.floor(total / 600), DAYCAP - base));
  const f = { op: warnIt ? 'twarn' : 'tstop', st: '', acc: 0, study: U.study + pts, all: U.all + pts, sd: today, sp: base + pts, [w]: (U[w] || 0) + pts };
  return { f, pts, total };
}
MP.tstop = () => run(async () => {
  if (!U.st) return closeTm();
  let res = null;
  try { await savePts(t => { res = stopFields(t); return [res.f]; }, () => { if (!U.st) res = null; return !!U.st; }); }
  catch (e) {
    if (e.code !== 'permission-denied') throw e;
    await refreshMe(); res = null;
    if (U.st) {   // 끝까지 거절되면 포인트 없이라도 타이머는 끝냄
      const t = now();
      await save({ op: 'tstop', st: '', acc: 0, study: U.study, all: U.all, sd: dayIdx(t), sp: U.sd === dayIdx(t) ? U.sp : 0 });
      toast('공부 시간을 확인하지 못해 이번에는 포인트 없이 마쳤어요.', true);
    }
  }
  closeTm();
  if (res) alert(`수고했어요! ${Math.floor(res.total / 60)}분 공부, +${res.pts}P`);
  draw();
});
MP.closeTm = closeTm;
function closeTm() { clearInterval(tm.i); const o = $('#tm'); if (o) o.style.display = 'none'; if (tab === 'study' && U) draw(); }
// 평일 02:00가 지나도록 켜져 있던 타이머 → 02:00까지만 인정하고 경고 1회
function curfewAt() {
  if (!U || !U.st) return 0;
  const t = now(), from = U.st === 'run' ? ms(U.run) : ms(U.ping);
  for (let d = dayIdx(from); d <= dayIdx(t); d++) {
    const t2 = d * DAY - KST + 2 * 3600e3;
    if (t2 > from && t2 <= t && isWeekday(d)) return t2;
  }
  return restricted(t) ? t : 0;
}
async function curfewCheck() {
  const at = curfewAt(); if (!at) return;
  const nw = (U.warn || 0) + 1;
  await savePts(t => {
    if (nw === 3) return [{ op: 'twarn', st: '', acc: 0, warn: 3, study: 0, all: U.math }];
    const r = stopFields(t, at); r.f.warn = nw; return [r.f];
  }, () => !!U.st);
  clearInterval(tm.i); const o = $('#tm'); if (o) o.style.display = 'none';
  alert('⚠️ 02:00에 타이머가 켜져 있어서 자동 종료되고 경고 ' + nw + '회가 됐어요.' + (nw === 3 ? '\n경고 3회: 공부 시간 포인트가 0점이 되었어요.' : ''));
  if ($('nav')) draw();
}
async function doPing() {
  if (!U || U.st !== 'run' || document.hidden) return;
  if (restricted(now())) return curfewCheck();
  if (now() - ms(U.ping) > GRACE - 15000) {   // 신호가 끊겼던 경우: 끊기기 전까지만 인정하고 이어서 다시 시작
    try { await pauseNow(); await startNow(); } catch (e) { await refreshMe().catch(() => {}); }
    if ($('#tm') && $('#tm').style.display === 'block') drawTm();
    return;
  }
  const t0 = now(); lastPing = Date.now();
  try { await save({ op: 'tping', ping: TS() }, { ping: t0 }); }
  catch (e) { if (e.code === 'permission-denied') { await refreshMe().catch(() => {}); if ($('#tm') && $('#tm').style.display === 'block') drawTm(); } }
}
MP._ping = () => doPing(); MP._sync = () => syncClock();
setInterval(() => {
  if (!U || !U.st || document.hidden) return;
  if (restricted(now())) { if (!warned) { warned = true; curfewCheck().catch(e => fail(e)).finally(() => { warned = false; }); } return; }
  if (U.st === 'run' && Date.now() - lastPing >= PING - 5000) doPing();
}, 15000);
document.addEventListener('visibilitychange', async () => {
  if (!U || !SID) return;
  if (document.hidden) { if (U.st === 'run') pauseNow().catch(e => console.warn(e)); return; }
  try {
    if (U.st || Date.now() - lastSync > 300000) {
      await refreshMe(); await housekeeping();
      if ($('#tm') && $('#tm').style.display === 'block') { if (U.st) drawTm(); else closeTm(); }
      else if ($('nav') && !Q) draw();
    }
  } catch (e) { console.warn(e); }
});

// ---------- 토벌 (문제) ----------
const MG = {
  1: ['................', '................', '.....KKKKKK.....', '....KBBBBBBK....', '...KBBHHBBBBK...', '..KBBHBBBBBBBK..', '..KBBBBBBBBBBK..', '.KBBBBBBBBBBBBK.', '.KBBBBBBBBBBBBK.', '.KBBBBBBBBBBBBK.', '..KDBBBBBBBBDK..', '...KDDDDDDDDK...', '....KKKKKKKK....'],
  2: ['....KKKKKKKK....', '...KBBBBBBBBK...', '..KBBBBBBBBBBK..', '..KBBBBBBBBBBK..', '..KBBBBBBBBBBK..', '..KBBBBBBBBBBK..', '..KBBBBBBBBBBK..', '...KBBBDDBBBK...', '....KBBBBBBK....', '....KBKBBKBK....', '....KBBBBBBK....', '.....KKKKKK.....'],
  3: ['.....KKKKKK.....', '....KBBBBBBK....', '...KBBBBBBBBK...', '...KBBBBBBBBK...', '...KKKKKKKKKK...', '...KSSSSSSSSK...', '...KSSSSSSSSK...', '...KSSSSSSSSK...', '....KSSSSSSK....', '..KKBBBBBBBBKK..', '.KBBBBBBBBBBBBK.', '.KBBBBBBBBBBBBK.', '.KBBBBDDDDBBBBK.', '..KBBBBBBBBBBK..', '..KKDDDKKDDDKK..', '...KDDK..KDDK...', '...KKKK..KKKK...']
};
const ME = { 1: { n: [[5, 7], [9, 7]], x: [[4, 6], [9, 6]] }, 2: { n: [[4, 4], [10, 4]], x: [[3, 4], [10, 4]] }, 3: { n: [[5, 5], [9, 5]], x: [[4, 5], [9, 5]] } };
const MPAL = {
  1: [['#6fdc6f', '#3fa83f', '#c9ffc9'], ['#6ec6ff', '#3b8fd4', '#d4efff'], ['#ff8fb8', '#d4608a', '#ffd4e4'], ['#ffd84d', '#d4a900', '#fff2a8'], ['#c49bff', '#8f62d4', '#e8d4ff']],
  2: [['#f2f0e6', '#c9c6b4'], ['#cfe8ff', '#9bbbd9'], ['#ffd9d9', '#d9a3a3'], ['#fff0b3', '#d9c570'], ['#e0d4ff', '#b3a3d9']],
  3: [['#e05050', '#a02c2c'], ['#4f8fe0', '#2c5ea0'], ['#4fb86a', '#2c8040'], ['#9aa0aa', '#5f6570'], ['#b77ad9', '#7e4aa0']]
};
const MN = { 1: '슬라임', 2: '해골', 3: '병사' };
function mon(lv, ci, dead) {
  const g = MG[lv] || MG[1], p = (MPAL[lv] || MPAL[1])[ci % 5], e = ME[lv] || ME[1], ink = '#2b2b3a', col = { K: ink, B: p[0], D: p[1], H: p[2] || p[0], S: '#ffd9b3' };
  let r = '';
  g.forEach((row, y) => [...row].forEach((c, x) => { if (col[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col[c]}"/>`; }));
  if (dead) e.x.forEach(([x, y]) => [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].forEach(([a, b]) => { r += `<rect x="${x + a}" y="${y + b}" width="1" height="1" fill="${ink}"/>`; }));
  else e.n.forEach(([x, y]) => { r += `<rect x="${x}" y="${y}" width="2" height="2" fill="${ink}"/>`; });
  return `<svg class="mon" viewBox="0 0 16 ${g.length}" width="96" height="${g.length * 6}" shape-rendering="crispEdges">${r}</svg>`;
}
function cleanSvg(s) {
  s = String(s || '').trim(); if (!/^<svg[\s>]/i.test(s)) return '';
  return s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '').replace(/(xlink:)?href\s*=\s*("[^"]*"|'[^']*')/gi, '');
}
async function loadQS(all) {
  const sets = (CFG && CFG.sets) || {}, std = (CFG && CFG.std) || [], out = [];
  const want = Object.keys(sets).filter(k => all || !std.length || std.includes(sets[k].n));
  await Promise.all(want.map(async k => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('mpqs_' + k) || 'null'); } catch (e) {}
    if (!c || c.v !== sets[k].v) {
      const s = await within(Fs.getDoc(R.set(k))); if (!s.exists()) return;
      const d = s.data(); c = { v: d.v, std: d.std, qs: d.qs || [] };
      try { localStorage.setItem('mpqs_' + k, JSON.stringify(c)); } catch (e) {}
    }
    c.qs.forEach(q => out.push({ ...q, std: c.std }));
  }));
  if (!all) QS = out;
  return out;
}
const qState = () => { const same = U.qd === dayIdx(now()); return { n: same ? U.qn : 0, lv: same ? U.ql : 1 }; };
function seenList() { try { return JSON.parse(localStorage.getItem('mpseen_' + SID) || '[]'); } catch (e) { return []; } }
function markSeen(id) { const s = seenList().filter(x => x !== id); s.push(id); try { localStorage.setItem('mpseen_' + SID, JSON.stringify(s.slice(-60))); } catch (e) {} }
function pickQ(tl) {
  const seen = seenList(), last = seen[seen.length - 1];
  let pool = [];
  for (let d = 0; d < 3 && !pool.length; d++) pool = QS.filter(q => q.lv === tl - d && !seen.includes(q.id));
  if (!pool.length) pool = QS.filter(q => q.lv <= tl && q.id !== last);
  if (!pool.length) pool = QS.filter(q => q.lv <= tl);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
function orderOf(id) {
  const k = 'mpord_' + SID + '_' + id;
  try { const o = JSON.parse(sessionStorage.getItem(k) || 'null'); if (o) return o; } catch (e) {}
  const o = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  try { sessionStorage.setItem(k, JSON.stringify(o)); } catch (e) {}
  return o;
}
V.quiz = () => {
  Q = null;
  const st = qState(), pend = U.cur && U.cur.c === 0;
  $('#main').innerHTML = `<div class="box"><h3>⚔ 오늘의 토벌</h3><p>하루 최대 ${DQ}마리! 맞히면 더 강한 몬스터, 틀리면 더 약한 몬스터가 나와요.<br>★ 슬라임 3P · ★★ 해골 5P · ★★★ 병사 8P</p><p>오늘 남은 토벌: <b id="qleft">${DQ - st.n}</b>/${DQ} · 현재 <span id="qlv">${'★'.repeat(st.lv)}</span></p><button onclick="MP.nextQ()">${pend ? '하던 토벌 이어서' : '토벌 시작'}</button></div><div id="qa"></div>`;
};
MP.nextQ = () => run(async () => {
  if (!QS.length) await loadQS();
  if (U.cur && U.cur.c) { await gradeCur(); }
  if (U.cur && U.cur.c === 0) {
    let q = QS.find(x => x.id === U.cur.q) || (await loadQS(true)).find(x => x.id === U.cur.q);
    if (!q) {   // 선생님이 지운 문제
      await save({ op: 'qdrop', cur: null }).catch(() => {});
      if (U.cur) throw err('풀던 문제를 찾을 수 없어요. 선생님께 알려 주세요.');
    } else return showQ(q);
  }
  const st = qState();
  if (st.n >= DQ) throw err(`오늘의 토벌 ${DQ}마리를 모두 마쳤어요! 내일 또 만나요.`);
  const q = pickQ(st.lv);
  if (!q) throw err('지금 풀 수 있는 문제가 없어요. 선생님께 알려 주세요.');
  await savePts(t => {
    const d = dayIdx(t), same = U.qd === d;
    return [{ op: 'qshow', cur: { q: q.id, lv: q.lv, c: 0 }, qd: d, qn: same ? U.qn + 1 : 1, ql: same ? U.ql : 1 }];
  }, () => !U.cur);
  markSeen(q.id);
  showQ(q);
});
function showQ(q) {
  Q = { ...q, order: orderOf(q.id), ci: Math.floor(Math.random() * 5), t0: Date.now() };
  const box = $('#qa'); if (!box) return;
  const ql = $('#qleft'); if (ql) ql.textContent = DQ - U.qn;
  box.innerHTML = `<div class="box"><p>${U.qn}/${DQ}번째 · ${'★'.repeat(q.lv)} ${esc(q.std || '')}</p>${q.fig ? `<div class="fig">${cleanSvg(q.fig)}</div>` : ''}<p class="qt"><b>${esc(q.text)}</b></p>${Q.order.map((o, i) => `<button class="cb" onclick="MP.ans(${i})">${i + 1}. ${esc(q.ch[o])}</button>`).join('')}<div id="mon" class="mon-wrap">${mon(q.lv, Q.ci, false)}<br><small>${MN[q.lv] || ''}</small></div></div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function gradeCur() {
  const c = U.cur; if (!c || !c.c) return null;
  const a = (await within(Fs.getDoc(R.ans(c.q)))).data();
  const ok = c.c === a.ans, pts = ok ? LVP[c.lv] : 0, nl = ok ? Math.min(3, c.lv + 1) : Math.max(1, c.lv - 1);
  await savePts(t => {
    const f = { op: 'qgrade', cur: null, ql: nl };
    if (pts) { const w = wkey(t); f.math = U.math + pts; f.all = U.all + pts; f[w] = (U[w] || 0) + pts; }
    return [f];
  }, () => !!(U.cur && U.cur.c));
  return { ok, ans: a.ans, pts, nl, ex: a.ex || '' };
}
MP.ans = i => run(async () => {
  if (!Q || Q.done || !U.cur) return;
  const bs = [...document.querySelectorAll('.cb')]; bs.forEach(b => { b.disabled = true; });
  const c = Q.order[i] + 1;
  try { await save({ op: 'qans', cur: { q: Q.id, lv: Q.lv, c } }); }
  catch (e) { bs.forEach(b => { b.disabled = false; }); throw e; }
  const r = await gradeCur(); Q.done = true;
  const right = Q.order.indexOf(r.ans - 1);
  if (bs[right]) bs[right].classList.add('ok'); if (!r.ok && bs[i]) bs[i].classList.add('no');
  if (r.ok) { const m = $('#mon'); m.classList.add('dead'); m.innerHTML = mon(Q.lv, Q.ci, true) + `<br><small>${MN[Q.lv]} 처치!</small>`; }
  const wait = !r.ok && i === lastPick && Date.now() - Q.t0 < 5000 ? 5 : 0; lastPick = i;
  const left = DQ - U.qn;
  const mv = r.nl > Q.lv ? '⬆ 다음은 더 강한 몬스터예요' : r.nl < Q.lv ? '⬇ 다음은 더 약한 몬스터예요' : '같은 강함의 몬스터가 나와요';
  $('#qa').lastElementChild.insertAdjacentHTML('beforeend', `<p>${r.ok ? `⭕ 처치 성공! +${r.pts}P` : `❌ 반격당했어요… 정답은 ${right + 1}번`}<br>${esc(r.ex)}</p><p>${left > 0 ? mv + ' · 남은 토벌 ' + left + '번' : '🎉 오늘의 토벌을 모두 마쳤어요!'}</p>${wait ? `<p id="wt">⏳ 같은 번호만 빠르게 누르면 ${wait}초 쉬어요</p>` : ''}<button id="nx" onclick="MP.nextQ()" ${wait || left <= 0 ? 'disabled' : ''}>다음 몬스터</button>`);
  const lvEl = $('#qlv'); if (lvEl) lvEl.textContent = '★'.repeat(U.ql || 1);
  const top = $('.top span'); if (top) top.innerHTML = `<b>${esc(U.nick)}</b> (${esc(U.cls)}) 💰${bal()}P ⚠️${U.warn}/3`;
  if (wait) {
    let w = wait;
    const iv = setInterval(() => { w--; const nx = $('#nx'), wt = $('#wt'); if (!nx) { clearInterval(iv); return; } if (w <= 0) { clearInterval(iv); if (left > 0) nx.disabled = false; wt && wt.remove(); } else if (wt) wt.textContent = '⏳ ' + w + '초'; }, 1000);
  }
});

// ---------- 랭킹 ----------
V.rank = () => {
  $('#main').innerHTML = `<div class="box">${[['all', '전체'], ['class', '우리 반'], ['team', '학급 대항'], ['week', '주간']].map(a => `<button onclick="MP.rk('${a[0]}')">${a[1]}</button>`).join('')}</div><div id="rk" class="box">불러오는 중… ⏳</div>`;
  MP.rk('all');
};
const cnt = async q => (await within(Fs.getCountFromServer(q))).data().count;
MP.rk = m => run(async () => {
  const el = $('#rk'); if (!el) return;
  const hit = RK[m];
  if (hit && Date.now() - hit.t < 180000) { el.innerHTML = hit.h; return; }
  el.innerHTML = '불러오는 중… ⏳';
  const users = Fs.collection(db, 'users');
  let h;
  if (m === 'team') {
    const cl = ((CFG && CFG.classes) || []).filter(Boolean);
    const T = (await Promise.all(cl.map(async c => {
      const a = (await within(Fs.getAggregateFromServer(Fs.query(users, Fs.where('cls', '==', c)), { s: Fs.sum('all'), n: Fs.count() }))).data();
      return { cls: c, sum: a.s || 0, n: a.n || 0 };
    }))).filter(o => o.n > 0).map(o => ({ ...o, avg: Math.round(o.sum / o.n * 10) / 10 })).sort((a, b) => b.avg - a.avg);
    h = `<table><tr><th>순위</th><th>학급</th><th>인당 평균</th><th>합계</th></tr>${T.map((x, i) => `<tr class="${x.cls === U.cls ? 'me' : ''}"><td>${i + 1}</td><td>${esc(x.cls)}</td><td>${x.avg}P</td><td>${x.sum}P (${x.n}명)</td></tr>`).join('') || '<tr><td>기록이 없어요.</td></tr>'}</table><p>인당 평균 포인트로 순위를 매겨요. · 3분마다 갱신</p>`;
  } else {
    const k = m === 'week' ? wkey(now()) : 'all';
    let L, my = null;
    if (m === 'class') {
      L = (await within(Fs.getDocs(Fs.query(users, Fs.where('cls', '==', U.cls))))).docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.all || 0) - (a.all || 0));
      const i = L.findIndex(x => x.id === SID); if (i >= 0) my = { r: i + 1, pts: L[i].all };
      L = L.slice(0, 30);
    } else {
      L = (await within(Fs.getDocs(Fs.query(users, Fs.orderBy(k, 'desc'), Fs.limit(20))))).docs.map(d => ({ id: d.id, ...d.data() }));
      const mine = U[k] || 0;
      if (mine > 0) my = { r: (await cnt(Fs.query(users, Fs.where(k, '>', mine)))) + 1, pts: mine };
    }
    h = `<table>${L.map((x, j) => `<tr class="${x.id === SID ? 'me' : ''}"><td>${j + 1}</td><td><div class="mini">${ch(x.eq || {})}</div></td><td>${esc(x.nick)}<br><small>${esc(x.cls)}</small></td><td>${x[k] || 0}P</td></tr>`).join('') || '<tr><td>아직 기록이 없어요.</td></tr>'}</table>${my ? `<p>내 순위: ${my.r}위 (${my.pts}P) · 3분마다 갱신${m === 'week' ? ' · 이번 주(월~일) 기준' : ''}</p>` : `<p>${m === 'week' ? '이번 주에 얻은 포인트가 아직 없어요.' : ''}</p>`}`;
  }
  RK[m] = { t: Date.now(), h };
  if ($('#rk')) $('#rk').innerHTML = h;
});

// ---------- 꾸미기 ----------
V.shop = () => {
  const T2 = [['char', '캐릭터'], ['shape', '몸 모양'], ['hat', '모자'], ['glasses', '안경'], ['cloth', '옷'], ['bg', '배경'], ['prop', '소품']];
  const owned = U.owned || [], eq = U.eq || {};
  $('#main').innerHTML = `<div class="box" id="pvb"></div><div class="box">${T2.map(a => `<button style="${F === a[0] ? 'background:var(--pk)' : ''}" onclick="MP.cat('${a[0]}')">${a[1]}</button>`).join('')}<div class="grid">${CAT.filter(i => i.t === F).map(i => {
    const o = owned.includes(i.id) || i.price === 0, e = (eq[F] || (F === 'shape' ? 'sh0' : '')) === i.id, sw = F === 'bg' || F === 'cloth' || F === 'shape';
    const btn = o ? (e ? (F === 'char' || F === 'bg' || F === 'shape' ? '✔ 착용중' : `<button onclick="event.stopPropagation();MP.eqp('','${F}')">벗기</button>`) : `<button onclick="event.stopPropagation();MP.eqp('${i.id}','${F}')">착용</button>`) : `<button onclick="event.stopPropagation();MP.buy('${i.id}')">${i.price}P</button>`;
    return `<div class="it" style="border-color:${RC[i.rar]};cursor:pointer" onclick="MP.pv('${i.id}')"><div class="g2" style="${sw ? (F === 'shape' ? `width:30px;height:36px;margin:0 auto;background:#ffd84d;${i.g}` : `background:${i.g};height:26px`) : ''}">${sw ? '' : (i.g[0] === '<' ? i.g : esc(i.g))}</div><small>${esc(i.name)}<br>${i.rar}</small><br>${btn}</div>`;
  }).join('')}</div></div>`;
  pvdraw();
};
MP.cat = t => { F = t; V.shop(); };
function pvdraw() {
  const e = $('#pvb'); if (!e) return;
  const n = Object.values(PV).map(i => esc(BY[i].name));
  e.innerHTML = ch({ ...(U.eq || {}), ...PV }) + `<p style="text-align:center">${n.length ? '👀 미리보기: ' + n.join(', ') + ' <button onclick="MP.pvReset()">원래대로</button>' : '아이템을 누르면 입혀 볼 수 있어요'}</p>`;
}
MP.pvReset = () => { PV = {}; pvdraw(); };
MP.pv = id => { PV[BY[id].t] = id; pvdraw(); };
MP.buy = id => run(async () => {
  const it = BY[id]; if (!it) throw err('없는 아이템이에요.');
  if ((U.owned || []).includes(id)) throw err('이미 가지고 있어요.');
  if (bal() < it.price) throw err('포인트가 부족해요.');
  try { await save({ op: 'buy', owned: [...(U.owned || []), id], spent: U.spent + it.price }); }
  catch (e) { throw e.code === 'permission-denied' ? err('구매가 거절됐어요. 가격표가 바뀌었을 수 있어요. (선생님이 관리자 화면에 한 번 들어가면 맞춰져요)') : e; }
  toast('구매 완료!'); draw();
});
MP.eqp = (id, ty) => run(async () => {
  const eq = { ...(U.eq || {}) };
  if (!id) { if (ty === 'char' || ty === 'bg' || ty === 'shape') throw err('벗을 수 없어요.'); delete eq[ty]; }
  else { const it = BY[id]; if (!it || (!(U.owned || []).includes(id) && it.price > 0)) throw err('가지고 있지 않아요.'); eq[it.t] = id; }
  await save({ op: 'equip', eq });
  draw();
});

// =====================================================================
// ---------- 선생님(관리자) 화면 ----------
// =====================================================================
let AD = { sets: {}, rows: null };
async function adminHome() {
  $('#app').innerHTML = '<div class="box">관리자 화면 불러오는 중… ⏳</div>';
  const cs = await within(Fs.getDoc(R.app()));
  CFG = cs.exists() ? cs.data() : null;
  if (!CFG) { CFG = { std: [], sets: {}, classes: [] }; await Fs.setDoc(R.app(), CFG); }
  CFG.sets = CFG.sets || {}; CFG.std = CFG.std || []; CFG.classes = CFG.classes || [];
  await syncShop();
  const sets = Object.entries(CFG.sets).sort((a, b) => a[1].n.localeCompare(b[1].n, 'ko'));
  const total = sets.reduce((s, [, v]) => s + (v.c || 0), 0);
  $('#app').innerHTML = `<div class="box top"><span><b>👩‍🏫 관리자</b></span><span><button onclick="MP.bigQr()">QR 크게</button><button onclick="MP.logout()">로그아웃</button></span></div>
  <div class="box qrbox"><div class="qr">${qrSvg(homeUrl(), { size: 120 })}</div><div><b>학생 접속 주소</b><br><small class="url">${esc(homeUrl())}</small><br><small>수업 시간에 [QR 크게]를 눌러 화면에 띄우세요.</small></div></div>
  <div class="box"><b>이번 기간 토벌 단원</b> (아무것도 고르지 않으면 전체) · 문제 ${total}개<br>
    ${sets.length ? sets.map(([k, v]) => `<label><input type="checkbox" class="sd" value="${esc(v.n)}" ${CFG.std.includes(v.n) ? 'checked' : ''}> ${esc(v.n)} <small>(${v.c || 0}문제)</small></label><br>`).join('') : '<small>아직 문제가 없어요. 아래 [문제 넣기]로 문제은행을 붙여넣으세요.</small><br>'}
    <button onclick="MP.setStd()">적용</button></div>
  <div class="box"><b>학생 추가</b> <small>(한 줄에 학번 또는 학번,반 — 예: 30101 또는 30101,3-1)</small><textarea id="ad" rows="3"></textarea><button onclick="MP.addSt()">추가</button></div>
  <div class="box"><b>문제 넣기</b> <small>(문제은행 TSV나 구글 시트 Questions 시트의 행을 복사해 붙여넣기 · 같은 번호는 새 내용으로 바뀌어요 · 사용 칸이 N이면 빠져요)</small>
    <textarea id="qtsv" rows="4" placeholder="번호[탭]성취기준[탭]난이도[탭]문제[탭]보기1~4[탭]정답[탭]해설[탭]사용[탭]그림"></textarea><button onclick="MP.importQ()">문제 넣기</button> <button onclick="MP.exportQ()">문제 내려받기(TSV)</button></div>
  <details class="box"><summary><b>문제 하나 추가</b></summary>
    <input id="aqs" list="sl" placeholder="성취기준 (예: 중3 수03 원의 성질)"><datalist id="sl">${sets.map(([, v]) => `<option value="${esc(v.n)}">`).join('')}</datalist>
    <select id="aql"><option value="1">★ 쉬움 (3P)</option><option value="2">★★ 보통 (5P)</option><option value="3">★★★ 도전 (8P)</option></select>
    <textarea id="aqt" rows="2" placeholder="문제"></textarea><input id="ac1" placeholder="보기 1"><input id="ac2" placeholder="보기 2"><input id="ac3" placeholder="보기 3"><input id="ac4" placeholder="보기 4">
    <select id="aqa"><option value="1">정답: 1번</option><option value="2">정답: 2번</option><option value="3">정답: 3번</option><option value="4">정답: 4번</option></select>
    <input id="aqe" placeholder="해설 (선택)"><textarea id="aqf" rows="2" placeholder="그림 SVG 코드 (선택, &lt;svg 로 시작)"></textarea><button onclick="MP.addQ()">문제 추가</button></details>
  <details class="box"><summary><b>예전 구글 시트에서 학생 기록 옮기기</b></summary>
    <small>구글 시트 Users 시트에서 2행부터 마지막 행까지(A~V열) 복사해 붙여넣으세요. 포인트·아이템·닉네임이 옮겨지고, 학생은 회원가입만 다시 하면 이어서 쓸 수 있어요.</small>
    <textarea id="oldu" rows="4"></textarea><button onclick="MP.importUsers()">기록 옮기기</button></details>
  <div class="box"><b>학생 목록</b> <button onclick="MP.listSt()">불러오기</button> <small>(학생 수만큼 읽기 사용량이 들어요)</small><div id="stl"></div></div>
  <div class="box"><b>백업</b> <button onclick="MP.backup()">전체 백업 내려받기(JSON)</button><br><small>학기 중 한 달에 한 번쯤 내려받아 두세요.</small></div>`;
}
async function syncShop() {
  const p = Object.fromEntries(CAT.map(i => [i.id, i.price]));
  const s = await Fs.getDoc(R.shop());
  const q = s.exists() ? s.data().p || {} : null;
  const same = q && Object.keys(q).length === Object.keys(p).length && Object.keys(p).every(k => q[k] === p[k]);
  if (!same) await Fs.setDoc(R.shop(), { p });
}
MP.setStd = () => run(async () => {
  const std = [...document.querySelectorAll('.sd:checked')].map(e => e.value);
  await Fs.updateDoc(R.app(), { std }); CFG.std = std; toast('적용됐어요');
});
async function commitOps(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = Fs.writeBatch(db);
    ops.slice(i, i + 400).forEach(o => o.t === 'set' ? b.set(o.ref, o.data) : o.t === 'update' ? b.update(o.ref, o.data) : b.delete(o.ref));
    await within(b.commit(), 60000);
  }
}
function parseTSV(text) {
  const rows = []; let row = [], cell = '', q = false, i = 0;
  text = String(text).replace(/\r\n?/g, '\n');
  while (i < text.length) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i += 2; continue; } q = false; i++; continue; } cell += c; i++; continue; }
    if (c === '"' && cell === '') { q = true; i++; continue; }
    if (c === '\t') { row.push(cell); cell = ''; i++; continue; }
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += c; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}
MP.addSt = () => run(async () => {
  const lines = $('#ad').value.split('\n').map(l => l.split(/[,\t]/).map(x => x.trim())).filter(a => a[0]);
  const bad = lines.filter(a => !/^[0-9a-zA-Z]{1,20}$/.test(a[0]));
  if (bad.length) throw err('학번은 숫자·영문만 쓸 수 있어요: ' + bad.map(a => a[0]).join(', '));
  const ops = [], cls = new Set(CFG.classes); let n = 0;
  for (const [raw, c] of lines) {
    const id = normId(raw), r = await Fs.getDoc(R.roster(id));
    if (r.exists()) continue;
    const cl = c || clsOf(id); cls.add(cl); n++;
    ops.push({ t: 'set', ref: R.roster(id), data: { g: 0, c: false, cls: cl } });
  }
  ops.push({ t: 'update', ref: R.app(), data: { classes: [...cls].filter(Boolean).sort() } });
  await commitOps(ops); toast(n + '명 추가했어요'); adminHome();
});
// 문제 넣기: qsets(문제, 정답 없음) + answers(정답) + config/app.sets(버전)
async function loadAllSets() {
  const snap = await within(Fs.getDocs(Fs.collection(db, 'qsets')));
  const sets = {}; snap.forEach(d => { sets[d.id] = { ...d.data(), qs: d.data().qs || [] }; });
  return sets;
}
async function applyQuestions(rows) {
  const sets = await loadAllSets(), where = {}, touched = new Set(), ops = [];
  Object.entries(sets).forEach(([k, s]) => s.qs.forEach(q => { where[q.id] = k; }));
  let add = 0, off = 0;
  for (const r of rows) {
    const id = r.id, k = setKey(r.std);
    if (where[id] !== undefined) { const s = sets[where[id]]; s.qs = s.qs.filter(q => q.id !== id); touched.add(where[id]); delete where[id]; }
    if (r.off) { ops.push({ t: 'delete', ref: R.ans(id) }); off++; continue; }
    if (!sets[k]) sets[k] = { std: r.std.trim(), v: 0, qs: [] };
    sets[k].qs.push({ id, lv: r.lv, text: r.text, ch: r.ch, fig: r.fig });
    where[id] = k; touched.add(k); add++;
    ops.push({ t: 'set', ref: R.ans(id), data: { ans: r.ans, ex: r.ex, lv: r.lv, std: r.std.trim() } });
  }
  const meta = { ...(CFG.sets || {}) };
  for (const k of touched) {
    const s = sets[k]; s.qs.sort((a, b) => (+a.id || 0) - (+b.id || 0) || String(a.id).localeCompare(String(b.id)));
    if (!s.qs.length) { ops.push({ t: 'delete', ref: R.set(k) }); delete meta[k]; continue; }
    if (JSON.stringify(s).length > 900000) throw err(`'${s.std}' 단원의 문제(그림 포함)가 너무 커요. 성취기준 이름을 둘로 나눠 주세요.`);
    s.v = (s.v || 0) + 1;
    ops.unshift({ t: 'set', ref: R.set(k), data: { std: s.std, v: s.v, qs: s.qs } });
    meta[k] = { n: s.std, v: s.v, c: s.qs.length };
  }
  ops.push({ t: 'update', ref: R.app(), data: { sets: meta } });
  await commitOps(ops);
  CFG.sets = meta;
  return { add, off };
}
function rowToQ(r, line) {
  const t = i => String(r[i] == null ? '' : r[i]).trim();
  const id = String(parseInt(t(0), 10)), lv = parseInt(t(2), 10), ans = parseInt(t(8), 10);
  const where = `${line}번째 줄(번호 ${t(0)})`;
  if (!/^\d+$/.test(t(0))) throw err(`${where}: 번호는 숫자여야 해요.`);
  if (!t(1) || !t(3)) throw err(`${where}: 성취기준과 문제가 비어 있어요.`);
  if (!(lv >= 1 && lv <= 3)) throw err(`${where}: 난이도는 1~3이에요.`);
  if (!(ans >= 1 && ans <= 4)) throw err(`${where}: 정답은 1~4예요.`);
  const ch = [4, 5, 6, 7].map(t);
  if (ch.some(x => !x)) throw err(`${where}: 보기 4개를 모두 채워 주세요.`);
  return { id, std: t(1), lv, text: t(3), ch, ans, ex: t(9), off: t(10).toUpperCase() === 'N', fig: cleanSvg(t(11)) };
}
MP.importQ = () => run(async () => {
  const rows = parseTSV($('#qtsv').value).filter(r => /^\s*\d+\s*$/.test(r[0] || ''));
  if (!rows.length) throw err('붙여넣은 문제가 없어요. (첫 칸이 번호인 줄만 읽어요)');
  const qs = rows.map((r, i) => rowToQ(r, i + 1));
  const ids = qs.map(q => q.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) throw err('붙여넣은 내용에 같은 번호가 두 번 있어요: ' + [...new Set(dup)].join(', '));
  const r = await applyQuestions(qs);
  toast(`문제 ${r.add}개를 넣었어요${r.off ? `, ${r.off}개는 사용 안 함으로 뺐어요` : ''}.`, true);
  adminHome();
});
MP.addQ = () => run(async () => {
  const g = i => $('#' + i).value.trim();
  const sets = await loadAllSets();
  let max = 0; Object.values(sets).forEach(s => s.qs.forEach(q => { max = Math.max(max, +q.id || 0); }));
  const row = [String(max + 1), g('aqs'), g('aql'), g('aqt'), g('ac1'), g('ac2'), g('ac3'), g('ac4'), g('aqa'), g('aqe'), '', g('aqf')];
  await applyQuestions([rowToQ(row, 1)]);
  toast(`문제 ${max + 1}번이 추가됐어요`); adminHome();
});
MP.exportQ = () => run(async () => {
  const sets = await loadAllSets(), ans = {};
  (await within(Fs.getDocs(Fs.collection(db, 'answers')))).forEach(d => { ans[d.id] = d.data(); });
  const clean = s => String(s ?? '').replace(/[\t\n\r]+/g, ' ');
  const lines = [['번호', '성취기준', '난이도(1-3)', '문제', '보기1', '보기2', '보기3', '보기4', '정답(1-4)', '해설', '사용(N이면 제외)', '그림(SVG, 선택)'].join('\t')];
  Object.values(sets).sort((a, b) => a.std.localeCompare(b.std, 'ko')).forEach(s => s.qs.forEach(q => {
    const a = ans[q.id] || {};
    lines.push([q.id, s.std, q.lv, q.text, ...q.ch, a.ans || '', a.ex || '', '', q.fig || ''].map(clean).join('\t'));
  }));
  download('문제_백업.tsv', lines.join('\n') + '\n', 'text/tab-separated-values');
});
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
// 예전 Users 시트(22열) → roster + users + nicks
MP.importUsers = () => run(async () => {
  const rows = parseTSV($('#oldu').value).filter(r => /^[0-9a-zA-Z]{1,20}$/.test(String(r[0] || '').trim()));
  if (!rows.length) throw err('붙여넣은 학생이 없어요. Users 시트의 2행부터 복사해 주세요.');
  const J = (s, d) => { try { const v = JSON.parse(String(s || '').trim() || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const N = s => Math.max(0, Math.round(+s || 0));
  const curWk = wkey(now()), ops = [], cls = new Set(CFG.classes), seenNick = new Set();
  let moved = 0, skipped = 0, fresh = 0;
  for (const r of rows) {
    const id = normId(r[0]), nick = String(r[2] || '').trim().slice(0, 8), cl = String(r[3] || '').trim() || clsOf(id);
    const [ro, us] = await Promise.all([Fs.getDoc(R.roster(id)), Fs.getDoc(R.user(id))]);
    if (us.exists() && us.data().uid) { skipped++; continue; }     // 이미 새 앱에서 쓰는 학생
    cls.add(cl);
    ops.push({ t: 'set', ref: R.roster(id), data: { g: ro.exists() ? (ro.data().g || 0) : 0, c: false, cls: cl } });
    if (!nick) { fresh++; continue; }                                // 예전에도 가입 전이던 학번
    const study = N(r[4]), math = N(r[5]), owned = [...new Set([...J(r[17], []), ...START_OWNED])], eq = { ...START_EQ, ...J(r[18], {}) };
    const u = blankUser({ op: 'import', nick, cls: cl, study, math, spent: N(r[6]), all: study + math, warn: Math.min(3, N(r[7])), owned, eq });
    const wk = String(r[10] || '').trim();
    if (/^\d{8}$/.test(wk)) { const d = Date.UTC(+wk.slice(0, 4), +wk.slice(4, 6) - 1, +wk.slice(6, 8)) / DAY, k = 'w' + Math.floor((d + 3) / 7); if (k === curWk) u[k] = N(r[8]) + N(r[9]); }
    ops.push({ t: 'set', ref: R.user(id), data: u });
    if (!seenNick.has(nick)) { seenNick.add(nick); ops.push({ t: 'set', ref: R.nick(nick), data: { sid: id } }); }
    moved++;
  }
  ops.push({ t: 'update', ref: R.app(), data: { classes: [...cls].filter(Boolean).sort() } });
  await commitOps(ops);
  toast(`기록 ${moved}명, 가입 전 학번 ${fresh}명을 옮겼어요${skipped ? ` (이미 새 앱을 쓰는 ${skipped}명은 건너뜀)` : ''}.`, true);
  adminHome();
});
MP.listSt = () => run(async () => {
  const [us, rs] = await Promise.all([within(Fs.getDocs(Fs.collection(db, 'users'))), within(Fs.getDocs(Fs.collection(db, 'roster')))]);
  const M = {};
  rs.forEach(d => { M[d.id] = { id: d.id, ro: d.data() }; });
  us.forEach(d => { (M[d.id] = M[d.id] || { id: d.id }).u = d.data(); });
  AD.rows = Object.values(M).sort((a, b) => a.id.localeCompare(b.id, 'ko', { numeric: true }));
  const st = x => x.u && x.u.uid ? '가입' : x.u ? '다시 가입 필요' : '가입 전';
  $('#stl').innerHTML = `<p>${AD.rows.length}명 · 가입 ${AD.rows.filter(x => x.u && x.u.uid).length}명</p><div style="overflow:auto"><table><tr><th>학번</th><th>닉네임</th><th>반</th><th>P</th><th>경고</th><th></th></tr>${AD.rows.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.u ? x.u.nick : '')}<br><small>${st(x)}</small></td><td>${esc((x.u && x.u.cls) || (x.ro && x.ro.cls) || '')}</td><td>${x.u ? x.u.all : 0}</td><td>${x.u ? x.u.warn : 0}</td><td><button onclick="MP.reset('${esc(x.id)}')">🔑</button>${x.u ? `<button onclick="MP.nick('${esc(x.id)}')">✏️</button><button onclick="MP.warn0('${esc(x.id)}')">⚠️0</button>` : ''}</td></tr>`).join('')}</table></div><small>🔑 비밀번호 초기화(학생이 회원가입을 다시 하면 기록이 그대로 이어져요) · ✏️ 닉네임 변경 · ⚠️0 경고 초기화</small>`;
});
const rowOf = id => (AD.rows || []).find(x => x.id === id);
MP.reset = id => run(async () => {
  if (!confirm(id + ' 학생의 비밀번호를 초기화할까요?\n학생이 회원가입을 다시 하면 포인트와 아이템이 그대로 이어져요.')) return;
  const ro = await Fs.getDoc(R.roster(id)), us = await Fs.getDoc(R.user(id)), ops = [];
  ops.push({ t: 'set', ref: R.roster(id), data: { g: (ro.exists() ? ro.data().g || 0 : 0) + 1, c: false, cls: ro.exists() ? ro.data().cls || '' : (us.exists() ? us.data().cls : clsOf(id)) } });
  if (us.exists()) ops.push({ t: 'update', ref: R.user(id), data: { uid: null, op: 'reset' } });
  await commitOps(ops); toast(id + ' 초기화 완료. 학생에게 회원가입을 다시 하라고 알려 주세요.', true); MP.listSt();
});
MP.nick = id => run(async () => {
  const x = rowOf(id); const nick = (prompt('새 닉네임 (8자 이내)', x && x.u ? x.u.nick : '') || '').trim().slice(0, 8);
  if (!nick) return;
  if (/[\/.#$\[\]]/.test(nick)) throw err('닉네임에 / . # $ [ ] 는 쓸 수 없어요.');
  const ex = await Fs.getDoc(R.nick(nick));
  if (ex.exists() && ex.data().sid !== id) throw err('이미 다른 학생이 쓰는 닉네임이에요.');
  const us = await Fs.getDoc(R.user(id)), old = us.exists() ? us.data().nick : '', ops = [];
  ops.push({ t: 'update', ref: R.user(id), data: { nick, op: 'admin' } });
  if (old && old !== nick) ops.push({ t: 'delete', ref: R.nick(old) });
  ops.push({ t: 'set', ref: R.nick(nick), data: { sid: id } });
  await commitOps(ops); RK = {}; toast('닉네임을 바꿨어요'); MP.listSt();
});
MP.warn0 = id => run(async () => { await Fs.updateDoc(R.user(id), { warn: 0, op: 'admin' }); toast('경고를 0으로 바꿨어요'); MP.listSt(); });
MP.backup = () => run(async () => {
  const out = { at: new Date().toISOString() };
  for (const c of ['users', 'roster', 'nicks', 'qsets', 'answers', 'config']) {
    out[c] = {};
    (await within(Fs.getDocs(Fs.collection(db, c)), 60000)).forEach(d => {
      out[c][d.id] = d.data();
    });
  }
  download(`수학픽셀_백업_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(out), 'application/json');
});

boot();
