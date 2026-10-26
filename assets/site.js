/* theis-Website: Stil (Klar/Neon/Heft) merken, einmalige Frage, Kopfzeile, E-Mail-Links, mitlaufende Liste, Umschalter Mac/Windows, Bilder vergrößern. */
(function(){
  var KEY='theis-stil', SEEN='theis-stil-gefragt', r=document.documentElement, STILE=['normal','neon','heft'];
  /* Farbe der Browserleiste je Stil: [hell, dunkel] */
  var LEISTE={normal:['#ffffff','#121520'],neon:['#f6f0ff','#0e0818'],heft:['#f7f3e8','#1d2924']};
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
  function apply(st){
    r.setAttribute('data-style',st);
    document.querySelectorAll('.pick button').forEach(function(b){var on=b.dataset.s===st;b.setAttribute('aria-checked',on?'true':'false');b.tabIndex=on?0:-1});
    var c=LEISTE[st];document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=c[/dark/.test(m.media)?1:0]});
  }
  function choose(st,ev){if(st===current()){put(KEY,st);return}reveal(function(){apply(st)},ev);put(KEY,st);put(SEEN,'1');var t=document.getElementById('tip');if(t)t.remove()}
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
    var g=get(KEY);apply(STILE.indexOf(g)>=0?g:'normal');
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
    /* Beim ersten Besuch einmal auf die anderen Stile hinweisen */
    if(!get(SEEN)&&!get(KEY)&&document.querySelector('.pick')){
      setTimeout(function(){
        if(get(SEEN))return;
        var t=document.createElement('div');t.id='tip';t.setAttribute('role','dialog');t.setAttribute('aria-label','Stil der Website');
        t.innerHTML='<p><b>Lieber etwas anderes?</b>Die Seite gibt es auch bunt in Neon oder kariert wie ein Schulheft. Umschalten können Sie jederzeit oben.</p><div><button type="button" class="btn" data-s="neon">Neon</button><button type="button" class="btn" data-s="heft">Schulheft</button><button type="button" class="btn line" data-s="normal">So lassen</button></div>';
        t.addEventListener('click',function(e){var b=e.target.closest('button');if(b){var s=document.querySelector('.pick [data-s='+b.dataset.s+']');choose(b.dataset.s,s?{currentTarget:s}:null);put(SEEN,'1');t.remove()}});
        document.body.appendChild(t);
      },1600);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
