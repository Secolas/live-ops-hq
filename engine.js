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
/* A site is named areas on a 1000×620 plan, each with a floor drawn in the
   same tiles as the production HQ map (office tile, hangar concrete, apron
   tarmac, runway asphalt, parking lot). Swap the plan and the same rows land
   somewhere else — that is all "fits my company" means here.                */

var LAYOUTS = {
  airfield: {
    label:'✈️ Flight school / airfield', kinds:['aircraft','person','vehicle'],
    zones:[
      {id:'ops',    name:'Ops office',  x:30,  y:30,  w:220, h:150, floor:'office'},
      {id:'class',  name:'Classrooms',  x:30,  y:196, w:220, h:180, floor:'office'},
      {id:'lot',    name:'Parking lot', x:30,  y:392, w:220, h:92,  floor:'lot'},
      {id:'hangar', name:'Hangar',      x:266, y:30,  w:270, h:454, floor:'concrete'},
      {id:'apron',  name:'Apron',       x:552, y:30,  w:418, h:300, floor:'tarmac'},
      {id:'ramp',   name:'Run-up area', x:552, y:346, w:418, h:138, floor:'tarmac'},
      {id:'runway', name:'Runway 18/36',x:30,  y:500, w:940, h:100, floor:'runway', road:true}
    ]
  },
  warehouse: {
    label:'📦 Warehouse / logistics', kinds:['asset','person','vehicle'],
    zones:[
      {id:'office',name:'Office',       x:30,  y:30,  w:180, h:160, floor:'office'},
      {id:'recv',  name:'Receiving',    x:30,  y:206, w:180, h:278, floor:'concrete'},
      {id:'a',     name:'Aisle A',      x:226, y:30,  w:136, h:454, floor:'concrete', racks:true},
      {id:'b',     name:'Aisle B',      x:378, y:30,  w:136, h:454, floor:'concrete', racks:true},
      {id:'c',     name:'Aisle C',      x:530, y:30,  w:136, h:454, floor:'concrete', racks:true},
      {id:'pack',  name:'Packing',      x:682, y:30,  w:288, h:140, floor:'concrete'},
      {id:'dock',  name:'Loading dock', x:682, y:186, w:288, h:150, floor:'tarmac'},
      {id:'yard',  name:'Yard',         x:682, y:352, w:288, h:132, floor:'lot'},
      {id:'gate',  name:'Gate road',    x:30,  y:500, w:940, h:100, floor:'road', road:true}
    ]
  },
  construction: {
    label:'🏗️ Construction / field site', kinds:['person','vehicle','asset'],
    zones:[
      {id:'office', name:'Site office',   x:30,  y:30,  w:220, h:160, floor:'office'},
      {id:'store',  name:'Material yard', x:30,  y:206, w:220, h:278, floor:'gravel'},
      {id:'za',     name:'Block A',       x:266, y:30,  w:340, h:220, floor:'dirt'},
      {id:'zb',     name:'Block B',       x:266, y:264, w:340, h:220, floor:'dirt'},
      {id:'crane',  name:'Crane pad',     x:622, y:30,  w:348, h:220, floor:'concrete'},
      {id:'plant',  name:'Plant & tools', x:622, y:264, w:348, h:220, floor:'tarmac'},
      {id:'gate',   name:'Site gate',     x:30,  y:500, w:940, h:100, floor:'road', road:true}
    ]
  },
  depot: {
    label:'🚚 Fleet depot / dispatch', kinds:['vehicle','truck','person','asset'],
    zones:[
      {id:'bays',  name:'Service bays', x:30,  y:30,  w:340, h:220, floor:'concrete'},
      {id:'wash',  name:'Wash',         x:386, y:30,  w:200, h:220, floor:'concrete'},
      {id:'fuel',  name:'Fuel island',  x:602, y:30,  w:368, h:220, floor:'tarmac'},
      {id:'lot',   name:'Vehicle lot',  x:30,  y:266, w:556, h:218, floor:'lot'},
      {id:'parts', name:'Parts store',  x:602, y:266, w:368, h:218, floor:'office'},
      {id:'road',  name:'Access road',  x:30,  y:500, w:940, h:100, floor:'road', road:true}
    ]
  }
};

/* --------------------------- field interpretation ------------------------ */

var KIND_WORDS = {
  aircraft:/aircraft|plane|tail|flight|airborne|cessna|piper|n\d{3}|rotor/i,
  truck   :/truck|lorry|trailer|haul|rig|tanker|freight|semi/i,
  vehicle :/vehicle|van|car|fleet|driver|tug|forklift|odometer|unit/i,
  person  :/employee|staff|person|people|student|instructor|technician|operator|crew|worker|name/i,
  asset   :/part|asset|tool|pallet|item|sku|stock|equipment|machine/i,
  package :/shipment|parcel|package|tracking|consignment|delivery|carrier/i
};

