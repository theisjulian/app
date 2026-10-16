/* theis-Website: Stil (Normal/Neon) merken, einmalige Frage, Kopfzeile, E-Mail-Links, mitlaufende Liste, Umschalter Mac/Windows. */
(function(){
  var KEY='theis-stil', SEEN='theis-stil-gefragt', r=document.documentElement;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function apply(neon){r.setAttribute('data-style',neon?'neon':'normal');document.querySelectorAll('.sw').forEach(function(b){b.setAttribute('aria-checked',neon?'true':'false')})}
  function choose(neon){apply(neon);put(KEY,neon?'neon':'normal');put(SEEN,'1');var t=document.getElementById('tip');if(t)t.remove()}
  function ready(){
    apply(get(KEY)==='neon');
    document.querySelectorAll('.sw').forEach(function(b){b.addEventListener('click',function(){choose(r.getAttribute('data-style')!=='neon')})});
    var bar=document.querySelector('.bar');if(bar){var f=function(){bar.classList.toggle('on',scrollY>8)};addEventListener('scroll',f,{passive:true});f()}
    /* E-Mail-Adressen erst im Browser zusammensetzen */
    document.querySelectorAll('a.em').forEach(function(a){var m=a.dataset.u+'@'+a.dataset.d;a.href='mailto:'+m+(a.dataset.s?'?subject='+encodeURIComponent(a.dataset.s):'');if(a.textContent.indexOf('[at]')>=0)a.textContent=m});
    /* Programme auf der Startseite: Liste links zeigt, was gerade zu sehen ist */
    var links=[].slice.call(document.querySelectorAll('.idx a'));
    if(links.length&&'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})})},{rootMargin:'-45% 0px -50% 0px'});
      document.querySelectorAll('.panel').forEach(function(p){io.observe(p)});links[0].classList.add('on');
    }
    /* Installation: Reiter je Gerät, Windows-Rechner sehen gleich Windows */
    var seg=document.querySelector('.seg');
    if(seg){var bs=[].slice.call(seg.querySelectorAll('button'));
      var pick=function(t){bs.forEach(function(x){x.setAttribute('aria-selected',x.dataset.t===t?'true':'false')});document.querySelectorAll('[data-p]').forEach(function(p){p.hidden=p.dataset.p!==t})};
      bs.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.t)})});
      var ua=navigator.userAgent;var want=/Android/.test(ua)?'and':/Windows/.test(ua)?'win':/iPhone|iPad/.test(ua)?'web':null;
      if(want&&seg.querySelector('[data-t='+want+']'))pick(want);
    }
    /* Beim ersten Besuch einmal fragen, ob Neon gewünscht ist */
    if(!get(SEEN)&&!get(KEY)&&document.querySelector('.sw')){
      setTimeout(function(){
        if(get(SEEN))return;
        var t=document.createElement('div');t.id='tip';t.setAttribute('role','dialog');t.setAttribute('aria-label','Stil der Website');
        t.innerHTML='<p><b>Lieber etwas bunter?</b>Die Seite gibt es auch im Neon-Stil. Umschalten können Sie jederzeit oben.</p><div><button type="button" class="btn" data-n="1">Neon ansehen</button><button type="button" class="btn line" data-n="0">So lassen</button></div>';
        t.addEventListener('click',function(e){var b=e.target.closest('button');if(b)choose(b.dataset.n==='1')});
        document.body.appendChild(t);
      },1600);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
