/* =========================================================================
   Live Operations HQ — source engine
   Parse any tabular source, work out what its columns mean, and render the
   rows as people / vehicles / aircraft / assets on a site layout.
   Shared by pipeline.html (demo) and studio.html (the mapping tool).
   No dependencies.
   ========================================================================= */
(function(global){
'use strict';

/* --------------------------------- util --------------------------------- */

function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

function fmtNum(n){
  if(n===null||n===undefined||!isFinite(n)) return '—';
  var a=Math.abs(n);
  if(a>=1e9) return (n/1e9).toFixed(1)+'B';
  if(a>=1e6) return (n/1e6).toFixed(1)+'M';
  if(a>=1e4) return (n/1e3).toFixed(1)+'k';
  if(a>=100) return String(Math.round(n));
  return String(Math.round(n*100)/100);
}

var NULLS = {'':1,'null':1,'NULL':1,'NaN':1,'n/a':1,'N/A':1,'-':1,'none':1,'None':1,'undefined':1};
function isBlank(v){ return v===null || v===undefined || NULLS[String(v).trim()]===1; }

function toNum(v){
  if(typeof v === 'number') return isFinite(v) ? v : null;
  if(isBlank(v)) return null;
  var s = String(v).trim().replace(/[\s,$€£%]/g,'');
  if(s==='' || s==='-') return null;
  if(/^\(.*\)$/.test(s)) s = '-' + s.slice(1,-1);
  if(!/^-?\d*\.?\d+(e[-+]?\d+)?$/i.test(s)) return null;
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}

var DATE_RE = /^(\d{4}-\d{1,2}(-\d{1,2})?([T ]\d{1,2}:\d{2}(:\d{2})?)?|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/;
function toDate(v){
  if(isBlank(v)) return null;
  var s = String(v).trim();
  if(!DATE_RE.test(s)) return null;
  if(/^\d{4}-\d{1,2}$/.test(s)) s += '-01';
  var t = Date.parse(s.replace(' ','T'));
  if(isNaN(t)) t = Date.parse(s);
  return isNaN(t) ? null : t;
}

/* -------------------------------- parsing -------------------------------- */

function sniffDelim(text){
  var line = text.split(/\r?\n/).filter(function(l){ return l.trim(); })[0] || '';
  var cands = [',',';','\t','|'], best=',', bestN=0;
  for(var i=0;i<cands.length;i++){
    var n = line.split(cands[i]).length - 1;
    if(n > bestN){ bestN = n; best = cands[i]; }
  }
  return best;
}

/* RFC4180-ish: quotes, escaped quotes, embedded newlines. */
function parseDelimited(text, delim){
  var rows=[], row=[], cur='', q=false, i, ch;
  for(i=0;i<text.length;i++){
    ch = text.charAt(i);
    if(q){
      if(ch === '"'){ if(text.charAt(i+1) === '"'){ cur += '"'; i++; } else q = false; }
      else cur += ch;
    }
    else if(ch === '"') q = true;
    else if(ch === delim){ row.push(cur); cur=''; }
    else if(ch === '\n'){ row.push(cur); cur=''; rows.push(row); row=[]; }
    else if(ch === '\r'){ /* ignore */ }
    else cur += ch;
  }
  if(cur !== '' || row.length){ row.push(cur); rows.push(row); }
  return rows.filter(function(r){ return r.length && !(r.length===1 && String(r[0]).trim()===''); });
}

/* Vendor reports bury the header under title lines: the widest of the first
   rows is the header, and everything above it is preamble. */
function rowsToObjects(rows){
  var hi=0, best=0, i, j;
  for(i=0;i<Math.min(rows.length,12);i++){
    if(rows[i].length > best){ best = rows[i].length; hi = i; }
  }
  var header = rows[hi].map(function(h,k){
    return String(h||'').trim().replace(/^﻿/,'') || ('col'+(k+1));
  });
  var out=[];
  for(i=hi+1;i<rows.length;i++){
    var r = rows[i];
    if(r.length < Math.ceil(header.length/2)) continue;      /* footer line */
    var blank = true;
    for(j=0;j<r.length;j++){ if(String(r[j]).trim()){ blank=false; break; } }
    if(blank) continue;
    var o = {};
    for(j=0;j<header.length;j++) o[header[j]] = r[j]===undefined ? '' : String(r[j]).trim();
    out.push(o);
  }
  return { header:header, rows:out };
}

function flattenRow(obj, prefix, out){
  out = out || {}; prefix = prefix || '';
  for(var k in obj){
    if(!Object.prototype.hasOwnProperty.call(obj,k)) continue;
    var v = obj[k], key = prefix ? prefix + '_' + k : k;
    if(v && typeof v === 'object' && !Array.isArray(v)) flattenRow(v, key, out);
    else if(Array.isArray(v)) out[key] = v.join(' | ');
    else out[key] = v;
  }
  return out;
}

function parseJSONSource(text){
  var data = JSON.parse(text), arr = null, k;
  if(Array.isArray(data)) arr = data;
  else if(data && typeof data === 'object'){
    for(k in data){
      if(Array.isArray(data[k]) && data[k].length && typeof data[k][0] === 'object'){ arr = data[k]; break; }
    }
    if(!arr) arr = [data];
  }
  if(!arr) throw new Error('no array of records found');
  var rows = arr.map(function(r){ return (r && typeof r === 'object') ? flattenRow(r) : { value:r }; });
  var header = [], seen = {};
  rows.forEach(function(r){ for(var k2 in r){ if(!seen[k2]){ seen[k2]=1; header.push(k2); } } });
  return { header:header, rows:rows };
}

function parseAny(text){
  var t = String(text).replace(/^﻿/,'').trim();
  if(t.charAt(0)==='{' || t.charAt(0)==='['){
    try { var j = parseJSONSource(t); j.format = 'JSON'; return j; } catch(e){ /* fall through */ }
  }
  var d = sniffDelim(t);
  var parsed = rowsToObjects(parseDelimited(t, d));
  parsed.format = d==='\t' ? 'tab-separated' : d===';' ? 'semicolon-separated'
                : d==='|' ? 'pipe-delimited' : 'comma-separated';
  parsed.delim = d;
  return parsed;
}

/* ------------------------------- profiling ------------------------------- */

var BOOLS = {'true':1,'false':1,'yes':1,'no':1,'y':1,'n':1,'0':1,'1':1,'on':1,'off':1};

function profile(header, rows){
  return header.map(function(name){
    var filled=0, nums=0, dates=0, bools=0, distinct={}, nDistinct=0, samples=[], i, v;
    for(i=0;i<rows.length;i++){
      v = rows[i][name];
      if(isBlank(v)) continue;
      filled++;
      if(toNum(v) !== null) nums++;
      if(toDate(v) !== null) dates++;
      if(typeof v === 'boolean' || BOOLS[String(v).toLowerCase()] === 1) bools++;
      var key = String(v);
      if(!distinct[key]){ distinct[key]=1; nDistinct++; if(samples.length<3) samples.push(key); }
    }
    var ratio = function(n){ return filled ? n/filled : 0; };
    var kind;
    if(!filled) kind = 'text';
    else if(ratio(dates) > 0.8) kind = 'date';
    else if(ratio(bools) > 0.95 && nDistinct <= 2) kind = 'bool';
    else if(ratio(nums) > 0.85) kind = 'number';
    else if(nDistinct <= Math.max(25, rows.length*0.25)) kind = 'category';
    else kind = 'text';
    if(kind==='number' && /(^|_)(id|no|number|code|zip|phone)$/i.test(name) && nDistinct > rows.length*0.9) kind='category';
    return { name:name, kind:kind, filled:filled, total:rows.length, distinct:nDistinct, samples:samples };
  });
}

function makeDataset(name, origin, parsed){
  return {
    name: name,
    origin: origin || 'source',
    format: parsed.format || 'delimited',
    cols: profile(parsed.header, parsed.rows),
    rows: parsed.rows,
    loadedAt: new Date().toISOString()
  };
}

function loadSource(text, name, origin){
  var parsed = parseAny(text);
  if(!parsed.rows.length) throw new Error('no data rows found');
  return makeDataset(name, origin, parsed);
}

/* -------------------------------- layouts -------------------------------- */
/* A site is just named areas on a 1000×620 plan. Swap the plan, the same
   rows land somewhere else — that is all "fits my company" means here.     */

var LAYOUTS = {
  airfield: {
    label:'✈️ Flight school / airfield', kinds:['aircraft','person','vehicle'],
    zones:[
      {id:'hangar',  name:'Hangar',      x:50,  y:60,  w:250, h:190},
      {id:'apron',   name:'Apron',       x:330, y:60,  w:360, h:190},
      {id:'ops',     name:'Ops office',  x:720, y:60,  w:230, h:120},
      {id:'class',   name:'Classrooms',  x:720, y:200, w:230, h:170},
      {id:'lot',     name:'Parking lot', x:50,  y:280, w:250, h:170},
      {id:'ramp',    name:'Run-up area', x:330, y:280, w:360, h:90},
      {id:'runway',  name:'Runway 18/36',x:50,  y:490, w:900, h:80, road:true}
    ]
  },
  warehouse: {
    label:'📦 Warehouse / logistics', kinds:['asset','person','vehicle'],
    zones:[
      {id:'recv',  name:'Receiving', x:50,  y:60,  w:210, h:170},
      {id:'a',     name:'Aisle A',   x:290, y:60,  w:170, h:170},
      {id:'b',     name:'Aisle B',   x:290, y:255, w:170, h:170},
      {id:'c',     name:'Aisle C',   x:290, y:450, w:170, h:120},
      {id:'pack',  name:'Packing',   x:490, y:60,  w:210, h:170},
      {id:'dock',  name:'Loading dock', x:490, y:255, w:210, h:170},
      {id:'yard',  name:'Yard',      x:730, y:60,  w:220, h:365},
      {id:'office',name:'Office',    x:50,  y:255, w:210, h:170},
      {id:'gate',  name:'Gate road', x:490, y:470, w:460, h:80, road:true}
    ]
  },
  construction: {
    label:'🏗️ Construction / field site', kinds:['person','vehicle','asset'],
    zones:[
      {id:'office', name:'Site office',   x:50,  y:60,  w:220, h:150},
      {id:'store',  name:'Material yard', x:50,  y:240, w:220, h:210},
      {id:'za',     name:'Block A',       x:300, y:60,  w:300, h:190},
      {id:'zb',     name:'Block B',       x:300, y:280, w:300, h:170},
      {id:'crane',  name:'Crane pad',     x:630, y:60,  w:320, h:190},
      {id:'plant',  name:'Plant & tools', x:630, y:280, w:320, h:170},
      {id:'gate',   name:'Site gate',     x:50,  y:490, w:900, h:80, road:true}
    ]
  },
  depot: {
    label:'🚚 Fleet depot / dispatch', kinds:['vehicle','person','asset'],
    zones:[
      {id:'bays',  name:'Service bays', x:50,  y:60,  w:330, h:200},
      {id:'wash',  name:'Wash',         x:410, y:60,  w:180, h:200},
      {id:'fuel',  name:'Fuel island',  x:620, y:60,  w:330, h:200},
      {id:'lot',   name:'Vehicle lot',  x:50,  y:290, w:540, h:160},
      {id:'parts', name:'Parts store',  x:620, y:290, w:330, h:160},
      {id:'road',  name:'Access road',  x:50,  y:490, w:900, h:80, road:true}
    ]
  }
};

/* --------------------------- field interpretation ------------------------ */

var KIND_WORDS = {
  aircraft:/aircraft|plane|tail|flight|airborne|cessna|piper|n\d{3}|rotor/i,
  vehicle :/vehicle|van|truck|car|fleet|driver|tug|forklift|odometer|unit/i,
  person  :/employee|staff|person|people|student|instructor|technician|operator|crew|worker|name/i,
  asset   :/part|asset|tool|pallet|item|sku|stock|equipment|machine/i,
  package :/shipment|parcel|package|tracking|consignment|delivery|carrier/i
};

function guessKind(ds){
  var names = ds.cols.map(function(c){ return c.name; }).join(' ');
  var text = names + ' ' + ds.name;
  var order = ['aircraft','package','vehicle','asset','person'];
  for(var i=0;i<order.length;i++){ if(KIND_WORDS[order[i]].test(text)) return order[i]; }
  return 'person';
}

function pickCol(cols, re, kinds){
  for(var i=0;i<cols.length;i++){
    if(re.test(cols[i].name) && (!kinds || kinds.indexOf(cols[i].kind) >= 0)) return cols[i].name;
  }
  return null;
}

/* A status column is one whose values read like states, whatever it is called. */
function bestStatusCol(ds, label, zone){
  var best = null, bestScore = 0.45;
  ds.cols.forEach(function(c){
    if(c.name===label || c.name===zone) return;
    if(c.kind!=='category' && c.kind!=='bool' && c.kind!=='text') return;
    if(c.distinct > 8 || c.distinct < 2) return;
    var hits = 0, n = 0;
    for(var i=0;i<ds.rows.length;i++){
      var v = ds.rows[i][c.name];
      if(isBlank(v)) continue;
      n++;
      for(var j=0;j<STATUS_RULES.length;j++){ if(STATUS_RULES[j].re.test(String(v))){ hits++; break; } }
    }
    var score = n ? hits/n : 0;
    if(score > bestScore){ bestScore = score; best = c.name; }
  });
  return best;
}

function inferMapping(ds){
  var cols = ds.cols, n = ds.rows.length;
  var label = pickCol(cols, /name|employee|student|driver|unit|tail|registration|tracking|part_?no|asset|sku|title|label/i)
           || (cols.filter(function(c){ return (c.kind==='text'||c.kind==='category') && c.distinct > n*0.5; })[0]||{}).name
           || (cols.filter(function(c){ return c.kind!=='number'; })[0]||cols[0]||{}).name;

  var zone = pickCol(cols, /zone|site|area|warehouse|location|base|building|dept|department|destination|origin|bay|region|branch/i,
                     ['category','text'])
          || (cols.filter(function(c){ return c.kind==='category' && c.name!==label && c.distinct>=2 && c.distinct<=12; })[0]||{}).name
          || null;

  var status = pickCol(cols, /status|state|stage|condition|availability|health/i)
            || bestStatusCol(ds, label, zone);

  return { label:label, zone:zone, status:status, kind:guessKind(ds) };
}

/* ------------------------------ status model ----------------------------- */

var STATUS_RULES = [
  { key:'moving',  color:'#4ea8de', re:/transit|airborne|en ?route|moving|driving|flying|dispatch|departed|running/i },
  { key:'ok',      color:'#22e39c', re:/on.?site|at base|available|delivered|ready|in service|serviceable|active|ok|complete|done|true|yes|open|normal/i },
  { key:'waiting', color:'#f0a500', re:/idle|waiting|pending|scheduled|hold|low|reorder|queued|standby|maint/i },
  { key:'alert',   color:'#e0664f', re:/delay|alert|fault|down|critical|overdue|fail|out of service|aog|blocked|expired/i },
  { key:'off',     color:'#6f7789', re:/inactive|offline|closed|archived|false|no|unknown|retired/i }
];
var STATUS_LABEL = { moving:'In motion', ok:'Active / on site', waiting:'Idle / waiting', alert:'Needs attention', off:'Inactive' };

function classifyStatus(v){
  if(isBlank(v)) return 'off';
  var s = String(v);
  for(var i=0;i<STATUS_RULES.length;i++){ if(STATUS_RULES[i].re.test(s)) return STATUS_RULES[i].key; }
  return 'ok';
}
function statusColor(key){
  for(var i=0;i<STATUS_RULES.length;i++){ if(STATUS_RULES[i].key===key) return STATUS_RULES[i].color; }
  return '#22e39c';
}

/* --------------------------- zone value matching ------------------------- */
/* The file says "North Base" and the plan says "Hangar". Match on shared
   words where we can; otherwise spread the leftovers evenly and show the
   operator exactly what went where.                                        */

function norm(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

function matchZones(values, zones){
  var map = {}, used = {}, i, j;
  for(i=0;i<values.length;i++){
    var v = norm(values[i]), bestZ = null, bestScore = 0;
    var vt = v.split(' ').filter(Boolean);
    for(j=0;j<zones.length;j++){
      var zt = norm(zones[j].name).split(' ').filter(Boolean), score = 0, a, b;
      for(a=0;a<vt.length;a++) for(b=0;b<zt.length;b++){
        if(vt[a] === zt[b]) score += 2;
        else if(vt[a].length>3 && zt[b].indexOf(vt[a])===0) score += 1;
        else if(zt[b].length>3 && vt[a].indexOf(zt[b])===0) score += 1;
      }
      if(score > bestScore){ bestScore = score; bestZ = zones[j]; }
    }
    map[values[i]] = { zone: bestScore > 0 ? bestZ : null, matched: bestScore > 0 };
    if(bestScore > 0) used[bestZ.id] = 1;
  }
  /* leftovers: fill the unused areas first, then wrap */
  var free = zones.filter(function(z){ return !used[z.id] && !z.road; });
  var all  = zones.filter(function(z){ return !z.road; });
  var k = 0;
  for(i=0;i<values.length;i++){
    if(map[values[i]].zone) continue;
    var pool = free.length ? free : all;
    map[values[i]].zone = pool[k % pool.length];
    k++;
  }
  return map;
}

/* ------------------------------- entities -------------------------------- */

function buildEntities(ds, mapping, layout, presetZoneMap){
  var zones = layout.zones;
  var values = [], seen = {}, i;
  if(mapping.zone){
    for(i=0;i<ds.rows.length;i++){
      var v = isBlank(ds.rows[i][mapping.zone]) ? '—' : String(ds.rows[i][mapping.zone]);
      if(!seen[v]){ seen[v]=1; values.push(v); }
    }
  }
  var zmap = presetZoneMap || matchZones(values, zones);
  var placeable = zones.filter(function(z){ return !z.road; });
  var road = zones.filter(function(z){ return z.road; })[0] || null;

  var ents = ds.rows.map(function(row, idx){
    var zv = mapping.zone ? (isBlank(row[mapping.zone]) ? '—' : String(row[mapping.zone])) : null;
    var zone = (zv !== null && zmap[zv]) ? zmap[zv].zone : placeable[idx % placeable.length];
    var st = mapping.status ? classifyStatus(row[mapping.status]) : 'ok';
    return {
      i: idx,
      label: mapping.label ? String(row[mapping.label]) : ('#' + (idx+1)),
      kind: mapping.kind, status: st, zoneValue: zv, zone: zone, row: row
    };
  });

  /* Lay each area out as a loose grid so nothing stacks and every label
     stays readable — a scatter looks random, a grid looks like a floor. */
  var byZone = {};
  ents.forEach(function(e){ (byZone[e.zone.id] = byZone[e.zone.id] || []).push(e); });
  Object.keys(byZone).forEach(function(zid){
    var list = byZone[zid], z = list[0].zone, n = list.length;
    var padX = 26, padTop = 38, padBot = 20;
    var availW = Math.max(40, z.w - padX*2), availH = Math.max(30, z.h - padTop - padBot);
    var cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * availW / Math.max(availH,1)))));
    var rows = Math.ceil(n / cols);
    var stepX = availW / cols, stepY = availH / rows;
    list.forEach(function(e, k){
      var c = k % cols, r = Math.floor(k / cols);
      var j1 = ((e.i*2654435761) % 1000)/1000 - 0.5, j2 = ((e.i*40503*7) % 997)/997 - 0.5;
      e.x = z.x + padX + stepX*(c + 0.5) + j1 * Math.min(stepX*0.25, 7);
      e.y = z.y + padTop + stepY*(r + 0.5) + j2 * Math.min(stepY*0.25, 6);
      e.home = { x:e.x, y:e.y };
      e.phase = (j1 + 0.5) * Math.PI * 2;
      e.drift = 0.3 + (j2 + 0.5) * 0.5;
      if(e.status === 'moving' && road){            /* in motion: travel the road */
        e.travel = { road: road, t: (j1+0.5), dir: (e.i % 2) ? 1 : -1, speed: 0.00035 + (j2+0.5)*0.0004 };
      }
    });
  });

  return { entities: ents, zoneMap: zmap, zoneValues: values };
}