function guessKind(ds){
  var names = ds.cols.map(function(c){ return c.name; }).join(' ');
  var text = names + ' ' + ds.name;
  var order = ['aircraft','truck','package','vehicle','asset','person'];
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

function matchZones(values, zones, counts){
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
  /* leftovers: biggest group of rows to the biggest free area, then wrap */
  var area = function(z){ return z.w * z.h; };
  var free = zones.filter(function(z){ return !used[z.id] && !z.road; }).sort(function(a,b){ return area(b)-area(a); });
  var all  = zones.filter(function(z){ return !z.road; }).sort(function(a,b){ return area(b)-area(a); });
  var left = values.filter(function(v){ return !map[v].zone; });
  if(counts) left.sort(function(a,b){ return (counts[b]||0) - (counts[a]||0); });
  left.forEach(function(v, k){
    var pool = free.length ? free : all;
    map[v].zone = pool[k % pool.length];
  });
  return map;
}

/* ------------------------------- entities -------------------------------- */

var TRUCK_RE = /\b(truck|lorry|trailer|semi|rig|tanker|box truck|hgv)\b/i;
var CAR_RE   = /\b(van|car|sedan|pickup|suv|tug|forklift|cart|wagon)\b/i;

function rowText(row, skip){
  var t = '';
  for(var k in row){
    if(!Object.prototype.hasOwnProperty.call(row,k) || (skip && skip[k])) continue;
    t += ' ' + row[k];
  }
  return t;
}

/* A fleet file mixes vans and trucks: within the vehicle family, each row's
   own words decide which sprite it gets. */
function rowKind(row, base){
  if(base !== 'vehicle' && base !== 'truck') return base;
  var text = rowText(row);
  if(TRUCK_RE.test(text)) return 'truck';
  if(CAR_RE.test(text)) return 'vehicle';
  return base;
}

/* People wear the same uniforms as on the production HQ map. */
var ROLE_RULES = [
  ['instructor', /instructor|pilot|captain|\bcfi\b|examiner|teacher|trainer|supervisor|manager|foreman/i],
  ['student',    /student|trainee|cadet|intern|apprentice|learner/i],
  ['mechanic',   /mechanic|technician|\btech\b|maint|engineer|line crew|crew|operator|driver|worker|labou?rer|fitter|welder/i],
  ['it',         /\bit\b|developer|dispatch|analyst|support/i]
];
function roleOf(text){
  for(var i=0;i<ROLE_RULES.length;i++){ if(ROLE_RULES[i][1].test(text)) return ROLE_RULES[i][0]; }
  return null;
}
function rowModel(row){
  for(var k in row){
    var m = /^(C?15[02]|C?17[02]|C?182|PA-?\d+|P2006|SR2[02]|DA4\d|BE\d+)/i.exec(String(row[k]||'').trim());
    if(m) return m[1].toUpperCase();
  }
  return 'C172';
}

/* Native sprite sizes in art pixels (16 = one production map tile). */
var FOOT = { person:[16,16], vehicle:[24,14], truck:[40,16], aircraft:[48,64], asset:[14,14], package:[13,12] };
var TAG_H = 17, TAG_W = 62, PAD_X = 14, PAD_TOP = 30, PAD_BOT = 8, RACK_W = 22;

function needOf(kind, P, office, noTag){
  var f = FOOT[kind] || FOOT.person;
  var desk = (office && kind === 'person') ? 15*P : 0;
  return noTag ? { w: f[0]*P + 8, h: f[1]*P + desk + 8, desk: desk }
               : { w: Math.max(f[0]*P + 8, TAG_W), h: f[1]*P + TAG_H + desk + 6, desk: desk };
}

function packZone(z, list, P, noTag){
  var office = z.floor === 'office';
  var need = { w:0, h:0, desk:0 };
  list.forEach(function(e){
    var n = needOf(e.kind, P, office, noTag);
    need.w = Math.max(need.w, n.w); need.h = Math.max(need.h, n.h); need.desk = Math.max(need.desk, n.desk);
  });
  var rack = z.racks ? RACK_W : 0;
  var availW = Math.max(30, z.w - 2*PAD_X - 2*rack), availH = Math.max(30, z.h - PAD_TOP - PAD_BOT);
  var n = list.length, best = -1, cols = 1;
  for(var c=1;c<=n;c++){
    var s = Math.min((availW/c)/need.w, (availH/Math.ceil(n/c))/need.h);
    if(s > best){ best = s; cols = c; }
  }
  return { cols:cols, rows:Math.ceil(n/cols), stepX:availW/cols, stepY:availH/Math.ceil(n/cols),
           x0: z.x + PAD_X + rack, y0: z.y + PAD_TOP, need:need, score:best };
}

function buildEntities(ds, mapping, layout, presetZoneMap){
  var zones = layout.zones;
  var values = [], seen = {}, i;
  if(mapping.zone){
    for(i=0;i<ds.rows.length;i++){
      var v = isBlank(ds.rows[i][mapping.zone]) ? '—' : String(ds.rows[i][mapping.zone]);
      if(!seen[v]){ seen[v]=0; values.push(v); }
      seen[v]++;
    }
  }
  var zmap = presetZoneMap || matchZones(values, zones, seen);
  var placeable = zones.filter(function(z){ return !z.road; });
  var road = zones.filter(function(z){ return z.road; })[0] || null;

  /* a role can come from a column's values, or from what the columns are called */
  var skip = {}; [mapping.label, mapping.zone, mapping.status].forEach(function(c){ if(c) skip[c]=1; });
  var headerRole = roleOf(ds.cols.map(function(c){ return c.name; }).join(' '));

  var ents = ds.rows.map(function(row, idx){
    var zv = mapping.zone ? (isBlank(row[mapping.zone]) ? '—' : String(row[mapping.zone])) : null;
    var zone = (zv !== null && zmap[zv]) ? zmap[zv].zone : placeable[idx % placeable.length];
    var kind = rowKind(row, mapping.kind);
    return {
      i: idx, seed: (idx*7 + 3),
      label: mapping.label ? String(row[mapping.label]) : ('#' + (idx+1)),
      kind: kind,
      role: kind === 'person' ? (roleOf(rowText(row, skip)) || headerRole || 'frontdesk') : null,
      model: kind === 'aircraft' ? rowModel(row) : null,
      status: mapping.status ? classifyStatus(row[mapping.status]) : 'ok',
      zoneValue: zv, zone: zone, row: row
    };
  });

  var byZone = {};
  ents.forEach(function(e){
    if(road && e.status === 'moving') return;           /* drawn on the road, not in its area */
    (byZone[e.zone.id] = byZone[e.zone.id] || []).push(e);
  });

  /* One art-pixel size for the whole plan, like the production map: the
     biggest that lets every area hold its rows without overlap.          */
  var zids = Object.keys(byZone), quiet = {};
  function largestP(floor){
    for(var tryP = 2.0; tryP >= floor - 1e-9; tryP -= 0.05){
      var ok = zids.every(function(id){ return packZone(byZone[id][0].zone, byZone[id], tryP, quiet[id]).score >= 1; });
      if(ok) return tryP;
    }
    return null;
  }
  var P = largestP(1.25);
  if(P === null){
    /* Too crowded for every name tag at a readable size: like the production
       map, crowded areas go quiet (tags return on search or click) rather
       than shrinking the whole plan.                                       */
    zids.forEach(function(id){ if(packZone(byZone[id][0].zone, byZone[id], 1.25, false).score < 1) quiet[id] = true; });
    P = largestP(0.9) || 0.9;
  }

  zids.forEach(function(zid){
    var list = byZone[zid], z = list[0].zone, pk = packZone(z, list, P, quiet[zid]);
    list.forEach(function(e, k){
      var c = k % pk.cols, r = Math.floor(k / pk.cols);
      var f = FOOT[e.kind] || FOOT.person;
      var slack = Math.max(0, pk.stepY - pk.need.h) / 2;
      e.P = P; e.cellW = pk.stepX; e.dir = 'down'; e.quiet = !!quiet[zid];
      e.desk = pk.need.desk > 0 && e.kind === 'person';
      e.x = pk.x0 + pk.stepX*(c + 0.5);
      e.y = pk.y0 + pk.stepY*r + slack + (e.quiet ? 2 : TAG_H) + pk.need.desk + f[1]*P/2 + 3;
    });
  });

  if(road){
    var movers = ents.filter(function(e){ return e.status === 'moving'; });
    var planes = movers.filter(function(e){ return e.kind === 'aircraft'; });
    var others = movers.filter(function(e){ return e.kind !== 'aircraft'; });
    /* aircraft use the runway one way; everything else gets two opposite lanes */
    planes.forEach(function(e, k){
      e.P = Math.min(P, 1.35); e.cellW = 140;
      e.travel = { road:road, lane:-1, t:(k + 0.5)/planes.length, dir:1, speed:0.0009 };
    });
    var lanes = [[], []];
    others.forEach(function(e, k){ lanes[k % 2].push(e); });
    lanes.forEach(function(lane, li){
      lane.forEach(function(e, k){
        e.P = Math.min(P, 2); e.cellW = 140;
        e.travel = { road:road, lane:li, t:((k + 0.5 + li*0.5)/lane.length) % 1, dir: li ? -1 : 1, speed:0.0007 };
      });
    });
  }
  return { entities: ents, zoneMap: zmap, zoneValues: values, P: P };
}

/* ------------------------------ pixel art ------------------------------- */
/* Palettes and sprites ported from the production HQ map (presentation.html)
   so the two read as one product.                                          */

var ROLES = {
  instructor: { color:'#4ea8de', shirt:'#2c5f8a' },
  student:    { color:'#ffd23f', shirt:'#b8860b' },
  mechanic:   { color:'#ff6b3d', shirt:'#8a3a1a' },
  it:         { color:'#06d6a0', shirt:'#0a6e5a' },
  frontdesk:  { color:'#c77dff', shirt:'#6a3d99' }
};
var SKINS  = ['#f0c9a0','#e0b088','#c98d5f','#a5673f','#8a5230'];
var HAIR   = ['#2b1c10','#4a2f1a','#6b4423','#3a2a1a','#1a1a1a','#7a5a2a'];
var CASUAL = ['#4a78b5','#5a8f5a','#c46b3d','#7d5aa8','#3fa39a','#c9a24a','#b5566f','#5b6b8c'];

/* Draws art-pixel rects snapped to device pixels, so pixel art stays crisp
   at any size. o = 'up' | 'right' | 'left' | 'mirror' (exact 90° turns). */
function Pix(ctx, k, ox, oy, P, w0, h0, o){
  this.ctx=ctx; this.k=k; this.ox=ox; this.oy=oy; this.P=P; this.w0=w0; this.h0=h0; this.o=o||'up';
}
Pix.prototype.r = function(x,y,w,h,col){
  var X=x, Y=y, Wd=w, Ht=h;
  if(this.o === 'right'){ X = this.h0 - (y+h); Y = x; Wd = h; Ht = w; }
  else if(this.o === 'left'){ X = y; Y = this.w0 - (x+w); Wd = h; Ht = w; }
  else if(this.o === 'mirror'){ X = this.w0 - (x+w); }
  var k = this.k, P = this.P;
  var x0 = Math.round((this.ox + X*P)*k), y0 = Math.round((this.oy + Y*P)*k);
  var x1 = Math.round((this.ox + (X+Wd)*P)*k), y1 = Math.round((this.oy + (Y+Ht)*P)*k);
  if(x1 <= x0) x1 = x0 + 1;
  if(y1 <= y0) y1 = y0 + 1;
  this.ctx.fillStyle = col; this.ctx.fillRect(x0, y0, x1-x0, y1-y0);
};

var ART = {
  /* production drawChar: role uniforms, skin/hair palettes, walk frames */
  person: function(p, e, frame){
    var bob = frame===1 ? -1 : frame===3 ? 1 : 0, lo = frame % 2;
    var role = e.role || 'frontdesk', cfg = ROLES[role] || ROLES.frontdesk;
    var skin = SKINS[e.seed % SKINS.length], hairCol = HAIR[e.seed % HAIR.length];
    var casual = CASUAL[(e.seed*3+1) % CASUAL.length], longHair = (e.seed % 3) === 1;
    /* legs */
    var leg = role==='instructor' ? '#1a1e28' : role==='mechanic' ? cfg.shirt : role==='student' ? '#20293f' : '#39414f';
    p.r(5,13+bob,2,2+lo,leg); p.r(9,13+bob,2,2+(1-lo),leg);
    if(role !== 'it' && role !== 'frontdesk'){
      var shoe = role==='mechanic' ? '#2b2b2b' : '#14161c';
      p.r(5,15+bob,2,1,shoe); p.r(9,15+bob,2,1,shoe);
    }
    /* torso */
    if(role==='instructor'){
      p.r(5,7+bob,6,6,'#f2f3f5'); p.r(7,7+bob,2,5,'#1a2a45');
      p.r(4,7+bob,2,2,'#f0c000'); p.r(10,7+bob,2,2,'#f0c000'); p.r(6,9+bob,1,1,'#f0c000');
    } else if(role==='mechanic'){
      p.r(5,7+bob,6,6,cfg.shirt); p.r(5,7+bob,6,3,cfg.color);
      p.r(5,11+bob,6,1,'#3a3a3a'); p.r(6,11+bob,1,1,'#c9ced9');
    } else if(role==='it'){
      p.r(5,7+bob,6,6,casual); p.r(5,7+bob,6,1,'rgba(255,255,255,.45)');
      p.r(7,7+bob,1,4,'#c9ced9'); p.r(7,10+bob,2,2,'#1a1e28');
    } else if(role==='student'){
      p.r(5,7+bob,6,6,'#f2f3f5'); p.r(7,7+bob,2,4,'#2a3f63');
      p.r(4,7+bob,2,1,cfg.color); p.r(10,7+bob,2,1,cfg.color);
    } else {
      p.r(5,7+bob,6,6,casual); p.r(5,7+bob,6,1,'rgba(255,255,255,.45)'); p.r(7,7+bob,2,5,'rgba(20,22,28,.25)');
    }
    /* head, then cap or hair */
    p.r(5,3+bob,6,5,skin);
    if(role==='instructor'){
      p.r(4,1+bob,8,3,'#14203a'); p.r(4,3+bob,8,1,'#f0c000'); p.r(4,4+bob,8,1,'#0a0f1c'); p.r(7,1+bob,2,1,'#f0c000');
    } else if(role==='mechanic'){
      p.r(5,1+bob,6,2,cfg.color); p.r(4,3+bob,7,1,cfg.shirt);
    } else {
      p.r(5,2+bob,6,2,hairCol);
      if(e.dir !== 'down') p.r(5,2+bob,6,3,hairCol);
    }
    if(longHair){
      p.r(4,3+bob,1,5,hairCol); p.r(11,3+bob,1,5,hairCol);
      if(e.dir !== 'down') p.r(5,2+bob,6,2,hairCol);
    }
    if(e.dir === 'down'){ p.r(6,5+bob,1,1,'#14161c'); p.r(9,5+bob,1,1,'#14161c'); }
  },

  /* production drawDesk */
  desk: function(p, role){
    if(role==='frontdesk'){
      p.r(0,3,16,12,'#8a5a3a'); p.r(0,3,16,3,'#a9764f'); p.r(2,5,6,3,'#c77dff'); return;
    }
    p.r(1,3,14,11,'#9c6b3f'); p.r(1,3,14,3,'#b98a5e');
    if(role==='it'){ p.r(3,1,10,6,'#2b303b'); p.r(4,2,8,3,'#06d6a0'); }
    else if(role==='student' || role==='instructor'){ p.r(4,2,8,4,'#f4f4ef'); p.r(5,3,6,1,'#4ea8de'); }
    else if(role==='mechanic'){ p.r(3,2,4,2,'#c9ced9'); p.r(9,2,3,3,'#3a3a3a'); }
  },

  /* production drawCarSprite (horizontal, nose left), body in status colour */
  vehicle: function(p, e, frame, col){
    p.r(1,2,24,14,'rgba(0,0,0,.3)');
    p.r(0,0,24,14,col);
    p.r(2,2,4,10,'rgba(190,225,255,.78)');
    p.r(18,2,4,10,'rgba(190,225,255,.45)');
    p.r(8,3,9,8,'rgba(255,255,255,.16)');
    p.r(3,-1,4,2,'#0b0d12'); p.r(3,13,4,2,'#0b0d12'); p.r(17,-1,4,2,'#0b0d12'); p.r(17,13,4,2,'#0b0d12');
  },

  /* same flat style as the car: status-colour cab, white box trailer */
  truck: function(p, e, frame, col){
    p.r(1,2,40,15,'rgba(0,0,0,.3)');
    p.r(11,0,29,15,'#e3e5ea'); p.r(11,0,29,2,'#f4f5f7');
    p.r(18,2,1,11,'rgba(0,0,0,.12)'); p.r(25,2,1,11,'rgba(0,0,0,.12)'); p.r(32,2,1,11,'rgba(0,0,0,.12)');
    p.r(11,12,29,2,col);
    p.r(9,6,3,3,'#2b303b');
    p.r(0,1,10,13,col);
    p.r(2,3,3,9,'rgba(190,225,255,.78)');
    p.r(5,3,4,9,'rgba(255,255,255,.16)');
    p.r(2,-1,4,2,'#0b0d12'); p.r(2,14,4,2,'#0b0d12');
    p.r(27,-1,4,2,'#0b0d12'); p.r(33,-1,4,2,'#0b0d12'); p.r(27,15,4,2,'#0b0d12'); p.r(33,15,4,2,'#0b0d12');
  },

  /* production drawPlane (nose up), cheat line / fin / wingtips in status colour */
  aircraft: function(p, e, frame, col, moving){
    var M = (e.model || '').toUpperCase();
    var twin = /^PA|^P2006|^BE|^DA4|SENECA|SEMINOLE/.test(M) && !/^PA-?28/.test(M);
    var is152 = /^C?152/.test(M);
    var big = twin || /^C?172/.test(M) || (!is152 && M.length > 4);
    var body='#f4f5f7', trim=col, metal='#c9ced9', eng='#2f3540', spin='rgba(240,240,240,.7)';
    var fusW = twin ? 14 : (is152 ? 10 : 12);
    var fusL = Math.round(24 - fusW/2);
    var noseY = big ? 1 : 4, tailY = is152 ? 58 : 61;
    var wingW = is152 ? 38 : 48, wingX = Math.round((48 - wingW)/2), wingY = 15;
    p.r(16, tailY-2, 16, 3, metal); p.r(21, tailY-4, 4, 5, trim);
    p.r(fusL, noseY+2, fusW, (tailY-1)-(noseY+2), body); p.r(fusL+1, noseY, fusW-2, 3, body);
    p.r(fusL, 17, fusW, 2, trim);
    p.r(wingX, wingY, wingW, 12, body); p.r(wingX, wingY, wingW, 2, metal); p.r(wingX, wingY+10, wingW, 2, trim);
    if(twin){
      var e1 = wingX + Math.round(wingW*0.18), e2 = wingX + wingW - Math.round(wingW*0.18) - 4;
      p.r(e1, wingY-3, 5, 7, eng); p.r(e2, wingY-3, 5, 7, eng);
      if(moving){ p.r(e1-1, wingY-6, 7, 2, spin); p.r(e2-1, wingY-6, 7, 2, spin); }
      else { p.r(e1-1, wingY-5, 7, 1, '#1a1e28'); p.r(e2-1, wingY-5, 7, 1, '#1a1e28'); }
    } else {
      p.r(wingX+3, wingY+3, 1, 4, '#9aa3b2'); p.r(wingX+wingW-4, wingY+3, 1, 4, '#9aa3b2');
      if(moving){ p.r(fusL-1, noseY-3, fusW+2, 2, spin); p.r(21, noseY-5, 2, 4, spin); }
      else { p.r(22, noseY-2, 2, 3, '#2b303b'); p.r(20, noseY-1, 6, 1, '#1a1e28'); }
    }
    p.r(fusL+2, noseY+4, fusW-4, big ? 5 : 4, '#2b4a6b'); p.r(fusL+2, noseY+4, fusW-4, 1, '#4a7bad');
  },

  /* wooden crate in the desk palette, status plate on the front */
  asset: function(p, e, frame, col){
    p.r(1,3,14,13,'rgba(0,0,0,.25)');
    p.r(0,1,14,13,'#9c6b3f'); p.r(0,1,14,3,'#b98a5e');
    p.r(0,8,14,1,'#7f5530'); p.r(0,1,1,13,'#7f5530'); p.r(13,1,1,13,'#7f5530');
    p.r(4,10,6,3,col);
  },

  /* taped carton with a status-colour address label */
  package: function(p, e, frame, col){
    p.r(1,2,13,12,'rgba(0,0,0,.25)');
    p.r(0,0,13,12,'#c49a6c'); p.r(0,0,13,3,'#d8b48a');
    p.r(5,0,3,12,'#e9dcc0');
    p.r(8,7,4,3,col);
  }
};

/* -------------------------------- renderer ------------------------------- */

var LW = 1000, LH = 620, TL = 24;          /* plan units; one floor tile */
var MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
var SHORT = { moving:'MOVING', ok:'READY', waiting:'IDLE', alert:'ATTN', off:'OFF' };

function MapView(canvas, opts){
  this.cv = canvas;
  this.ctx = canvas.getContext('2d');
  this.opts = opts || {};
  this.entities = [];
  this.layout = null;
  this.selected = null;
  this.query = '';
  this.k = 1;
  this._floor = null;
  this.readTheme();
  this._fit();
  var self = this;
  if(window.ResizeObserver){ new ResizeObserver(function(){ self._fit(); }).observe(canvas); }
  window.addEventListener('resize', function(){ self._fit(); });
  canvas.addEventListener('click', function(ev){ self._click(ev); });
  canvas.addEventListener('mousemove', function(ev){
    canvas.style.cursor = self._hit(ev) ? 'pointer' : 'default';
  });
}

/* Bitmap at device resolution, so snapped art pixels land on real pixels. */
MapView.prototype._fit = function(){
  var cssW = this.cv.clientWidth || LW, dpr = window.devicePixelRatio || 1;
  var w = Math.max(320, Math.round(cssW * dpr));
  if(w === this.cv.width && this._floor) return;
  this.cv.width = w; this.cv.height = Math.round(w * LH / LW);
  this.k = w / LW; this._floor = null;
};

MapView.prototype.set = function(layout, entities){
  this.layout = layout; this.entities = entities; this.selected = null; this._floor = null;
};
MapView.prototype.setQuery = function(q){ this.query = String(q||'').trim().toLowerCase(); };

MapView.prototype.start = function(){
  if(this._raf) return;
  var self = this, last = 0;
  (function loop(ts){
    self._raf = requestAnimationFrame(loop);
    if(ts - last < 33) return;                                  /* ~30fps */
    last = ts; self.draw(ts);
  })(0);
};
MapView.prototype.stop = function(){ if(this._raf){ cancelAnimationFrame(this._raf); this._raf = null; } };

MapView.prototype._matches = function(e){
  if(!this.query) return true;
  return (e.label + ' ' + (e.zoneValue||'') + ' ' + e.status + ' ' + (e.role||'')).toLowerCase().indexOf(this.query) >= 0;
};

MapView.prototype.readTheme = function(){
  var cs = getComputedStyle(this.cv);
  var bg = cs.getPropertyValue('--map-bg');
  this.theme = { ground: (bg && bg.trim()) || '#1b1e26' };
  this._floor = null;
  return this.theme;
};

MapView.prototype._pos = function(e){
  if(e.travel){
    var r = e.travel.road, tr = e.travel;
    tr.t += tr.speed * tr.dir;
    if(tr.t > 1) tr.t -= 1;                                 /* leave one end, come back at the other */
    if(tr.t < 0) tr.t += 1;
    var y = tr.lane < 0 ? r.y + r.h/2 : r.y + r.h/2 + (tr.lane ? 26 : -26);
    return { x: r.x + 30 + tr.t*(r.w - 60), y: y, moving:true, dir:tr.dir };
  }
  return { x:e.x, y:e.y, moving:false, dir:1 };
};

/* ----- floors (static, cached until the plan, size or theme changes) ----- */

MapView.prototype._snapRect = function(c, x, y, w, h, col){
  var k = this.k, x0 = Math.round(x*k), y0 = Math.round(y*k);
  c.fillStyle = col; c.fillRect(x0, y0, Math.max(1, Math.round((x+w)*k) - x0), Math.max(1, Math.round((y+h)*k) - y0));
};

MapView.prototype._tiles = function(c, z, a, b, pattern){
  for(var ty=0; ty*TL < z.h; ty++) for(var tx=0; tx*TL < z.w; tx++){
    var w = Math.min(TL, z.w - tx*TL), h = Math.min(TL, z.h - ty*TL);
    this._snapRect(c, z.x + tx*TL, z.y + ty*TL, w, h, pattern(tx,ty) ? a : b);
  }
};

MapView.prototype._buildFloor = function(){
  var cv = document.createElement('canvas');
  cv.width = this.cv.width; cv.height = this.cv.height;
  var c = cv.getContext('2d'), k = this.k, self = this;
  c.fillStyle = this.theme.ground; c.fillRect(0, 0, cv.width, cv.height);
  if(!this.layout){ this._floor = cv; return; }

  var counts = {};
  this.entities.forEach(function(e){
    var id = e.travel ? e.travel.road.id : e.zone.id;
    counts[id] = (counts[id]||0) + 1;
  });

  this.layout.zones.forEach(function(z){
    var R = function(x,y,w,h,col){ self._snapRect(c, x, y, w, h, col); };
    var checker = function(x,y){ return (x+y) % 2; };
    switch(z.floor){
      case 'office':
        self._tiles(c, z, '#e8e6df', '#dedcd3', checker);
        R(z.x, z.y, z.w, 6, '#3a4050'); R(z.x, z.y+z.h-6, z.w, 6, '#3a4050');
        R(z.x, z.y, 6, z.h, '#3a4050'); R(z.x+z.w-6, z.y, 6, z.h, '#3a4050');
        R(z.x, z.y+6, z.w, 2, '#2f3542');
        R(z.x + z.w/2 - 18, z.y+z.h-6, 36, 6, '#7c8696');               /* door */
        break;
      case 'concrete':
        self._tiles(c, z, '#5a5f6b', '#565b66', checker);
        R(z.x, z.y, z.w, 5, '#3a4050'); R(z.x, z.y, 5, z.h, '#3a4050'); R(z.x+z.w-5, z.y, 5, z.h, '#3a4050');
        R(z.x, z.y+5, z.w, 2, '#2f3542');
        R(z.x+5, z.y+z.h-3, z.w-10, 3, 'rgba(240,165,0,.55)');           /* bay door line */
        break;
      case 'tarmac':
        self._tiles(c, z, '#3d4550', '#39414b', checker);
        R(z.x+10, z.y+z.h-12, z.w-20, 2, 'rgba(232,196,86,.6)');        /* taxi guide line */
        break;
      case 'lot':
        R(z.x, z.y, z.w, z.h, '#2f343d');
        c.strokeStyle = 'rgba(240,165,0,.55)'; c.lineWidth = Math.max(1, 2*k);
        c.strokeRect(Math.round((z.x+1)*k), Math.round((z.y+1)*k), Math.round((z.w-2)*k), Math.round((z.h-2)*k));
        for(var bx = z.x + 40; bx < z.x + z.w - 10; bx += 44){
          R(bx, z.y + 26, 1, Math.min(34, z.h*0.3), 'rgba(236,238,244,.45)');
          R(bx, z.y + z.h - 4 - Math.min(34, z.h*0.3), 1, Math.min(34, z.h*0.3), 'rgba(236,238,244,.45)');
        }
        break;
      case 'dirt':
        self._tiles(c, z, '#7a6648', '#735f42', checker);
        c.strokeStyle = 'rgba(240,165,0,.7)'; c.lineWidth = Math.max(1, 2*k); c.setLineDash([8*k, 6*k]);
        c.strokeRect(Math.round((z.x+2)*k), Math.round((z.y+2)*k), Math.round((z.w-4)*k), Math.round((z.h-4)*k));
        c.setLineDash([]);
        break;
      case 'gravel':
        self._tiles(c, z, '#7d7b74', '#77756e', checker);
        for(var s=0; s<z.w*z.h/180; s++){
          R(z.x + ((s*97) % z.w), z.y + ((s*53) % z.h), 1.5, 1.5, (s%3) ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)');
        }
        break;
      case 'runway':
        self._tiles(c, z, '#2a2e36', '#262a31', function(x){ return (x % 6) < 3; });
        R(z.x+8, z.y+8, z.w-16, 2, 'rgba(230,230,235,.55)');
        R(z.x+8, z.y+z.h-10, z.w-16, 2, 'rgba(230,230,235,.55)');
        for(var dx = z.x + 70; dx < z.x + z.w - 70; dx += 2*TL) R(dx, z.y + z.h/2 - 1, TL - 6, 2, '#d9c76a');
        [z.x + 14, z.x + z.w - 50].forEach(function(px){              /* threshold keys */
          for(var ky = z.y + 32; ky < z.y + z.h - 16; ky += 9) R(px, ky, 36, 4, 'rgba(236,238,244,.7)');
        });
        break;
      default:                                                        /* road */
        R(z.x, z.y, z.w, z.h, '#23262e');
        R(z.x, z.y, z.w, 1.5, '#5a6270'); R(z.x, z.y+z.h-1.5, z.w, 1.5, '#5a6270');
        for(var rx = z.x + 14; rx < z.x + z.w - 14; rx += 2*TL) R(rx, z.y + z.h/2 - 1, TL - 4, 2, 'rgba(232,196,86,.6)');
    }
    if(z.racks){                                                      /* warehouse shelving */
      [z.x + 6, z.x + z.w - 6 - RACK_W + 6].forEach(function(rx){
        R(rx, z.y + 12, RACK_W - 6, z.h - 24, '#4a505c');
        for(var sy = z.y + 16; sy < z.y + z.h - 22; sy += 20){
          R(rx + 2, sy, RACK_W - 10, 13, (sy/20) % 2 ? '#9c6b3f' : '#b98a5e');
          R(rx + 2, sy + 13, RACK_W - 10, 2, '#5b6270');
        }
      });
    }
    self._roomLabel(c, z, counts[z.id] || 0);
  });
  this._floor = cv;
};

/* production .roomlabel: yellow uppercase on a dark pill */
MapView.prototype._roomLabel = function(c, z, n){
  var k = this.k;
  c.save(); c.setTransform(k,0,0,k,0,0);
  c.font = '800 10.5px ' + MONO;
  var name = z.name.toUpperCase(), cnt = n ? '  ' + n : '';
  var w1 = c.measureText(name).width, w2 = n ? c.measureText(cnt).width : 0;
  var w = w1 + w2 + 12, h = 15, x = z.x + 12, y = z.y + 10;
  c.fillStyle = 'rgba(16,18,24,.72)'; roundPath(c, x, y, w, h, 5); c.fill();
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillStyle = '#f0a500'; c.fillText(name, x + 6, y + h/2 + 0.5);
  if(n){ c.fillStyle = '#e8ebf2'; c.fillText(cnt, x + 6 + w1, y + h/2 + 0.5); }
  c.restore();
};

/* ------------------------------- frame ---------------------------------- */

MapView.prototype.draw = function(ts){
  var ctx = this.ctx, k = this.k;
  if(!this._floor || this._floor.width !== this.cv.width) this._buildFloor();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1;
  ctx.drawImage(this._floor, 0, 0);
  if(!this.layout) return;

  var self = this, frame = Math.floor((ts || 0) / 160) % 4;
  var list = this.entities.map(function(e){
    var p = self._pos(e); e._x = p.x; e._y = p.y; e._p = p; return e;
  });
  list.sort(function(a,b){ return a._y - b._y; });               /* nearer things overlap farther ones */
  this._drawn = list;

  list.forEach(function(e){ self._sprite(e, e._p, frame); });
  list.forEach(function(e){ self._tag(e, e._p); });
  if(this.selected && this.selected._bb) this._brackets(this.selected._bb);
};

MapView.prototype._sprite = function(e, p, frame){
  var ctx = this.ctx, k = this.k, on = this._matches(e), col = statusColor(e.status);
  var f = FOOT[e.kind] || FOOT.person, P = e.P || 1.5;
  var orient = 'up', w = f[0]*P, h = f[1]*P;
  if(e.kind === 'aircraft' && p.moving){ orient = p.dir < 0 ? 'left' : 'right'; w = f[1]*P; h = f[0]*P; }
  else if((e.kind === 'vehicle' || e.kind === 'truck') && p.moving && p.dir > 0) orient = 'mirror';
  if(e.kind === 'person') e.dir = p.moving ? (p.dir > 0 ? 'right' : 'left') : 'down';
  var ox = p.x - w/2, oy = p.y - h/2;

  ctx.globalAlpha = on ? 1 : 0.22;
  ctx.setTransform(k,0,0,k,0,0);                                  /* soft ground shadows */
  if(e.kind === 'person'){
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(p.x, oy + 15*P, 5*P, 2*P, 0, 0, 7); ctx.fill();
  } else if(e.kind === 'aircraft'){
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, w*0.4, h*0.42, 0, 0, 7); ctx.fill();
  }
  ctx.setTransform(1,0,0,1,0,0);

  if(e.desk && !p.moving){
    ART.desk(new Pix(ctx, k, p.x - 8*P, oy - TAG_H - 15*P, P, 16, 16, 'up'), e.role);
  }
  ART[e.kind] ? ART[e.kind](new Pix(ctx, k, ox, oy, P, f[0], f[1], orient), e, p.moving ? frame : 0, col, p.moving)
              : ART.person(new Pix(ctx, k, ox, oy, P, 16, 16, 'up'), e, 0, col);
  ctx.globalAlpha = 1;
  var deskH = (e.desk && !p.moving) ? 15*P : 0;
  e._bb = [ox, oy - deskH - TAG_H, w, h + deskH + TAG_H];
};

