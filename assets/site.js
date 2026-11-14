/* theis-Website: Stil (Glas/Neon/Heft/Datenblatt/Terminal) merken, einmalige Frage, Kopfzeile, E-Mail-Links, mitlaufende Liste, Umschalter Mac/Windows, Bilder vergrößern. */
(function(){
  var KEY='theis-stil', SEEN='theis-stil-gefragt', r=document.documentElement, STILE=['normal','neon','heft','blatt','term'];
  var ME=document.currentScript&&document.currentScript.src;
  /* Farbe der Browserleiste je Stil: [hell, dunkel] */
  var LEISTE={normal:['#eef1f8','#0a0c15'],neon:['#f6f0ff','#0e0818'],heft:['#f7f3e8','#1d2924'],blatt:['#eef3f8','#0c2747'],term:['#0b0e0d','#0b0e0d']};
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
    if(st==='term'){boot();if(boot.ready)typer()}
    var c=LEISTE[st];document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=c[/dark/.test(m.media)?1:0]});
  }
  function choose(st,ev){if(st===current()){put(KEY,st);return}
    reveal(function(){apply(st)},ev);put(KEY,st);put(SEEN,'1');var t=document.getElementById('tip');if(t)t.remove()}
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

  /* ===== Datenblatt und Terminal: Zusatzteile. Werden einmal angelegt und per CSS nur im jeweiligen Stil gezeigt ===== */
  var ROOT=ME?ME.replace(/assets\/site\.js.*$/,''):'/';
  var APPS=[['libretto','Libretto','Noten','noten notenbuch zeugnis gso schulaufgabe notenschlüssel durchschnitt w-seminar kalender'],['voce','Voce','Mündliche Prüfungen','mündlich prüfung bewertung raster fremdsprache englisch italienisch'],['foliva','Foliva','Arbeitsblätter','arbeitsblatt probe lösung vorlage grundschule test'],['aula','Aula','Gruppen, Timer, Sitzplan','gruppen timer sitzplan beamer uhr stundenplan klassenzimmer zufall'],['sportwahl','Sportivo','Sportwahl Oberstufe','sport sportwahl oberstufe q12 q13 kurse mebis'],['namo','’namo.','Schülerfahrten','klassenfahrt studienfahrt reise ausflug zimmer tickets handy']];
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
  function esc(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function pageName(){var t=document.title.split(' · ')[0];return t.replace(/\s+[–-]\s+.*$/,'')||'theisapps'}
  function slug(){var p=location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'');var m=p.match(/([^\/]+)\/?$/);return m?m[1]:'start'}
  function extras(){
    var main=document.querySelector('main'),foot=document.querySelector('footer');
    if(main){var sg=slug();main.setAttribute('data-cmd',sg==='start'?'cat README.md':document.querySelector('.doc')?'less '+sg+'.txt':'man '+sg)}
    /* Bilder: Maße und Dateiname für Bemaßung (Datenblatt) und Fenstertitel (Terminal); Abbildungsnummer */
    var n=0;document.querySelectorAll('.pic,.app-stage,.stage,.vid').forEach(function(b){
      var i=b.querySelector('img,video');if(!i)return;var src=(i.getAttribute('src')||i.getAttribute('poster')||'').split('?')[0].split('/').pop();
      var w=i.getAttribute('width'),h=i.getAttribute('height');n++;
      b.setAttribute('data-f',src||'bild');if(w&&h)b.setAttribute('data-dim',w+' × '+h);b.setAttribute('data-abb','Abb. '+(n<10?'0':'')+n);
    });
    /* Datenblatt: Zeichnungsrahmen mit Feldeinteilung und Schriftfeld am Seitenende */
    var fr=el('div','bp-frame');fr.setAttribute('aria-hidden','true');
    fr.innerHTML='<div class="bp-top">'+[1,2,3,4,5,6,7,8].map(function(x){return '<i>'+x+'</i>'}).join('')+'</div><div class="bp-side">'+'ABCDEF'.split('').map(function(x){return '<i>'+x+'</i>'}).join('')+'</div>';
    document.body.appendChild(fr);
    var d=new Date(document.lastModified);if(isNaN(d))d=new Date();
    var dat=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear();
    var nr=0;for(var k=0;k<location.pathname.length;k++)nr=(nr*31+location.pathname.charCodeAt(k))%9000;
    var tb=el('div','bp-tb');tb.setAttribute('aria-hidden','true');
    tb.innerHTML='<div class="c1"><small>Benennung</small><b>'+esc(pageName())+'</b></div><div><small>Zeichnungs-Nr.</small><b>TA-'+(1000+nr)+'</b></div><div><small>Maßstab</small><b>1 : 1</b></div><div><small>Blatt</small><b>1 / 1</b></div><div><small>Datum</small><b>'+dat+'</b></div><div><small>Gezeichnet</small><b>theisapps</b></div><div><small>Werkstoff</small><b>HTML, CSS, etwas JS</b></div><div><small>Daten</small><b>bleiben lokal</b></div>';
    if(foot)foot.insertBefore(tb,foot.firstChild);
    if('IntersectionObserver' in window){var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){tb.classList.add('in');so.disconnect()}})},{threshold:.6});so.observe(tb)}else tb.classList.add('in');
    /* Datenblatt: Fadenkreuz mit Koordinaten in Millimetern und Feld (z. B. C4), Feld im Rahmen leuchtet mit */
    if(!calm&&matchMedia('(hover:hover) and (pointer:fine)').matches){
      var ch=el('div','bp-cross','<i class="h"></i><i class="v"></i><b></b>');ch.setAttribute('aria-hidden','true');document.body.appendChild(ch);
      var chH=ch.children[0],chV=ch.children[1],chL=ch.children[2],tops=fr.querySelectorAll('.bp-top i'),sides=fr.querySelectorAll('.bp-side i'),lastT=-1,lastS=-1,raf=0,px=0,py=0;
      var mm=function(v){return Math.round(v*.2646)};
      var draw=function(){raf=0;
        chH.style.transform='translateY('+py+'px)';chV.style.transform='translateX('+px+'px)';
        var t=Math.min(7,Math.max(0,Math.floor((px-16)/(innerWidth-32)*8))),sd=Math.min(5,Math.max(0,Math.floor((py-16)/(innerHeight-32)*6)));
        if(t!==lastT){if(tops[lastT])tops[lastT].classList.remove('on');tops[t].classList.add('on');lastT=t}
        if(sd!==lastS){if(sides[lastS])sides[lastS].classList.remove('on');sides[sd].classList.add('on');lastS=sd}
        chL.textContent='ABCDEF'[sd]+(t+1)+'  X '+mm(px)+'  Y '+mm(py+scrollY)+' mm';
        var fl=px>innerWidth-220,fu=py>innerHeight-60;chL.style.transform='translate('+(fl?px-14:px+14)+'px,'+(fu?py-34:py+14)+'px)'+(fl?' translateX(-100%)':'');
      };
      document.addEventListener('pointermove',function(e){if(current()!=='blatt'||e.pointerType!=='mouse'){ch.classList.remove('on');return}
        px=e.clientX;py=e.clientY;ch.classList.add('on');if(!raf)raf=requestAnimationFrame(draw)},{passive:true});
      document.documentElement.addEventListener('mouseleave',function(){ch.classList.remove('on')});
      addEventListener('scroll',function(){if(ch.classList.contains('on')&&!raf)raf=requestAnimationFrame(draw)},{passive:true});
    }
    /* Terminal: Statuszeile mit Befehlseingabe */
    var sl=el('div','tm-status');
    sl.innerHTML='<span class="m">NORMAL</span><span class="f">~/'+esc(slug()==='start'?'':slug())+'</span><span class="s"></span><form class="tm-cmd" role="search"><label><span>:</span><input type="text" name="c" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Befehl eingeben, zum Beispiel hilfe" placeholder="hilfe eingeben oder 1–6 drücken"></label></form><span class="p">0%</span><span class="t"></span>';
    document.body.appendChild(sl);
    var out=el('div','tm-out');out.setAttribute('role','status');out.setAttribute('aria-live','polite');document.body.appendChild(out);
    /* Statuszeile zeigt den Abschnitt, der gerade zu lesen ist */
    var secEl=sl.querySelector('.s'),hs=[].slice.call(document.querySelectorAll('main h2'));
    if(hs.length&&'IntersectionObserver' in window){var ho=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)secEl.textContent='§ '+e.target.textContent.replace(/\s+/g,' ').trim()})},{rootMargin:'0px 0px -70% 0px'});hs.forEach(function(h){ho.observe(h)})}
    var inp=sl.querySelector('input'),pct=sl.querySelector('.p'),clk=sl.querySelector('.t');
    var tick=function(){var t=new Date();clk.textContent=('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2)};tick();setInterval(tick,20000);
    var sc=function(){var m=document.documentElement.scrollHeight-innerHeight;pct.textContent=(m>0?Math.round(scrollY/m*100):100)+'%'};addEventListener('scroll',sc,{passive:true});sc();
    var say=function(h){out.innerHTML=h;out.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){out.classList.remove('on')},h.length>200?14000:6000)};
    var go=function(u){location.href=u};
    var HELP='<b>Befehle</b><br>'+APPS.map(function(a,i){return '<kbd>'+(i+1)+'</kbd> '+a[0]}).join('  ')+'<br><kbd>ls</kbd> alle Programme · <kbd>cd ..</kbd> Startseite · <kbd>kontakt</kbd> · <kbd>datenschutz</kbd> · <kbd>impressum</kbd><br><kbd>grep wort</kbd> Programm suchen · <kbd>neofetch</kbd> · <kbd>date</kbd> · <kbd>uptime</kbd> · <kbd>fortune</kbd><br><kbd>top</kbd> nach oben · <kbd>stil glas</kbd> / neon / heft / datenblatt · <kbd>clear</kbd> · <i>Tab ergänzt, ↑ ↓ blättert</i>';
    var run=function(c){c=c.trim().toLowerCase().replace(/^[:\/$]\s*/,'');if(!c)return;
      var a=c.split(/\s+/),w=a[0],arg=a[1]||'';
      if(w==='cd'){w=arg.replace(/\/$/,'')||'..'}
      if(w==='open'||w==='man')w=arg;
      var app=APPS.filter(function(x){return x[0]===w||x[1].toLowerCase().replace(/[’.]/g,'')===w.replace(/[’.]/g,'')||(w==='sportivo'&&x[0]==='sportwahl')})[0];
      if(/^[1-6]$/.test(w))app=APPS[+w-1];
      if(app)return go(ROOT+app[0]+'/');
      if(w==='..'||w==='~'||w==='start'||w==='home')return go(ROOT);
      if(w==='hilfe'||w==='help'||w==='?')return say(HELP);
      if(w==='ls'||w==='ll'||w==='dir')return say(APPS.map(function(x,i){return '<a href="'+ROOT+x[0]+'/">'+(i+1)+'  '+esc(x[1])+'</a>  <i>'+esc(x[2])+'</i>'}).join('<br>'));
      if(w==='kontakt'||w==='mail')return go(ROOT+'#kontakt');
      if(w==='datenschutz'||w==='impressum'||w==='lizenz')return go(ROOT+w);
      if(w==='top'||w==='gg')return scrollTo({top:0,behavior:calm?'auto':'smooth'});
      if(w==='clear'||w==='q'||w==='exit'){out.classList.remove('on');return}
      if(w==='whoami')return say('Julian, Lehrer für Englisch und Italienisch, schreibt Programme für den Schulalltag.');
      if(w==='stil'||w==='theme'){var m={glas:'normal',normal:'normal',neon:'neon',heft:'heft',schulheft:'heft',datenblatt:'blatt',blatt:'blatt',blaupause:'blatt',terminal:'term'}[arg];
        if(m){var b=document.querySelector('.pick [data-s='+m+']');choose(m,b?{currentTarget:b}:null);return}return say('stil: glas, neon, heft, datenblatt oder terminal')}
      if(w==='neofetch'||w==='info')return say('<pre class="nf">'+
        '<b>   ▄▄  </b>  <b>theisapps</b>@schule\n<b>  ████ </b>  ─────────────────\n<b>  ████ </b>  <i>System</i>    Schulalltag Bayern\n<b> ▄████▄</b>  <i>Programme</i> 6 (libretto voce foliva aula sportivo namo)\n<b> ██████</b>  <i>Konto</i>     keins nötig\n<b> ██  ██</b>  <i>Server</i>    keiner (außer ’namo., EU)\n<b> ██  ██</b>  <i>Tracking</i>  aus\n<b>       </b>  <i>Stil</i>      terminal\n<b>       </b>  <i>Autor</i>     Julian, Lehrer in München\n<b>       </b>  <span class="sw"><i></i><i></i><i></i><i></i><i></i><i></i></span></pre>');
      if(w==='grep'||w==='suche'||w==='find'){var q=a.slice(1).join(' ').replace(/['"]/g,'');if(!q)return say('grep: Suchwort fehlt – z. B. <kbd>grep zeugnis</kbd>');
        var hit=APPS.filter(function(x){return (x[1]+' '+x[2]+' '+x[3]).toLowerCase().indexOf(q)>=0});
        return say(hit.length?hit.map(function(x){return '<a href="'+ROOT+x[0]+'/">'+x[0]+'</a><i>:</i> '+esc(x[2])+' <i>– passt zu „'+esc(q)+'“</i>'}).join('<br>'):'grep: kein Treffer für „'+esc(q)+'“')}
      if(w==='date'){var dt=new Date(),sj=dt.getMonth()>=7?dt.getFullYear():dt.getFullYear()-1;return say(dt.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' · Schuljahr '+sj+'/'+String(sj+1).slice(-2))}
      if(w==='uptime'){var n=new Date(),y=n.getMonth()>=7?n.getFullYear():n.getFullYear()-1,st=new Date(y,8,15),en=new Date(y+1,6,31),dd=Math.max(0,Math.round((n-st)/864e5)),rest=Math.max(0,Math.round((en-n)/864e5));
        return say('Schuljahr läuft seit '+dd+' Tagen · noch etwa '+rest+' Tage bis zu den Sommerferien · Last: Korrekturen hoch')}
      if(w==='fortune'){var F=['„Wer nachrechnen muss, hat keine Zeit zum Unterrichten.“','Tipp: In Libretto reicht Note, Enter, nächste Person.','Die Kaffeemaschine im Lehrerzimmer ist der wahre Server.','Noten gehören auf Ihr Gerät, nicht in eine Cloud.','Murphys Gesetz der Schule: Der Beamer streikt nur bei Besuch.','Aula bildet Gruppen schneller, als die Klasse „Ich will mit …“ sagen kann.'];return say(F[Math.floor(Math.random()*F.length)])}
      if(w==='cowsay'||w==='muh'){var tx=esc(a.slice(1).join(' ')||'Muh. Keine Cookies hier.');var ln=Math.min(tx.length,46);
        return say('<pre> '+'_'.repeat(ln+2)+'\n< '+tx+' >\n '+'-'.repeat(ln+2)+'\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||</pre>')}
      if(w==='history')return say(hist.length?hist.map(function(h,i){return '<i>'+(i+1)+'</i>  '+esc(h)}).join('<br>'):'Noch keine Befehle.');
      if(w==='sudo')return say('Netter Versuch. Hier gibt es nichts zu verwalten – alles läuft auf Ihrem Gerät.');
      say('Befehl nicht gefunden: '+esc(w)+' – <kbd>hilfe</kbd> zeigt alle Befehle.');
    };
    var hist=[],hi=0,CMDS=['hilfe','ls','cd','kontakt','datenschutz','impressum','lizenz','top','clear','whoami','stil','neofetch','grep','date','uptime','fortune','cowsay','history','sudo'].concat(APPS.map(function(x){return x[0]}),['sportivo']);
    sl.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var v=inp.value.trim().replace(/^[:\/]\s*/,'');if(v&&hist[hist.length-1]!==v)hist.push(v);hi=hist.length;run(v);inp.value='';});
    inp.addEventListener('keydown',function(e){
      if(e.key==='ArrowUp'&&hist.length){e.preventDefault();hi=Math.max(0,hi-1);inp.value=hist[hi]||'';return}
      if(e.key==='ArrowDown'&&hist.length){e.preventDefault();hi=Math.min(hist.length,hi+1);inp.value=hist[hi]||'';return}
      if(e.key==='Tab'&&inp.value.trim()){var parts=inp.value.replace(/^\s+/,'').split(/\s+/),last=parts.pop().toLowerCase(),pool=parts.length?(parts[0]==='stil'?['glas','neon','heft','datenblatt','terminal']:APPS.map(function(x){return x[0]})):CMDS;
        var m=pool.filter(function(c){return c.indexOf(last)===0});if(m.length){e.preventDefault();if(m.length===1){parts.push(m[0]);inp.value=parts.join(' ')+' '}else say(m.map(function(c){return '<kbd>'+c+'</kbd>'}).join(' '))}return}
      if(e.key==='Escape'){inp.value='';inp.blur();out.classList.remove('on')}});
    inp.addEventListener('focus',function(){sl.querySelector('.m').textContent='BEFEHL'});inp.addEventListener('blur',function(){sl.querySelector('.m').textContent='NORMAL'});
    out.addEventListener('click',function(e){if(!e.target.closest('a'))out.classList.remove('on')});
    document.addEventListener('keydown',function(e){
      if(current()!=='term'||e.metaKey||e.ctrlKey||e.altKey)return;var t=e.target;if(t.closest&&t.closest('input,textarea,select,[contenteditable],dialog'))return;
      if(e.key===':'||e.key==='/'){e.preventDefault();inp.focus();return}
      if(/^[1-6]$/.test(e.key)&&innerWidth>820){go(ROOT+APPS[+e.key-1][0]+'/')}
    });
    /* Terminal: Namen „entschlüsseln“ sich beim Darüberfahren */
    if(!calm&&matchMedia('(hover:hover)').matches){
      var GL='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/';
      document.querySelectorAll('.appstrip a span,.idx a b,.nm,.next strong,footer .w>div:not(:first-child) a').forEach(function(x){
        var tn=[].slice.call(x.childNodes).filter(function(n){return n.nodeType===3&&n.textContent.trim()}).pop();if(!tn)return;var orig=tn.textContent,run=0;
        (x.closest('a')||x).addEventListener('mouseenter',function(){if(current()!=='term'||run)return;var f=0,L=orig.length;
          run=setInterval(function(){f++;tn.textContent=orig.split('').map(function(c,i){return i<f/2||c===' '?c:GL[Math.floor(Math.random()*GL.length)]}).join('');if(f/2>=L){clearInterval(run);run=0;tn.textContent=orig}},28)});
      });
    }
    boot.ready=true;if(current()==='term'){boot();typer()}
  }
  /* Terminal: kurze Startsequenz, einmal je Sitzung (oder beim Wechsel in den Stil); Taste oder Klick überspringt */
  function boot(){
    if(!boot.ready||calm||document.querySelector('.tm-boot'))return;
    try{if(sessionStorage.getItem('theis-boot'))return;sessionStorage.setItem('theis-boot','1')}catch(e){}
    var lines=['theisapps 2026.11 – Software für den Schulalltag','Prüfe Speicher ............ nur lokal','Suche Server .............. keiner nötig','Suche Konto ............... keins nötig','Lade Programme ............ 6 gefunden','Bereit.'];
    var b=el('div','tm-boot');b.setAttribute('aria-hidden','true');document.body.appendChild(b);
    var i=0,end=function(){if(!b.parentNode)return;b.classList.add('out');setTimeout(function(){b.remove()},300);removeEventListener('keydown',end);removeEventListener('pointerdown',end)};
    addEventListener('keydown',end);addEventListener('pointerdown',end);
    (function next(){if(!b.parentNode)return;if(i>=lines.length){setTimeout(end,260);return}
      var l=lines[i++],ok=i>1&&i<lines.length;b.insertAdjacentHTML('beforeend','<p>'+(ok?'<b>[  OK  ]</b> ':'')+esc(l)+'</p>');setTimeout(next,i===1?180:95)})();
  }
  /* Terminal: Hauptüberschrift tippt sich Zeichen für Zeichen (Vorleseprogramme bekommen den ganzen Text) */
  function typer(){
    var h=document.querySelector('main h1');if(!h||calm||h.classList.contains('tw')||h.classList.contains('typed'))return;
    var full=h.textContent.replace(/\s+/g,' ').trim(),cs=[];h.setAttribute('aria-label',full);h.style.minHeight=h.offsetHeight+'px';
    (function walk(n){[].slice.call(n.childNodes).forEach(function(c){if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split('').forEach(function(ch){var sp=document.createElement('span');sp.className='twc';sp.setAttribute('aria-hidden','true');sp.textContent=ch;cs.push(sp);f.appendChild(sp)});c.parentNode.replaceChild(f,c)}else if(c.nodeType===1)walk(c)})})(h);
    h.classList.add('tw');var i=0;
    var fin=function(){h.classList.remove('tw');h.classList.add('typed');h.style.minHeight=''};
    var step=function(){if(current()!=='term'){cs.forEach(function(c){c.classList.add('on')});return fin()}
      var k=Math.random()<.15?3:1;while(k--&&i<cs.length)cs[i++].classList.add('on');if(i>=cs.length)return fin();setTimeout(step,cs[i-1].textContent===' '?60:22+Math.random()*30)};
    setTimeout(step,document.querySelector('.tm-boot')?1200:250);
  }
  function ready(){
    var g=get(KEY);if(g==='salbei'||g==='atelier'||g==='plakat'||g==='studio'){g='normal';put(KEY,g)}apply(STILE.indexOf(g)>=0?g:'normal');
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
    extras();
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
    if(!get(SEEN)&&!get(KEY)&&document.querySelector('.pick')){
      var shown=false,show=function(){
        if(shown||get(SEEN)||scrollY<innerHeight*.9)return;shown=true;removeEventListener('scroll',show);
        var t=document.createElement('div');t.id='tip';t.setAttribute('role','dialog');t.setAttribute('aria-label','Stil der Website');
        t.innerHTML='<p><b>Fünf Stile zur Wahl</b>Glas, Neon, Schulheft, Datenblatt oder Terminal – jederzeit oben umschaltbar.</p><div class="tip-s">'+
          [['normal','k','Glas'],['neon','n','Neon'],['heft','h','Heft'],['blatt','b','Datenblatt'],['term','t','Terminal']].map(function(x){return '<button type="button" data-s="'+x[0]+'"'+(x[0]==='normal'?' aria-pressed="true"':'')+'><i class="'+x[1]+'"></i>'+x[2]+'</button>'}).join('')+
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
