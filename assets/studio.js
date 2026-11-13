/* theis-Website, Stil „Studio“.
   Baut aus den vorhandenen Seiten einen eigenen Aufbau: Startseite mit Suche und Kacheln, Programmseiten mit Kapiteln, Textseiten mit Inhaltsverzeichnis.
   Navigation ohne Neuladen (die Seiten werden geholt und neu gesetzt, die Adresse bleibt echt), Übergänge per View Transitions.
   Wird von site.js nur in diesem Stil geladen. Speichert nichts außer der Stilwahl, die site.js ohnehin merkt. */
(function(){
  if(window.theisStudio)return;
  var D=document,r=D.documentElement,ME=D.currentScript&&D.currentScript.src;
  var ROOT=ME?new URL('../',ME).href:new URL('/',location.href).href,RP=new URL(ROOT).pathname,IMG=ROOT+'assets/img/';
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches,narrow=matchMedia('(max-width:820px)');
  var ua=navigator.userAgent,OS=(/iPhone|iPad|Android/.test(ua)||(/Mac/.test(ua)&&navigator.maxTouchPoints>1))?'mobile':/Windows/.test(ua)?'win':/Mac/.test(ua)?'mac':null;
  var APPS=[
    {id:'libretto',p:'libretto',n:'Libretto',h:150,i:'libretto-icon.png',k:'noten notenbuch zeugnis gso schulaufgabe notenschlüssel durchschnitt'},
    {id:'voce',p:'voce',n:'Voce',h:255,i:'viva-icon.png',k:'mündlich mündliche prüfung bewertung raster fremdsprache englisch viva'},
    {id:'foliva',p:'foliva',n:'Foliva',h:295,i:'foliva-icon.png',k:'arbeitsblatt arbeitsblätter probe lösung lösungsblatt grundschule vorlage'},
    {id:'aula',p:'aula',n:'Aula',h:12,i:'aula-icon.png',k:'gruppen gruppo timer sitzplan beamer uhr stundenplan klassenzimmer'},
    {id:'sportwahl',p:'sportivo',n:'Sportivo',h:55,i:'sportwahl-icon.svg',k:'sportwahl sport oberstufe q12 q13 kurse mebis'},
    {id:'namo',p:'namo',n:'’namo.',h:190,i:'namo-icon.png',k:'klassenfahrt studienfahrt reise schülerfahrt ausflug'}];
  var BY={};APPS.forEach(function(a){a.u=ROOT+a.id+'/';a.img=IMG+a.i;BY[a.id]=a});
  var INTENTS=[['Noten führen','libretto'],['Arbeitsblätter erstellen','foliva'],['Mündliche Prüfungen bewerten','voce'],['Gruppen bilden, Zeit stoppen','aula'],['Sportwahl planen','sportwahl'],['Klassenfahrt organisieren','namo']];
  var ICON={
    arrow:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dl:'<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3v9M5 8.5 9 12.5l4-4M3.5 15h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play:'<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M6 4.5v9l7.5-4.5z" fill="currentColor"/></svg>',
    share:'<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.5v9M5.5 6 9 2.5 12.5 6M4 9.5v5h10v-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    style:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.8a7.2 7.2 0 0 0 0 14.4z" fill="currentColor"/></svg>',
    doc:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.8h5.5L12.5 5v9.2H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8h4.5M6 10.8h4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    mail:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    lock:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    eye:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 20 20 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    server:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="13" width="16" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="8" cy="7.5" r="1" fill="currentColor"/><circle cx="8" cy="16.5" r="1" fill="currentColor"/></svg>',
    phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  };
  var STYLES=[['normal','Glas','radial-gradient(circle at 32% 28%,#fff 0 12%,transparent 30%),conic-gradient(from 200deg,#7d96ff,#c08bff,#ff9ccc,#7fe3d4,#7d96ff)'],['neon','Neon','linear-gradient(120deg,#ff3ea5,#8a3ffc 55%,#2f6bff)'],['heft','Schulheft','linear-gradient(#b9c8de 1px,transparent 1px) 0 0/6px 6px,linear-gradient(90deg,#b9c8de 1px,transparent 1px) 0 0/6px 6px,#f8f4e8'],['plakat','Plakat','radial-gradient(circle at 70% 30%,#ff4b2b 0 24%,transparent 26%),#1d35c8'],['studio','Studio','radial-gradient(circle at 30% 30%,#7d8bff 0 18%,transparent 46%),radial-gradient(circle at 75% 70%,#c86bff 0 16%,transparent 44%),#0b0c12']];

  /* Werkzeuge */
  function h(tag,cls,html){var e=D.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function txt(e){return e?e.textContent.replace(/\s+/g,' ').trim():''}
  function abs(u,b){try{return new URL(u,b).href}catch(e){return u}}
  function $(s,c){return (c||D).querySelector(s)}
  function $$(s,c){return [].slice.call((c||D).querySelectorAll(s))}
  function fix(n,b){
    if(!n)return n;
    $$('[href]',n).forEach(function(a){var v=a.getAttribute('href');if(v&&v.charAt(0)!=='#'&&!/^(mailto|tel):/.test(v))a.setAttribute('href',abs(v,b))});
    $$('[src],[poster]',n).forEach(function(e){['src','poster'].forEach(function(k){var v=e.getAttribute(k);if(v)e.setAttribute(k,abs(v,b))})});
    $$('a.em',n).forEach(function(a){var m=a.dataset.u+'@'+a.dataset.d;a.href='mailto:'+m+(a.dataset.s?'?subject='+encodeURIComponent(a.dataset.s):'');if(a.textContent.indexOf('[at]')>=0)a.textContent=m});
    $$('[style]',n).forEach(function(e){e.removeAttribute('style')});
    return n;
  }
  function clone(e,b){return e?fix(e.cloneNode(true),b):null}
  function hl(e){if(!e)return '';var c=e.cloneNode(true);$$('.hl',c).forEach(function(s){s.className='st-hl'});return c.innerHTML}
  function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss')}
  var mailAddr=['hallo','theisapps.de'].join('@');

  /* Welche Ansicht gehört zu einer Adresse? */
  function route(url){
    var u;try{u=new URL(url,location.href)}catch(e){return null}
    if(u.origin!==location.origin||u.pathname.indexOf(RP)!==0)return null;
    var p=u.pathname.slice(RP.length);
    if(p===''||p==='index.html')return 'home';
    var m=p.match(/^(libretto|voce|foliva|aula|sportwahl|namo)\/(index\.html)?$/);if(m)return m[1];
    if(/^(datenschutz|impressum|lizenz|danke|404)(\.html)?$/.test(p)||/^kontakt\/(index\.html)?$/.test(p))return 'doc';
    return null;
  }
  /* Saubere Kopie der aufgerufenen Seite, bevor Studio sie verändert */
  var cache={};cache[location.href.split('#')[0]]=Promise.resolve(new DOMParser().parseFromString('<!doctype html>'+r.outerHTML,'text/html'));
  function load(u){var k=u.split('#')[0];if(!cache[k])cache[k]=fetch(k,{credentials:'same-origin'}).then(function(x){if(!x.ok)throw new Error(x.status);return x.text()}).then(function(t){return new DOMParser().parseFromString(t,'text/html')});cache[k].catch(function(){delete cache[k]});return cache[k]}

  /* Gerüst */
  var logoSvg=($('.bar .brand svg')||h('span','','theisapps')).outerHTML;
  var S=h('div','st');
  S.innerHTML='<div class="st-glow" aria-hidden="true"></div><div class="st-grid" aria-hidden="true"></div>'+
    '<header class="st-top"><div class="st-w"><a class="st-logo" href="'+ROOT+'" aria-label="theisapps, zur Startseite">'+logoSvg+'</a>'+
    '<nav class="st-nav" aria-label="Hauptnavigation"><a href="'+ROOT+'#programme">Programme</a><a href="'+ROOT+'#daten">Ihre Daten</a><a href="'+ROOT+'#ueber">Über mich</a></nav>'+
    '<button type="button" class="st-ib st-sty" aria-label="Stil der Website" aria-haspopup="true">'+ICON.style+'</button></div><div class="st-prog" aria-hidden="true"></div></header>'+
    '<main class="st-main" id="inhalt" tabindex="-1"></main>'+
    '<footer class="st-foot"><div class="st-w"><a href="'+ROOT+'" aria-label="theisapps">'+logoSvg+'</a><span>© 2026 theisapps · Software für den Schulalltag in Bayern</span><span class="sp"></span><a href="'+ROOT+'impressum">Impressum</a><a href="'+ROOT+'datenschutz">Datenschutz</a><a href="'+ROOT+'lizenz">Lizenz</a><a href="mailto:'+mailAddr+'">Kontakt</a></div></footer>';
  var main=$('.st-main',S);

  /* ---------- Startseite ---------- */
  function words(el){
    var out=h('span'),i=0;
    function walk(src,dst){[].slice.call(src.childNodes).forEach(function(n){
      if(n.nodeType===3){n.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){dst.appendChild(D.createTextNode(' '));return}var s=h('span','st-word');s.textContent=w;s.style.setProperty('--i',i++);dst.appendChild(s)})}
      else if(n.nodeType===1){var c=h('span',n.classList.contains('hl')?'st-hl':'');walk(n,c);dst.appendChild(c)}})}
    walk(el,out);return out.innerHTML;
  }
  function viewHome(d,b){
    var el=h('div'),h1=$('.hero h1',d),lead=txt($('.hero .top .r p',d));
    var hero=h('section','st-hero st-w');
    hero.innerHTML='<span class="st-mono"><i></i>Kostenlos · ohne Konto · für Lehrkräfte in Bayern</span><h1 tabindex="-1">'+(h1?words(h1):'theisapps')+'</h1><p class="st-lead">'+esc(lead)+'</p>'+
      '<div class="st-intents">'+INTENTS.map(function(x){var a=BY[x[1]];return '<a class="st-intent" style="--ih:'+a.h+'" href="'+a.u+'"><img src="'+a.img+'" alt="">'+esc(x[0])+'</a>'}).join('')+'</div>'+
      '<div class="st-trust st-mono">'+['Daten bleiben auf Ihrem Gerät','Keine Werbung, kein Tracking','Entwickelt von einem Lehrer'].map(function(t){return '<span>'+ICON.check+t+'</span>'}).join('')+'</div>';
    el.appendChild(hero);
    /* Programme */
    var ps=h('section','st-sec st-w');ps.id='programme';
    ps.innerHTML='<div class="st-head"><div><span class="st-mono">Programme · '+APPS.length+'</span><h2>'+esc(txt($('#programme h2',d))||'Programme')+'</h2></div><p>'+esc(txt($('#programme .lead',d)))+'</p></div><div class="st-bento"></div>';
    var bento=$('.st-bento',ps);
    APPS.forEach(function(a){
      var p=$('#p-'+a.p,d),desc=txt(p&&$('.meta p',p)),meta=txt(p&&$('.st',p)).split(' · ')[0],shot=p&&$('.pic img',p);
      var t=h('a','st-tile st-rv');t.href=a.u;t.dataset.app=a.id;t.style.setProperty('--th',a.h);
      t.innerHTML='<div class="tt"><img src="'+a.img+'" alt=""><span><b>'+esc(a.n)+'</b><small>'+esc(p?txt($('.idx a[href="#p-'+a.p+'"] span',d)).replace(a.n,'').trim():'')+'</small></span></div>'+
        (/Beta/.test(meta)?'<span class="st-tag">Neu · Beta</span>':'')+'<span class="go">'+ICON.arrow+'</span><p>'+esc(desc)+'</p><span class="st-mono">'+esc(meta)+'</span>'+
        (shot?'<div class="shot"><img src="'+abs(shot.getAttribute('src'),b)+'" alt="" loading="lazy" decoding="async"></div>':'');
      t.addEventListener('pointermove',function(e){var q=t.getBoundingClientRect();t.style.setProperty('--mx',(e.clientX-q.left)+'px');t.style.setProperty('--my',(e.clientY-q.top)+'px')});
      bento.appendChild(t);
    });
    el.appendChild(ps);
    /* Ihre Daten */
    var safe=$('#daten',d);if(safe){
      var ds=h('section','st-sec st-w');ds.id='daten';var ic=[ICON.server,ICON.eye,ICON.lock];
      ds.innerHTML='<div class="st-head"><div><span class="st-mono">Datenschutz</span><h2>'+esc(txt($('h2',safe)))+'</h2></div><p>'+esc(txt($('.lead',safe)))+'</p></div><div class="st-cols"></div>';
      $$('li',safe).forEach(function(li,i){var c=h('div','st-card st-rv');c.innerHTML=ic[i%3]+'<h3>'+esc(txt($('b',li)))+'</h3>';var p=h('p');var sp=clone($('span',li),b);p.innerHTML=sp?sp.innerHTML:'';c.appendChild(p);$('.st-cols',ds).appendChild(c)});
      el.appendChild(ds);
    }
    /* In drei Schritten */
    var steps=$('.steps',d);if(steps){
      var ss=h('section','st-sec st-w');ss.innerHTML='<div class="st-head"><div><span class="st-mono">Start</span><h2>'+esc(txt(steps.parentNode.querySelector('h2')))+'</h2></div></div><div class="st-cols"></div>';
      $$('li',steps).forEach(function(li,i){$('.st-cols',ss).appendChild(h('div','st-card st-rv','<span class="n">0'+(i+1)+'</span><h3>'+esc(txt($('h3',li)))+'</h3><p>'+esc(txt($('p',li)))+'</p>'))});
      el.appendChild(ss);
    }
    /* Über mich */
    var me=$('#ueber',d);if(me){
      var ms=h('section','st-sec st-w');ms.id='ueber';var img=$('.face img',me);
      ms.innerHTML='<div class="st-me st-rv">'+(img?'<img src="'+abs(img.getAttribute('src'),b)+'" alt="'+esc(img.alt)+'">':'')+'<div><span class="st-mono">Über mich</span><p class="big" style="margin-top:12px">'+esc(txt($('.big',me)))+'</p><div class="st-btns" style="margin-bottom:18px"><a class="st-btn pri" href="mailto:'+mailAddr+'">'+ICON.mail+mailAddr+'</a></div><p class="small">'+esc(txt($('p.small',me)))+'</p></div></div>';
      el.appendChild(ms);
    }
    var cup=$('#unterstuetzen',d);if(cup){
      var cs=h('section','st-sec st-w');cs.id='unterstuetzen';var ca=$('a.btn',cup);
      cs.innerHTML='<div class="st-cup st-rv"><div><h2>'+esc(txt($('h2',cup)))+'</h2><p>'+esc(txt($('p',cup)))+'</p></div>'+(ca?'<a class="st-btn" href="'+esc(ca.getAttribute('href'))+'" rel="noopener">'+esc(txt(ca))+'</a>':'')+'</div>';
      el.appendChild(cs);
    }
    return {el:el,title:d.title,hue:265};
  }

  /* ---------- Programmseite ---------- */
  function share(url,name){
    var data={title:name+' · theisapps',text:name+' für den Computer',url:url};
    if(navigator.share){navigator.share(data).catch(function(){});return}
    if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){toast('Link kopiert')},function(){location.href='mailto:?subject='+encodeURIComponent(data.title)+'&body='+encodeURIComponent(url)})}
    else location.href='mailto:?subject='+encodeURIComponent(data.title)+'&body='+encodeURIComponent(url);
  }
  function toast(t){var x=h('div','st-mono','');x.textContent=t;x.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:60;padding:10px 16px;border-radius:12px;background:var(--ink);color:var(--bg)';S.appendChild(x);setTimeout(function(){x.remove()},1800)}
  function downloads(d,b){
    var L=$('#laden',d),o={tabs:[],byId:{},hint:[]};if(!L)return o;
    $$('.seg button',L).forEach(function(t){var p=$('[data-p="'+t.dataset.t+'"]',L);if(!p)return;var first=$('a.btn',p);o.tabs.push({id:t.dataset.t,label:txt(t),pane:p,first:first&&abs(first.getAttribute('href'),b)})});
    if(!o.tabs.length){var p=$('[data-p]',L);if(p)o.tabs.push({id:p.dataset.p,label:'',pane:p})}
    o.byId={};o.tabs.forEach(function(t){o.byId[t.id]=t});
    o.hint=$$(':scope > p.small',L).map(function(p){return clone(p,b)});
    return o;
  }
  function viewApp(d,b,id){
    var a=BY[id],el=h('div'),ah=$('.ah',d),dl=downloads(d,b),canDl=OS!=='mobile',mine=dl.byId[OS==='win'?'win':'mac'];
    var feats=$$('.fx',d),vid=$('.vid video',d),faq=$$('details.q',d),hasDl=dl.tabs.length>0;
    /* Leiste mit Kapiteln */
    var sub=h('div','st-sub');
    var navs=[['top','Überblick']];if(feats.length)navs.push(['funktionen','Funktionen']);if(vid)navs.push(['video','Video']);if(hasDl)navs.push(['laden','Laden']);if(faq.length)navs.push(['fragen','Fragen']);
    var subBtn=hasDl&&canDl?'<a class="st-btn pri" href="#laden">'+ICON.dl+'Laden</a>':'';
    sub.innerHTML='<div class="st-w"><span class="nm"><img src="'+a.img+'" alt=""><span>'+esc(a.n)+'</span></span><nav aria-label="Kapitel">'+navs.map(function(n){return '<a href="#'+n[0]+'">'+n[1]+'</a>'}).join('')+'</nav>'+subBtn+'</div>';
    el.appendChild(sub);
    var w=h('div','st-w');el.appendChild(w);
    w.appendChild(h('a','st-back',ICON.back+'Alle Programme')).href=ROOT+'#programme';
    /* Kopf */
    var top=h('section','st-ah');top.id='top';
    var icon=$('.id img',ah),badge=txt($('.badge',ah)),lead=txt($('.r>p',ah)),note=clone($('.r p.small',ah),b);
    top.innerHTML='<div><div class="id"><img src="'+(icon?abs(icon.getAttribute('src'),b):a.img)+'" alt="'+esc(a.n)+'">'+(badge?'<span class="badge">'+esc(badge)+'</span>':'')+'</div><h1 tabindex="-1">'+hl($('h1',ah))+'</h1></div><div><p class="lead">'+esc(lead)+'</p><div class="st-btns"></div></div>';
    var bt=$('.st-btns',top);
    $$('.btns a',ah).forEach(function(x,i){
      var href=x.getAttribute('href'),t=txt(x);
      if(href==='#laden'){
        if(canDl&&mine&&mine.first){var e=h('a','st-btn pri',ICON.dl+'Für '+(OS==='win'?'Windows':'Mac')+' laden');e.href=mine.first;bt.appendChild(e);
          var o=h('a','st-btn','Alle Downloads');o.href='#laden';bt.appendChild(o)}
        else if(!canDl){var s=h('button','st-btn pri',ICON.share+'Link an den Computer senden');s.type='button';s.addEventListener('click',function(){share(a.u,a.n)});bt.appendChild(s)}
        else{var e2=h('a','st-btn pri',ICON.dl+'Herunterladen');e2.href='#laden';bt.appendChild(e2)}
        return}
      if(/demo\/$/.test(href)&&narrow.matches&&id!=='namo')return;
      var e3=h('a','st-btn'+(bt.children.length?'':' pri'),(href==='#video'?ICON.play:'')+esc(t));e3.href=href.charAt(0)==='#'?href:abs(href,b);bt.appendChild(e3);
    });
    if(note){var n=h('p','note');n.innerHTML=note.innerHTML;$('.st-ah>div:last-child',top).appendChild(n)}
    w.appendChild(top);
    /* Fakten */
    var facts=$$('.facts>div',d);if(facts.length){var f=h('dl','st-facts');facts.forEach(function(x){f.appendChild(h('div','','<dt>'+esc(txt($('b',x)))+'</dt><dd>'+esc(txt($('span',x)))+'</dd>'))});w.appendChild(f)}
    /* Bühne */
    var stage=$('.app-stage img',d);
    if(stage){var plain=!!$('.app-stage.plain',d);var sg=h('div','st-stage');sg.innerHTML='<div class="st-frame">'+(plain?'':'<div class="bar"><i></i><i></i><i></i></div>')+'<img src="'+abs(stage.getAttribute('src'),b)+'" alt="'+esc(stage.alt)+'" decoding="async"></div>';w.appendChild(sg)}
    /* Funktionen */
    if(feats.length){
      var fs=h('section','st-feats');fs.id='funktionen';
      feats.forEach(function(x,i){
        var tx=$('.tx',x),im=$('.pic img',x),c=h('article','st-feat');c.id='f-'+(i+1);
        var body='<div class="tx st-rv"><span class="n">'+(i<9?'0':'')+(i+1)+' / '+(feats.length<10?'0':'')+feats.length+'</span><h2>'+esc(txt($('h2',tx)))+'</h2>';
        c.innerHTML=body+'</div>';var t2=$('.tx',c);
        $$(':scope > p',tx).forEach(function(p){t2.appendChild(clone(p,b))});
        var ul=$('ul.ticks',tx);if(ul){var u2=clone(ul,b);u2.className='st-ticks';t2.appendChild(u2)}
        $$(':scope > .btns a',tx).forEach(function(l){var x2=h('a','st-link',esc(txt(l))+' →');x2.href=l.getAttribute('href').charAt(0)==='#'?l.getAttribute('href'):abs(l.getAttribute('href'),b);t2.appendChild(h('p')).appendChild(x2)});
        if(im){var ph=(+im.getAttribute('height')||0)>(+im.getAttribute('width')||1);var pc=h('div','pic st-rv'+(ph?' ph':''));pc.innerHTML='<img src="'+abs(im.getAttribute('src'),b)+'" alt="'+esc(im.alt)+'" loading="lazy" decoding="async">';c.appendChild(pc)}
        fs.appendChild(c);
      });
      w.appendChild(fs);
    }
    /* Weitere Abschnitte der Seite, die keine eigene Form haben */
    $$('main section.s',d).forEach(function(s){
      if(s.id==='laden'||s.id==='video'||$('.faq,.next,.vid,#laden',s)||s.closest('#laden'))return;
      var h2=$('h2',s);if(!h2)return;
      var grid=$('.grid',s),sec=h('section','st-sec');
      sec.innerHTML='<div class="st-head"><div><h2>'+esc(txt(h2))+'</h2></div>'+($('.lead',s)?'<p>'+esc(txt($('.lead',s)))+'</p>':'')+'</div>';
      if(grid){var m=h('div','st-more');$$(':scope > div',grid).forEach(function(g){var c=h('div','st-card st-rv','<h3>'+esc(txt($('h3',g)))+'</h3>');var p=clone($('p',g),b);if(p)c.appendChild(p);m.appendChild(c)});sec.appendChild(m)}
      else{var card=h('div','st-card st-rv');$$('p:not(.lead),ul.ticks',s).forEach(function(p){var c2=clone(p,b);if(c2.tagName==='UL')c2.className='st-ticks';else c2.removeAttribute('class');card.appendChild(c2)});if(!card.children.length)return;sec.appendChild(card)}
      w.appendChild(sec);
    });
    /* Video */
    if(vid){var src=$('source',vid),vs=h('section','st-sec');vs.id='video';var vsec=vid.closest('section');
      vs.innerHTML='<div class="st-head"><div><span class="st-mono">Video</span><h2>'+esc(txt(vsec&&$('h2',vsec))||'Video')+'</h2></div><p>'+esc(txt(vsec&&$('.lead',vsec)))+'</p></div><div class="st-vid st-rv"><video controls playsinline preload="none" poster="'+esc(abs(vid.getAttribute('poster')||'',b))+'"><source src="'+esc(abs(src.getAttribute('src'),b))+'" type="video/mp4"></video></div>';
      w.appendChild(vs)}
    /* Laden */
    if(hasDl){
      var ls=h('section','st-sec');ls.id='laden';
      var box=h('div','st-dl st-rv');box.innerHTML='<div class="side"><span class="st-mono">Laden</span><h2 style="margin-top:12px">Herunterladen und einrichten</h2></div><div class="panes"></div>';
      var side=$('.side',box);
      if(!canDl){var ph2=h('div','st-phone',ICON.phone+'<div><b>'+esc(a.n)+' läuft auf Mac und Windows.</b><br>Am Handy oder Tablet lässt es sich nicht installieren. Schicken Sie sich den Link an den Computer.</div>');side.appendChild(ph2);var sb=h('button','st-btn pri',ICON.share+'Link an den Computer senden');sb.type='button';sb.addEventListener('click',function(){share(a.u,a.n)});side.appendChild(sb)}
      dl.hint.forEach(function(p){var q=h('p');q.innerHTML=p.innerHTML;q.style.marginTop='18px';side.appendChild(q)});
      var panes=$('.panes',box),tabs=h('div','st-tabs');tabs.setAttribute('role','tablist');
      /* Demos der Computerprogramme brauchen einen großen Bildschirm: am Handy kein Demo-Reiter */
      if(narrow.matches&&id!=='namo')dl.tabs=dl.tabs.filter(function(t){return t.id!=='web'});
      var want=dl.byId[OS==='win'?'win':OS==='mac'?'mac':'']?(OS==='win'?'win':'mac'):dl.tabs[0].id;
      if(dl.tabs.length>1)panes.appendChild(tabs);
      dl.tabs.forEach(function(t){
        var pn=h('div','st-pane');pn.dataset.p=t.id;
        var bs=h('div','st-btns');$$('a.btn',t.pane).forEach(function(x,i){var e=h('a','st-btn'+(i?'':' pri'),(/\.(zip|exe|dmg)$/.test(x.getAttribute('href'))?ICON.dl:'')+esc(txt(x)));e.href=abs(x.getAttribute('href'),b);if(x.hasAttribute('download'))e.setAttribute('download','');bs.appendChild(e)});
        if(bs.children.length)pn.appendChild(bs);
        $$(':scope > ol',t.pane).forEach(function(o){var c=clone(o,b);c.className='st-steps';pn.appendChild(c)});
        $$(':scope > p',t.pane).forEach(function(p){var c=clone(p,b);c.removeAttribute('class');pn.appendChild(c)});
        panes.appendChild(pn);
        if(t.label){var tb=h('button','',esc(t.label));tb.type='button';tb.setAttribute('role','tab');tb.dataset.t=t.id;tabs.appendChild(tb)}
      });
      function pick(id2){$$('.st-pane',panes).forEach(function(p){p.hidden=p.dataset.p!==id2});$$('button',tabs).forEach(function(x){x.setAttribute('aria-selected',x.dataset.t===id2?'true':'false')})}
      tabs.addEventListener('click',function(e){var x=e.target.closest('button');if(x)pick(x.dataset.t)});pick(want);
      ls.appendChild(box);w.appendChild(ls);
    }
    /* Fragen */
    if(faq.length){var qs=h('section','st-sec');qs.id='fragen';qs.innerHTML='<div class="st-faq"><div><span class="st-mono">Fragen</span><h2 style="margin-top:12px">'+esc(txt($('.faq h2',d))||'Fragen')+'</h2></div><div class="qs"></div></div>';faq.forEach(function(q){$('.qs',qs).appendChild(clone(q,b))});w.appendChild(qs)}
    /* Nächstes Programm */
    var i0=APPS.indexOf(a),nx=APPS[(i0+1)%APPS.length];
    var ns=h('section','st-sec'),na=h('a','st-next st-rv');na.href=nx.u;na.style.setProperty('--nh',nx.h);
    na.innerHTML='<span><small>Nächstes Programm</small><strong>'+esc(nx.n)+'</strong></span><img src="'+nx.img+'" alt="">';ns.appendChild(na);w.appendChild(ns);
    return {el:el,title:d.title,hue:a.h,app:a.id};
  }

  /* ---------- Textseiten ---------- */
  function viewDoc(d,b){
    var src=$('main .doc',d);if(!src)return null;
    var el=h('div','st-w'),wrap=h('div','st-doc'),pr=clone(src,b);pr.className='st-prose'+(src.classList.contains('center')?' center':'');
    var hs=$$('h2',pr);
    if(hs.length>=3&&!src.classList.contains('center')){var toc=h('nav','st-toc','<span class="st-mono">Inhalt</span>');toc.setAttribute('aria-label','Inhalt');hs.forEach(function(x,i){x.id=x.id||'k-'+(i+1);var l=h('a','',esc(txt(x).replace(/^\d+[a-z]?\.\s*/,'')));l.href='#'+x.id;toc.appendChild(l)});wrap.appendChild(toc)}
    else wrap.style.gridTemplateColumns='minmax(0,720px)';
    var h1=$('h1',pr);if(h1)h1.tabIndex=-1;
    wrap.appendChild(pr);el.appendChild(wrap);
    return {el:el,title:d.title,hue:265};
  }

  /* ---------- Wechsel der Ansicht ---------- */
  var cur={url:null,r:null},mem={},busy=0;
  function names(pairs){pairs.forEach(function(p){if(p[0])p[0].style.viewTransitionName=p[1]})}
  function unname(){$$('[style*="view-transition-name"]',S).forEach(function(e){e.style.viewTransitionName=''})}
  function shared(rt){
    if(BY[rt])return [[$('.st-ah .id img',main),'st-icon'],[$('.st-frame img',main),'st-shot'],[$('.st-ah h1',main),'st-title']];
    if(rt==='home'&&BY[cur.r]){var t=$('.st-tile[data-app="'+cur.r+'"]',main);return t?[[$('.tt img',t),'st-icon'],[$('.shot img',t),'st-shot'],[$('.tt b',t),'st-title']]:[]}
    return [];
  }
  function scrollTo(hash,how){
    var id=hash&&decodeURIComponent(hash.slice(1));if(id==='kontakt')id='ueber';if(id==='top')id='';
    var t=id&&main.querySelector('[id="'+id.replace(/"/g,'')+'"]');
    if(t)t.scrollIntoView({behavior:how||'auto',block:'start'});else window.scrollTo({top:0,behavior:how||'auto'});
  }
  function build(rt,d,url){return rt==='home'?viewHome(d,url):rt==='doc'?viewDoc(d,url):viewApp(d,url,rt)}
  function go(url,o){
    o=o||{};var rt=route(url);
    if(!rt){location.href=url;return}
    var my=++busy;
    load(url).then(function(d){
      if(my!==busy)return;
      var v=build(rt,d,url);if(!v){if(o.first){fallback();return}location.href=url;return}
      var prev=cur.r,from=o.from;
      if(cur.url)mem[cur.url]=scrollY;
      function swap(){
        main.replaceChildren(v.el);S.style.setProperty('--h',v.hue);D.title=v.title;
        if(o.push)history.pushState({st:1},'',url);
        var u=new URL(url,location.href);
        if(o.pop&&mem[u.href.split('#')[0]]!=null&&!u.hash)window.scrollTo(0,mem[u.href.split('#')[0]]);else scrollTo(u.hash);
        cur={url:u.href.split('#')[0],r:rt};
        $$('.st-nav a',S).forEach(function(a){a.toggleAttribute('aria-current',false)});
        after();
      }
      var vt=!calm&&D.startViewTransition&&!o.first;
      if(!vt){swap();if(!o.first)focusTop();return}
      if(from&&rt!=='home'&&BY[rt])names([[$('.tt img',from),'st-icon'],[$('.shot img',from),'st-shot'],[$('.tt b',from),'st-title']]);
      else if(rt==='home'&&BY[prev])names([[$('.st-ah .id img',main),'st-icon'],[$('.st-frame img',main),'st-shot'],[$('.st-ah h1',main),'st-title']]);
      var t=D.startViewTransition(function(){unname();swap();if((from&&BY[rt])||(rt==='home'&&BY[prev]))names(shared(rt))});
      t.finished.then(unname,unname);t.updateCallbackDone.then(focusTop,focusTop);
    }).catch(function(err){
      if(window.console)console.error('Studio:',err);
      /* Beim ersten Aufbau nie neu laden (sonst Endlosschleife), sondern die normale Seite zeigen */
      if(o.first){fallback();return}
      if(my===busy)location.href=url;
    });
  }
  function focusTop(){var h1=$('h1',main);if(h1)h1.focus({preventScroll:true})}
  /* Fortschrittsbalken und Kapitelanzeige: ein Scroll-Handler, höchstens einmal je Bild gerechnet.
     Das aktive Kapitel ist das letzte, dessen Anfang die Leisten oben erreicht hat; am Seitenende das letzte. */
  var prog=$('.st-prog',S),marks=[],act=null,tick=false;
  function after(){
    marks=$$('.st-sub nav a,.st-toc a',main).map(function(l){return {l:l,t:main.querySelector('[id="'+l.getAttribute('href').slice(1)+'"]'),nav:l.parentNode}}).filter(function(m){return m.t});
    act=null;frame();
  }
  function frame(){
    tick=false;
    var de=D.documentElement,max=de.scrollHeight-innerHeight,y=scrollY;
    prog.style.transform='scaleX('+(max>0?Math.min(1,Math.max(0,y/max)):0)+')';
    if(!marks.length)return;
    var line=(($('.st-sub',main)||{}).offsetHeight||0)+$('.st-top',S).offsetHeight+40,cur=marks[0];
    if(y>=max-4)cur=marks[marks.length-1];
    else marks.forEach(function(m){if(m.t.getBoundingClientRect().top<=line)cur=m});
    if(cur===act)return;act=cur;
    marks.forEach(function(m){m.l.classList.toggle('on',m===cur)});
    /* Leiste am Handy: aktives Kapitel waagerecht ins Bild holen, ohne die Seite zu verschieben */
    var nv=cur.nav;if(nv&&nv.scrollWidth>nv.clientWidth){nv.scrollTo({left:cur.l.offsetLeft-(nv.clientWidth-cur.l.offsetWidth)/2,behavior:calm?'auto':'smooth'})}
  }
  function onScroll(){if(!tick){tick=true;requestAnimationFrame(frame)}}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});
  /* Bilder, die später laden, verändern die Seitenhöhe */
  main.addEventListener('load',onScroll,true);
  function fallback(){S.remove();$$('body [id^="orig-"]').forEach(function(e){e.id=e.id.slice(5)});r.setAttribute('data-style','normal')}

  /* Links innerhalb von Studio */
  S.addEventListener('click',function(e){
    var a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
    var u;try{u=new URL(a.href)}catch(x){return}
    if(u.origin!==location.origin)return;
    var here=new URL(location.href);
    if(u.pathname===here.pathname&&u.search===here.search&&u.hash){e.preventDefault();history.replaceState(history.state,'',u.href);scrollTo(u.hash,calm?'auto':'smooth');return}
    if(!route(u.href))return;
    e.preventDefault();go(u.href,{push:true,from:a.classList.contains('st-tile')?a:null});
  });
  addEventListener('popstate',function(){var k=location.href.split('#')[0];if(k===cur.url){scrollTo(location.hash);return}go(location.href,{pop:true})});
  /* Bildschirmfotos groß */
  var zoom=h('dialog','st-zoom','<img alt="">');S.appendChild(zoom);
  S.addEventListener('click',function(e){var im=e.target.closest('.st-frame img,.st-feat .pic img');if(!im||!zoom.showModal)return;$('img',zoom).src=im.currentSrc||im.src;$('img',zoom).alt=im.alt;zoom.showModal()});
  zoom.addEventListener('click',function(){zoom.close()});

  /* ---------- Stil wählen ---------- */
  var pop=h('div','st-pop');pop.id='st-pop';pop.setAttribute('role','menu');pop.innerHTML='<p>Stil der Website</p>'+STYLES.map(function(s){return '<button type="button" role="menuitemradio" aria-checked="'+(s[0]==='studio')+'" data-s="'+s[0]+'"><i style="background:'+s[2]+'"></i>'+s[1]+'</button>'}).join('');
  var popApi=typeof pop.showPopover==='function';if(popApi)pop.setAttribute('popover','');else pop.hidden=true;S.appendChild(pop);
  var sty=$('.st-sty',S);
  function togglePop(){if(popApi){pop.togglePopover()}else{pop.hidden=!pop.hidden}}
  sty.addEventListener('click',function(e){e.stopPropagation();togglePop()});
  pop.addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;if(x.dataset.s==='studio'){togglePop();return}leave(x.dataset.s)});
  if(!popApi)D.addEventListener('click',function(e){if(!pop.hidden&&!pop.contains(e.target))pop.hidden=true});
  function leave(st){try{localStorage.setItem('theis-stil',st);localStorage.setItem('theis-stil-gefragt','1')}catch(e){}location.reload()}

  /* Start */
  var first=route(location.href);
  if(!first){r.setAttribute('data-style','normal');return}
  /* Die Originalseite bleibt unsichtbar im Dokument; ihre IDs bekommen einen Vorsatz, damit Sprungziele eindeutig sind */
  $$('body [id]').forEach(function(e){e.id='orig-'+e.id});
  D.body.appendChild(S);
  go(location.href,{first:true});
  window.theisStudio={leave:leave};
})();