/* -------------------------------- renderer ------------------------------- */

function MapView(canvas, opts){
  this.cv = canvas;
  this.ctx = canvas.getContext('2d');
  this.opts = opts || {};
  this.entities = [];
  this.layout = null;
  this.selected = null;
  this.query = '';
  this.t = 0;
  var self = this;
  canvas.addEventListener('click', function(ev){ self._click(ev); });
  canvas.addEventListener('mousemove', function(ev){
    canvas.style.cursor = self._hit(ev) ? 'pointer' : 'crosshair';
  });
}

MapView.prototype.set = function(layout, entities){
  this.layout = layout; this.entities = entities; this.selected = null;
};
MapView.prototype.setQuery = function(q){ this.query = String(q||'').trim().toLowerCase(); };

MapView.prototype.start = function(){
  if(this._raf) return;
  var self = this, last = 0;
  (function loop(ts){
    self._raf = requestAnimationFrame(loop);
    if(ts - last < 33) return;                                  /* ~30fps */
    last = ts; self.t += 1; self.draw();
  })(0);
};
MapView.prototype.stop = function(){ if(this._raf){ cancelAnimationFrame(this._raf); this._raf = null; } };

MapView.prototype._matches = function(e){
  if(!this.query) return true;
  return (e.label + ' ' + (e.zoneValue||'') + ' ' + e.status).toLowerCase().indexOf(this.query) >= 0;
};