/* Name tags in the production styles: dark pill with a status-colour top
   edge for people and things, white pill with a status chip for aircraft,
   status-colour text for vehicles.                                        */
MapView.prototype._tag = function(e, p){
  var on = this._matches(e);
  var many = this.entities.length > 60, sel0 = e === this.selected;
  if(!on || ((many || e.quiet) && !this.query && !sel0)) return;
  var ctx = this.ctx, k = this.k, col = statusColor(e.status);
  var f = FOOT[e.kind] || FOOT.person, P = e.P || 1.5, sel = e === this.selected;
  ctx.save(); ctx.setTransform(k,0,0,k,0,0);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  var maxW = Math.max(40, (e.cellW || 120) - 6);

  if(e.kind === 'aircraft'){
    ctx.font = '700 9.5px ' + MONO;
    var chip = SHORT[e.status], tw = ctx.measureText(e.label).width;
    ctx.font = '800 7.5px ' + MONO;
    var cw = ctx.measureText(chip).width + 6;
    var w = tw + cw + 12, h = 14, x = p.x - w/2, y = p.moving ? p.y - 7 : p.y + 6;
    ctx.fillStyle = 'rgba(255,255,255,.86)'; roundPath(ctx, x, y, w, h, 3); ctx.fill();
    ctx.strokeStyle = sel ? '#f0a500' : '#9aa3b2'; ctx.lineWidth = sel ? 1.5 : 1; ctx.stroke();
    ctx.fillStyle = '#1a1e28'; ctx.font = '700 9.5px ' + MONO; ctx.textAlign = 'left';
    ctx.fillText(e.label, x + 4, y + h/2 + 0.5);
    ctx.fillStyle = col; roundPath(ctx, x + 7 + tw, y + 2.5, cw, h - 5, 2.5); ctx.fill();
    ctx.fillStyle = '#10131a'; ctx.font = '800 7.5px ' + MONO; ctx.textAlign = 'center';
    ctx.fillText(chip, x + 7 + tw + cw/2, y + h/2 + 0.5);
    ctx.restore(); return;
  }

  var top = p.y - f[1]*P/2;
  var car = e.kind === 'vehicle' || e.kind === 'truck';
  ctx.font = (car ? '700 9.5px ' : (sel ? '700 10px ' : '10px ')) + MONO;
  var s = fitText(ctx, e.label, sel ? 400 : maxW - 10);
  var tw2 = ctx.measureText(s).width, w2 = tw2 + 10, h2 = 14;
  var x2 = p.x - w2/2, y2 = top - h2 - 3;
  if(car){
    ctx.fillStyle = 'rgba(16,18,24,.9)'; ctx.fillRect(x2, y2, w2, h2);
    ctx.fillStyle = col;
  } else {
    ctx.fillStyle = 'rgba(20,22,28,.84)'; roundPath(ctx, x2, y2, w2, h2, 3); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(x2 + 1, y2, w2 - 2, 2);            /* status edge, like .tag's border-top */
    ctx.fillStyle = '#f2f3f5';
  }
  if(sel){ ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 1.2; ctx.strokeRect(x2 - 0.5, y2 - 0.5, w2 + 1, h2 + 1); }
  ctx.fillText(s, p.x, y2 + h2/2 + 1);
  ctx.restore();
};

