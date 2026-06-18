// namePrompt.js — first-launch "what's your name?" overlay (DOM, so it has a
// real labeled text input). The name personalises the menu + leaderboard.

import { setName, getName } from '../save/save.js';

export function askName(onDone) {
  const wrap = document.createElement('div');
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', 'Enter your name');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;background:rgba(4,5,12,.78);backdrop-filter:blur(8px)';
  const card = document.createElement('div');
  card.style.cssText = 'width:min(420px,90vw);background:rgba(16,18,32,.96);border:1px solid rgba(255,210,74,.35);border-radius:18px;padding:26px 28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6)';
  card.innerHTML = '<div style="font:700 13px system-ui;letter-spacing:4px;color:#ffd24a">ECHIPA LUMINA</div>'
    + '<h2 style="margin:8px 0 4px;font:800 26px system-ui;color:#fff7e0">Welcome, hero of light</h2>'
    + '<p style="margin:0 0 18px;font:500 14px system-ui;color:#9aa0c8">What should we call you?</p>';
  const input = document.createElement('input');
  input.type = 'text'; input.maxLength = 16; input.placeholder = 'Your name'; input.value = getName();
  input.style.cssText = 'width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,210,74,.4);background:rgba(8,10,22,.85);color:#eef1ff;font:600 18px system-ui;text-align:center;outline:none';
  const btn = document.createElement('button');
  btn.textContent = 'Begin ✦';
  btn.style.cssText = 'margin-top:18px;padding:12px 30px;border-radius:12px;border:none;background:linear-gradient(90deg,#ffd24a,#ff9d54);color:#1a1000;font:800 16px system-ui;cursor:pointer';
  const finish = () => { setName(input.value.trim() || 'Radu'); wrap.remove(); if (onDone) onDone(); };
  btn.onclick = finish;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); });
  card.appendChild(input); card.appendChild(document.createElement('br')); card.appendChild(btn);
  wrap.appendChild(card); document.body.appendChild(wrap);
  setTimeout(() => input.focus(), 50);
}
