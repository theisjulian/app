/* theis-Website: Stil (Glas/Neon/Heft/Plakat/Desktop) merken, einmalige Frage, Kopfzeile, E-Mail-Links, mitlaufende Liste, Umschalter Mac/Windows, Bilder vergrößern. */
(function(){
  var KEY='theis-stil', SEEN='theis-stil-gefragt', r=document.documentElement, STILE=['normal','neon','heft','plakat','desktop'];
  /* Desktop: Seiten laufen dort als Fenster (iframe); im Fenster erscheint die Seite schlicht im Stil Glas, ohne Kopf- und Fußzeile */
  var EMB=false;try{EMB=self!==top&&!!parent.document.querySelector('.dk,.ct')}catch(e){}
  if(EMB)r.classList.add('emb');
  var ME=document.currentScript&&document.currentScript.src;
  /* Farbe der Browserleiste je Stil: [hell, dunkel] */
  var LEISTE={normal:['#eef1f8','#0a0c15'],neon:['#f6f0ff','#0e0818'],heft:['#f7f3e8','#1d2924'],plakat:['#1d35c8','#1d35c8'],desktop:['#dfe6ff','#0b1230']};
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Stilwechsel: der neue Stil breitet sich als Kreis vom Knopf aus (wo der Browser das kann) */
  function reveal(fn,ev){
    if(calm||!document.startViewTransition||!ev){fn();return}
    var b=ev.currentTarget&&ev.currentTarget.getBoundingClientRect?ev.currentTarget.getBoundingClientRect():{left:ev.clientX,top:ev.clientY,width:0,height:0};
    var x=b.left+b.width/2,y=b.top+b.height/2,R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    r.classList.add('vt-circle');var t=document.startViewTransition(fn);t.finished.then(function(){r.classList.remove('vt-circle')},function(){r.classList.remove('vt-circle')});
    t.ready.then(function(){document.documentElement.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+R+'px at '+x+'px '+y+'px)']},{duration:620,easing:'cubic-bezier(.2,.7,.2,1)',pseudoElement:'::view-transition-new(root)'})}).catch(function(){});
  }
  function current(){var s=r.getAttribute('data-style');return STILE.indexOf(s)>=0?s:'normal'}
  function desk(){
    if(EMB||window.theisDesk||document.getElementById('desk-js'))return;
    var base=ME?ME.replace(/site\.js.*$/,''):'/assets/';
    var l=document.createElement('link');l.rel='stylesheet';l.href=base+'desk.css'+DESKV;
    var sc=document.createElement('script');sc.id='desk-js';sc.src=base+'desk.js'+DESKV;
    l.onload=function(){document.body.appendChild(sc)};document.head.appendChild(l);
  }
  var DESKV='?v=2381d969eace';
  function apply(st){
    if(EMB&&st==='desktop')st='normal';
    r.setAttribute('data-style',st);
    if(st==='desktop')desk();
    document.querySelectorAll('.pick button').forEach(function(b){var on=b.dataset.s===st;b.setAttribute('aria-checked',on?'true':'false');b.tabIndex=on?0:-1});
    var c=LEISTE[st];document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=c[/dark/.test(m.media)?1:0]});
  }
  function choose(st,ev){if(st===current()){put(KEY,st);return}
    if(window.theisDesk){window.theisDesk.leave(st);return}reveal(function(){apply(st)},ev);put(KEY,st);put(SEEN,'1');var t=document.getElementById('tip');if(t)t.remove()}
  /* Bildschirmfotos vergrößern: das Bild wächst aus seiner Position heraus und kehrt beim Schließen dorthin zurück */
  function lightbox(){
    var imgs=[].slice.call(document.querySelectorAll('.pic img,.laptop .scr img,.app-stage.plain img')).filter(function(i){return !i.closest('a')});
    if(!imgs.length||!window.HTMLDialogElement)return;
    var d=document.createElement('dialog');d.className='lb';d.setAttribute('aria-label','Bild vergrößert');
    d.innerHTML='<img alt=""><p></p><button type="button" class="x" aria-label="Schließen"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
    document.body.appendChild(d);
    var big=d.querySelector('img'),cap=d.querySelector('p'),src=null,busy=false;
    function fly(from,back){
      var a=from.getBoundingClientRect(),z=big.getBoundingClientRect();
      if(calm||!a.width||!z.width||!big.animate)return null;
      var k='translate('+(a.left-z.left)+'px,'+(a.top-z.top)+'px) scale('+(a.width/z.width)+','+(a.height/z.height)+')';
      return big.animate({transform:back?['none',k]:[k,'none']},{duration:back?300:420,easing:'cubic-bezier(.2,.7,.2,1)',fill:back?'forwards':'none'});
    }
    function open(i){
      if(busy)return;src=i;big.src=i.currentSrc||i.src;big.alt=i.alt;
      var f=i.closest('figure'),fc=f&&f.querySelector('figcaption');cap.textContent=fc?fc.textContent:(i.alt&&!/Bildschirmfoto$/.test(i.alt)?i.alt:'');cap.hidden=!cap.textContent;
      d.classList.remove('out');d.showModal();i.style.visibility='hidden';
      var go=function(){fly(i,false)};if(big.complete)go();else big.onload=go;
    }
    function close(){
      if(busy||!d.open)return;busy=true;d.classList.add('out');cap.style.opacity=0;
      var a=src&&fly(src,true),done=function(){d.close();d.classList.remove('out');cap.style.opacity='';big.getAnimations().forEach(function(x){x.cancel()});if(src)src.style.visibility='';busy=false};
      if(a)a.finished.then(done,done);else done();
    }
    d.addEventListener('click',close);
    d.addEventListener('cancel',function(e){e.preventDefault();close()});
    d.addEventListener('close',function(){if(src)src.style.visibility=''});
    imgs.forEach(function(i){
      i.classList.add('zoom');i.tabIndex=0;i.setAttribute('role','button');i.setAttribute('aria-label','Vergrößern: '+(i.alt||'Bildschirmfoto'));
      i.addEventListener('click',function(){open(i)});
      i.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});
    });
  }
  function ready(){
    var g=get(KEY);if(g==='salbei'||g==='atelier'){g='plakat';put(KEY,g)}apply(STILE.indexOf(g)>=0?g:'normal');
    /* Stil-Auswahl: Klick oder Pfeiltasten wie bei Optionsfeldern */
    document.querySelectorAll('.pick').forEach(function(p){
      var bs=[].slice.call(p.querySelectorAll('button'));
      bs.forEach(function(b,n){
        b.addEventListener('click',function(e){choose(b.dataset.s,e)});
        b.addEventListener('keydown',function(e){var m={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!m)return;e.preventDefault();var t=bs[(n+m+bs.length)%bs.length];t.focus();choose(t.dataset.s,{currentTarget:t})});
      });
    });
    var bar=document.querySelector('.bar');if(bar){var f=function(){bar.classList.toggle('on',scrollY>8)};addEventListener('scroll',f,{passive:true});f()}
    /* Leiste unten: beim Runterscrollen weg, beim Hochscrollen oder am Seitenende wieder da */
    var dk=document.querySelector('.appdock');
    /* Plakat: Sticker „Programme“ klappt den Programm-Index auf (in den anderen Stilen per CSS ausgeblendet) */
    if(dk){var DS={libretto:'Noten',voce:'Mündliche Prüfungen',foliva:'Arbeitsblätter',aula:'Gruppen, Timer, Sitzplan',sportwahl:'Sportwahl Oberstufe',namo:'Schülerfahrten'};
      dk.querySelectorAll('a').forEach(function(a){var m=(a.getAttribute('href')||'').match(/([a-z]+)\/?$/);if(m&&DS[m[1]]){var em=document.createElement('em');em.textContent=DS[m[1]];a.appendChild(em)}});
      var tg=document.createElement('button');tg.type='button';tg.className='pk-tog';tg.setAttribute('aria-expanded','false');
      tg.innerHTML='<span class="pk-sq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Programme</b>';dk.appendChild(tg);
      var setOpen=function(o){dk.classList.toggle('open',o);tg.setAttribute('aria-expanded',o?'true':'false');tg.querySelector('b').textContent=o?'Schließen':'Programme';if(!o)dk.classList.remove('hide')};
      tg.addEventListener('click',function(e){e.stopPropagation();setOpen(!dk.classList.contains('open'))});
      document.addEventListener('click',function(e){if(dk.classList.contains('open')&&!dk.contains(e.target))setOpen(false)});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dk.classList.contains('open')){setOpen(false);tg.focus()}});
      new MutationObserver(function(){if(dk.classList.contains('hide')&&dk.classList.contains('open'))dk.classList.remove('hide')}).observe(dk,{attributes:true,attributeFilter:['class']});
    }
    if(dk){var ly=scrollY,tk=false,acc=0,ih=innerHeight;
      /* Erst nach einer bewussten Strecke umschalten (runter 40 px, hoch 90 px); Rucklern am Ende des Scrollens und Größenwechseln der Browserleiste wird nicht gefolgt */
      addEventListener('scroll',function(){if(tk)return;tk=true;requestAnimationFrame(function(){
        var y=scrollY,d=y-ly;ly=y;tk=false;
        if(innerHeight!==ih){ih=innerHeight;acc=0;return}
        if(y<=80){dk.classList.remove('hide');acc=0;return}
        if(y+innerHeight>=document.documentElement.scrollHeight-2||y<0){acc=0;return}
        if(d===0)return;
        if((d>0)!==(acc>0))acc=0;acc+=d;
        if(acc>40)dk.classList.add('hide');else if(acc<-90)dk.classList.remove('hide');
      })},{passive:true})}
    /* Bilder, die beim Laden noch unterhalb liegen, gleiten beim Scrollen einmal herein */
    if(!calm&&'IntersectionObserver' in window){
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io2.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      document.querySelectorAll('.fx .pic,.panel .pic,.pair figure,.vid,.steps li,.grid>div,.safe,.cup').forEach(function(el){if(el.getBoundingClientRect().top>innerHeight){el.classList.add('rv');io2.observe(el)}});
    }
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
    lightbox();
    /* Glas: Lichtreflex folgt dem Mauszeiger (nur Maus; eine Variable je Karte, kein Neuzeichnen der Seite) */
    if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!calm){
      var lit=null;document.addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('.steps li,.grid>div,.next,.pic,.mail');if(!c){lit=null;return}
        var b=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-b.left)+'px');c.style.setProperty('--my',(e.clientY-b.top)+'px');lit=c},{passive:true});
    }
    /* Download-Knopf oben: nennt das Gerät und öffnet unten gleich den passenden Reiter */
    document.querySelectorAll('a[data-dl]').forEach(function(a){
      var ua=navigator.userAgent,os=/iPhone|iPad|Android/.test(ua)?null:/Windows/.test(ua)?'win':/Mac/.test(ua)?'mac':null;
      if(!os||!document.querySelector('.seg [data-t='+os+']'))return;
      a.innerHTML=(os==='mac'?'Für Mac laden':'Für Windows laden')+'<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3v10M4.5 8.5 9 13l4.5-4.5M3.5 15.5h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      a.addEventListener('click',function(){var b=document.querySelector('.seg [data-t='+os+']');if(b)b.click()});
    });
    /* Beim ersten Besuch einmal dezent auf die anderen Stile hinweisen – erst wenn jemand liest, nie über dem Einstieg */
    if(!EMB&&!get(SEEN)&&!get(KEY)&&document.querySelector('.pick')){
      var shown=false,show=function(){
        if(shown||get(SEEN)||scrollY<innerHeight*.9)return;shown=true;removeEventListener('scroll',show);
        var t=document.createElement('div');t.id='tip';t.setAttribute('role','dialog');t.setAttribute('aria-label','Stil der Website');
        t.innerHTML='<p><b>Fünf Stile zur Wahl</b>Glas, Neon, Schulheft, Plakat oder Desktop – jederzeit oben umschaltbar.</p><div class="tip-s">'+
          [['normal','k','Glas'],['neon','n','Neon'],['heft','h','Heft'],['plakat','p','Plakat'],['desktop','d','Desktop']].map(function(x){return '<button type="button" data-s="'+x[0]+'"'+(x[0]==='normal'?' aria-pressed="true"':'')+'><i class="'+x[1]+'"></i>'+x[2]+'</button>'}).join('')+
          '</div><button type="button" class="tip-x" aria-label="Hinweis schließen"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4 4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>';
        t.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;put(SEEN,'1');
          if(b.dataset.s){var s=document.querySelector('.pick [data-s='+b.dataset.s+']');choose(b.dataset.s,s?{currentTarget:s}:null)}
          t.classList.add('out');setTimeout(function(){t.remove()},250)});
        document.body.appendChild(t);
      };
      addEventListener('scroll',show,{passive:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