function fitText(ctx, s, maxW){
  if(ctx.measureText(s).width <= maxW) return s;
  while(s.length > 2 && ctx.measureText(s + '…').width > maxW) s = s.slice(0,-1);
  return s.replace(/[\s,.;-]+$/,'') + '…';
}

MapView.prototype._brackets = function(bb){
  var ctx = this.ctx, k = this.k, x = bb[0] - 4, y = bb[1] - 4, w = bb[2] + 8, h = bb[3] + 8, L = 7;
  ctx.save(); ctx.setTransform(k,0,0,k,0,0);
  ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(x, y+L); ctx.lineTo(x, y); ctx.lineTo(x+L, y);
  ctx.moveTo(x+w-L, y); ctx.lineTo(x+w, y); ctx.lineTo(x+w, y+L);
  ctx.moveTo(x+w, y+h-L); ctx.lineTo(x+w, y+h); ctx.lineTo(x+w-L, y+h);
  ctx.moveTo(x+L, y+h); ctx.lineTo(x, y+h); ctx.lineTo(x, y+h-L);
  ctx.stroke(); ctx.restore();
};

function roundPath(ctx,x,y,w,h,r){
  r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

MapView.prototype._hit = function(ev){
  var r = this.cv.getBoundingClientRect();
  var mx = (ev.clientX - r.left) * (LW / r.width), my = (ev.clientY - r.top) * (LH / r.height);
  var best = null, bd = Infinity, list = this._drawn || [];
  for(var i=0;i<list.length;i++){
    var e = list[i], b = e._bb;
    if(!b || !this._matches(e)) continue;
    if(mx < b[0]-4 || mx > b[0]+b[2]+4 || my < b[1]-4 || my > b[1]+b[3]+4) continue;
    var d = Math.pow(e._x - mx, 2) + Math.pow(e._y - my, 2);
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