MapView.prototype._pos = function(e){
  if(e.travel){
    var r = e.travel.road;
    e.travel.t += e.travel.speed * e.travel.dir;
    if(e.travel.t > 1){ e.travel.t = 1; e.travel.dir = -1; }
    if(e.travel.t < 0){ e.travel.t = 0; e.travel.dir = 1; }
    return { x: r.x + 30 + e.travel.t * (r.w - 60), y: r.y + r.h/2, moving:true, dir:e.travel.dir };
  }
  var a = (this.t * 0.012 * e.drift) + e.phase;
  return { x: e.home.x + Math.cos(a) * 6 * e.drift, y: e.home.y + Math.sin(a*1.3) * 4 * e.drift, moving:false, dir:1 };
};

MapView.prototype.draw = function(){
  var ctx = this.ctx, W = this.cv.width, H = this.cv.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(0,0,W,H);
  if(!this.layout) return;

  /* faint grid, so the plan reads as a floor, not a chart */
  ctx.strokeStyle = 'rgba(255,255,255,.022)'; ctx.lineWidth = 1;
  for(var gx=0; gx<W; gx+=40){ ctx.beginPath(); ctx.moveTo(gx+.5,0); ctx.lineTo(gx+.5,H); ctx.stroke(); }
  for(var gy=0; gy<H; gy+=40){ ctx.beginPath(); ctx.moveTo(0,gy+.5); ctx.lineTo(W,gy+.5); ctx.stroke(); }

  var counts = {};
  this.entities.forEach(function(e){ counts[e.zone.id] = (counts[e.zone.id]||0) + 1; });

  var self = this;
  this.layout.zones.forEach(function(z){
    self._zone(z, counts[z.id] || 0);
  });

  this._drawn = [];
  this.entities.forEach(function(e){
    var p = self._pos(e);
    e._x = p.x; e._y = p.y;
    self._drawn.push(e);
    self._entity(e, p);
  });
};

