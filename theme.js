/* Light / dark switch, shared by every page. Load it in <head> so the right
   theme is set before first paint. The choice is remembered, and a page that
   embeds others (the showcase) passes it down to its iframes.            */
(function(){
  'use strict';
  var KEY = 'hq_theme', root = document.documentElement, cur = 'light';
  try { if(localStorage.getItem(KEY) === 'dark') cur = 'dark'; } catch(e){}
  root.setAttribute('data-theme', cur);

  function tell(frame){
    try { frame.contentWindow.postMessage({ hqTheme: cur }, '*'); } catch(e){}
  }
  function apply(){
    root.setAttribute('data-theme', cur);
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for(var i=0;i<btns.length;i++){
      btns[i].textContent = cur === 'dark' ? '☀ Light mode' : '☾ Dark mode';
      btns[i].setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
    }
    var frames = document.querySelectorAll('iframe');
    for(var j=0;j<frames.length;j++) tell(frames[j]);
    try { window.dispatchEvent(new CustomEvent('hq-theme', { detail: cur })); } catch(e){}
  }

  window.HQTheme = {
    get: function(){ return cur; },
    set: function(t){
      cur = t === 'dark' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, cur); } catch(e){}
      apply();
    }
  };

  document.addEventListener('DOMContentLoaded', function(){
    apply();
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-theme-toggle]');
      if(b) window.HQTheme.set(cur === 'dark' ? 'light' : 'dark');
    });
    var frames = document.querySelectorAll('iframe');
    for(var j=0;j<frames.length;j++){
      frames[j].addEventListener('load', function(){ tell(this); });
    }
  });

  /* an embedded page follows its parent's switch */
  window.addEventListener('message', function(ev){
    if(ev.source !== window.parent || !ev.data) return;
    var t = ev.data.hqTheme;
    if((t === 'light' || t === 'dark') && t !== cur){ cur = t; apply(); }
  });
})();
