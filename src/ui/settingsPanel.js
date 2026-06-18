// settingsPanel.js — a DOM settings overlay (brief §9). DOM (not canvas) so the
// controls carry real labels for screen readers and native keyboard support.
// Volumes, mute, reduced motion, colorblind tags, UI scale, game speed, and
// reset progress — all persisted via the settings store.

import { getSettings, setSetting } from '../a11y/settings.js';
import { reset as resetSave } from '../save/save.js';

let panel = null;

function row(label, control) {
  const r = document.createElement('label');
  r.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0;font:600 14px system-ui;color:#eef1ff';
  const span = document.createElement('span'); span.textContent = label;
  r.appendChild(span); r.appendChild(control); return r;
}
function slider(key) {
  const s = getSettings(); const i = document.createElement('input');
  i.type = 'range'; i.min = 0; i.max = 100; i.value = Math.round((s[key] ?? 0) * 100);
  i.setAttribute('aria-label', key);
  i.oninput = () => setSetting(key, (+i.value) / 100);
  return i;
}
function checkbox(key) {
  const s = getSettings(); const i = document.createElement('input');
  i.type = 'checkbox'; i.checked = !!s[key]; i.setAttribute('aria-label', key);
  i.onchange = () => setSetting(key, i.checked);
  return i;
}
function speed() {
  const s = getSettings(); const sel = document.createElement('select');
  sel.setAttribute('aria-label', 'game speed');
  [['0.5', 'Slow'], ['0.75', 'Relaxed'], ['1', 'Normal'], ['1.25', 'Fast']].forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (+v === s.gameSpeed) o.selected = true; sel.appendChild(o); });
  sel.onchange = () => setSetting('gameSpeed', +sel.value);
  return sel;
}
function difficultySel() {
  const s = getSettings(); const sel = document.createElement('select');
  sel.setAttribute('aria-label', 'difficulty');
  [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']].forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === s.difficulty) o.selected = true; sel.appendChild(o); });
  sel.onchange = () => setSetting('difficulty', sel.value);
  return sel;
}

export function openSettings() {
  if (panel) { panel.style.display = 'flex'; return; }
  panel = document.createElement('div');
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Settings');
  panel.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(4,5,12,.6);backdrop-filter:blur(6px)';
  const card = document.createElement('div');
  card.style.cssText = 'width:min(420px,90vw);background:rgba(16,18,32,.95);border:1px solid rgba(255,210,74,.3);border-radius:18px;padding:22px 26px;box-shadow:0 20px 60px rgba(0,0,0,.6)';
  card.innerHTML = '<h2 style="margin:0 0 6px;font:800 22px system-ui;color:#ffd24a">Settings</h2><p style="margin:0 0 14px;font:500 12px system-ui;color:#9aa0c8">Accessibility &amp; audio</p>';
  card.appendChild(row('Master volume', slider('master')));
  card.appendChild(row('Music', slider('music')));
  card.appendChild(row('Sound effects', slider('sfx')));
  card.appendChild(row('Mute', checkbox('muted')));
  card.appendChild(row('Reduced motion', checkbox('reducedMotion')));
  card.appendChild(row('Colorblind tags', checkbox('colorblind')));
  card.appendChild(row('Difficulty', difficultySel()));
  card.appendChild(row('Game speed', speed()));

  const reset = document.createElement('button');
  reset.textContent = 'Reset progress';
  reset.style.cssText = 'margin-top:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(255,120,120,.5);background:transparent;color:#ff9a9a;font:600 13px system-ui;cursor:pointer';
  reset.onclick = () => { if (confirm('Reset all campaign progress and settings?')) { resetSave(); close(); } };

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Done';
  closeBtn.style.cssText = 'margin-top:8px;float:right;padding:8px 22px;border-radius:10px;border:none;background:linear-gradient(90deg,#ffd24a,#ff9d54);color:#1a1000;font:700 14px system-ui;cursor:pointer';
  closeBtn.onclick = close;

  const foot = document.createElement('div'); foot.style.cssText = 'margin-top:14px;display:flex;justify-content:space-between;align-items:center';
  foot.appendChild(reset); foot.appendChild(closeBtn);
  card.appendChild(foot);
  panel.appendChild(card);
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
  document.body.appendChild(panel);
}

function close() { if (panel) panel.style.display = 'none'; }