MapView.prototype._round = function(x,y,w,h,r){
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};

MapView.prototype._zone = function(z, n){
  var ctx = this.ctx;
  this._round(z.x, z.y, z.w, z.h, 10);
  ctx.fillStyle = z.road ? '#0f1118' : '#11151d';
  ctx.fill();
  ctx.strokeStyle = '#232835'; ctx.lineWidth = 1; ctx.stroke();
  if(z.road){                                            /* centre dashes */
    ctx.save(); ctx.strokeStyle = '#2a3140'; ctx.lineWidth = 2; ctx.setLineDash([16,14]);
    ctx.beginPath(); ctx.moveTo(z.x+14, z.y+z.h/2); ctx.lineTo(z.x+z.w-14, z.y+z.h/2); ctx.stroke();
    ctx.restore();
  }
  ctx.font = '600 11px -apple-system,Segoe UI,Roboto,sans-serif';
  ctx.fillStyle = '#7f899c'; ctx.textAlign = 'left';
  ctx.fillText(z.name.toUpperCase(), z.x + 12, z.y + 19);
  if(n){
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e8ebf2'; ctx.font = '700 12px -apple-system,Segoe UI,Roboto,sans-serif';
    ctx.fillText(String(n), z.x + z.w - 12, z.y + 19);
  }
  ctx.textAlign = 'left';
};

MapView.prototype._entity = function(e, p){
  var ctx = this.ctx;
  var on = this._matches(e);
  var col = statusColor(e.status);
  ctx.save();
  ctx.globalAlpha = on ? 1 : 0.16;
  ctx.translate(p.x, p.y);
  if(e.kind === 'aircraft' && p.dir < 0) ctx.scale(-1,1);

  if(e === this.selected){
    ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2);
    ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 2; ctx.stroke();
  } else if(on && this.query){
    ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  if(e.status === 'moving'){                              /* motion halo */
    ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2);
    ctx.fillStyle = col; ctx.globalAlpha = on ? 0.12 : 0.04; ctx.fill();
    ctx.globalAlpha = on ? 1 : 0.16;
  }

  ctx.fillStyle = col; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 1.5;
  switch(e.kind){
    case 'aircraft':
      ctx.beginPath();
      ctx.moveTo(9,0); ctx.lineTo(-1,3); ctx.lineTo(-2,9); ctx.lineTo(-5,9);
      ctx.lineTo(-4,2.5); ctx.lineTo(-8,2); ctx.lineTo(-8,-2); ctx.lineTo(-4,-2.5);
      ctx.lineTo(-5,-9); ctx.lineTo(-2,-9); ctx.lineTo(-1,-3); ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    case 'vehicle':
      this._round(-8,-5,16,10,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(10,12,18,.55)'; ctx.fillRect(-3,-5,5,10);
      break;
    case 'asset':
      ctx.fillRect(-6,-6,12,12); ctx.strokeRect(-6,-6,12,12);
      ctx.strokeStyle = 'rgba(10,12,18,.5)'; ctx.beginPath();
      ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.stroke();
      break;
    case 'package':
      ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(7,-2); ctx.lineTo(7,5);
      ctx.lineTo(0,9); ctx.lineTo(-7,5); ctx.lineTo(-7,-2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    default:                                              /* person */
      ctx.beginPath(); ctx.arc(0,-4,3.4,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4.5,7); ctx.quadraticCurveTo(-4.5,-0.5,0,-0.5);
      ctx.quadraticCurveTo(4.5,-0.5,4.5,7); ctx.closePath();
      ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  if(on && (e === this.selected || this.query || this.entities.length <= 45)){
    ctx.save();
    ctx.globalAlpha = e === this.selected ? 1 : 0.72;
    ctx.font = '10px -apple-system,Segoe UI,Roboto,sans-serif';
    ctx.fillStyle = e === this.selected ? '#e8ebf2' : '#99a2b4';
    ctx.textAlign = 'center';
    var t = e.label.length > 16 ? e.label.slice(0,15) + '…' : e.label;
    ctx.fillText(t, p.x, p.y + 20);
    ctx.restore();
  }
};

MapView.prototype._hit = function(ev){
  var r = this.cv.getBoundingClientRect();
  var sx = this.cv.width / r.width, sy = this.cv.height / r.height;
  var mx = (ev.clientX - r.left) * sx, my = (ev.clientY - r.top) * sy;
  var best = null, bd = 18*18, list = this._drawn || [];
  for(var i=0;i<list.length;i++){
    var e = list[i];
    if(!this._matches(e)) continue;
    var dx = e._x - mx, dy = e._y - my, d = dx*dx + dy*dy;
    if(d < bd){ bd = d; best = e; }
  }
  return best;
};

MapView.prototype._click = function(ev){
  var e = this._hit(ev);
  this.selected = e;
  if(this.opts.onSelect) this.opts.onSelect(e);
};

/* -------------------------------- exports -------------------------------- */

global.HQ = {
  esc:esc, fmtNum:fmtNum, isBlank:isBlank, toNum:toNum, toDate:toDate,
  parseAny:parseAny, profile:profile, makeDataset:makeDataset, loadSource:loadSource,
  LAYOUTS:LAYOUTS, inferMapping:inferMapping, guessKind:guessKind,
  classifyStatus:classifyStatus, statusColor:statusColor,
  STATUS_RULES:STATUS_RULES, STATUS_LABEL:STATUS_LABEL,
  matchZones:matchZones, buildEntities:buildEntities, MapView:MapView
};

})(typeof window !== 'undefined' ? window : this);
