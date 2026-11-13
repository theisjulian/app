/* theis-Website, Stil „Desktop“.
   Computer: Schreibtisch mit Menüleiste, Symbolen, Notizzettel, Dock und verschiebbaren Fenstern. Jede Seite der Website öffnet sich als Fenster (iframe derselben Seite, dort ohne Kopf- und Fußzeile).
   Handy: ein Chat mit theisapps; Fragen antippen oder tippen, die Antworten kommen als Nachrichten und Karten.
   Wird von site.js nur in diesem Stil geladen. Merkt sich offene Fenster nur für diesen Tab (sessionStorage). */
(function(){
  if(window.theisDesk)return;
  var r=document.documentElement,ME=document.currentScript&&document.currentScript.src;
  var ROOT=ME?new URL('../',ME).href:new URL('/',location.href).href;
  var IMG=ROOT+'assets/img/';
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE=matchMedia('(max-width:820px)').matches;
  function h(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
  function ss(k,v){try{if(v===undefined)return JSON.parse(sessionStorage.getItem(k)||'null');sessionStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
  function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function lput(k,v){try{localStorage.setItem(k,v)}catch(e){}}

  var APPS=[
    {id:'libretto',n:'Libretto',s:'Noten',i:'libretto-icon.png',demo:1},
    {id:'voce',n:'Voce',s:'Mündliche Prüfungen',i:'viva-icon.png',demo:1},
    {id:'foliva',n:'Foliva',s:'Arbeitsblätter',i:'foliva-icon.png',demo:1,tag:'Beta'},
    {id:'aula',n:'Aula',s:'Gruppen, Timer, Sitzplan',i:'aula-icon.png'},
    {id:'sportwahl',n:'Sportivo',s:'Sportwahl Oberstufe',i:'sportwahl-icon.svg'},
    {id:'namo',n:'’namo.',s:'Schülerfahrten',i:'namo-icon.png',demo:1}
  ];
  var BYID={};APPS.forEach(function(a){a.u=ROOT+a.id+'/';a.img=IMG+a.i;BYID[a.id]=a});
  /* Kleine Symbole als SVG (eigene Zeichnungen) */
  var SVG={
    folder:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="dkf1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2ff"/><stop offset="1" stop-color="#3f7cf0"/></linearGradient><linearGradient id="dkf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4ff"/><stop offset="1" stop-color="#5b93f7"/></linearGradient></defs><path d="M6 14a4 4 0 0 1 4-4h14l5 5h25a4 4 0 0 1 4 4v4H6z" fill="url(#dkf1)"/><rect x="6" y="19" width="52" height="37" rx="5" fill="url(#dkf2)"/><path d="M6 24h52" stroke="#fff" stroke-opacity=".35"/><g fill="#fff" fill-opacity=".9"><rect x="22" y="31" width="9" height="9" rx="2.5"/><rect x="33" y="31" width="9" height="9" rx="2.5"/><rect x="22" y="42" width="9" height="9" rx="2.5"/><rect x="33" y="42" width="9" height="9" rx="2.5"/></g></svg>',
    doc:'<svg viewBox="0 0 64 64"><path d="M14 6h26l12 12v38a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="#fff"/><path d="M40 6v9a3 3 0 0 0 3 3h9z" fill="#dfe5f3"/><g stroke="#b5bfd6" stroke-width="2.4" stroke-linecap="round"><path d="M19 28h26M19 35h26M19 42h26M19 49h16"/></g><path d="M19 20h14" stroke="#2f5bea" stroke-width="3" stroke-linecap="round"/></svg>',
    shield:'<svg viewBox="0 0 64 64"><path d="M14 6h26l12 12v38a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="#fff"/><path d="M40 6v9a3 3 0 0 0 3 3h9z" fill="#dfe5f3"/><path d="M32 24l11 4v8c0 7-5 11-11 14-6-3-11-7-11-14v-8z" fill="#2f5bea"/><path d="M27 37l4 4 7-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mail:'<svg viewBox="0 0 64 64"><defs><linearGradient id="dkm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa8ff"/><stop offset="1" stop-color="#2f5bea"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="14" fill="url(#dkm)"/><rect x="14" y="20" width="36" height="25" rx="4" fill="#fff"/><path d="M15 22l17 13 17-13" fill="none" stroke="#2f5bea" stroke-width="2.6" stroke-linejoin="round"/></svg>',
    cup:'<svg viewBox="0 0 64 64"><defs><linearGradient id="dkc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb46b"/><stop offset="1" stop-color="#f0702e"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="14" fill="url(#dkc)"/><path d="M18 26h22v10a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" fill="#fff"/><path d="M40 29h3a5 5 0 0 1 0 10h-4" fill="none" stroke="#fff" stroke-width="3"/><path d="M24 14c-2 3 2 4 0 7M31 14c-2 3 2 4 0 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>',
    stil:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="dks" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d7dff"/><stop offset=".55" stop-color="#9b6bff"/><stop offset="1" stop-color="#ff5ea8"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="14" fill="url(#dks)"/><rect x="14" y="17" width="36" height="24" rx="4" fill="#fff" fill-opacity=".92"/><rect x="14" y="17" width="36" height="6" rx="3" fill="#fff"/><circle cx="18.5" cy="20" r="1.4" fill="#ff5f57"/><circle cx="22.5" cy="20" r="1.4" fill="#febc2e"/><circle cx="26.5" cy="20" r="1.4" fill="#28c840"/><rect x="20" y="45" width="24" height="5" rx="2.5" fill="#fff" fill-opacity=".85"/></svg>',
    theis:'<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="14" fill="#fff"/><path d="M24 20v22c0 4 2 6 6 6h5" fill="none" stroke="#10131c" stroke-width="6" stroke-linecap="round"/><path d="M17 27h17" stroke="#10131c" stroke-width="6" stroke-linecap="round"/><rect x="38" y="16" width="8" height="8" rx="1.5" fill="#2f5bea"/></svg>'
  };
  var X='<svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2 2 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var STYLES=[['normal','Glas','radial-gradient(circle at 32% 28%,#fff 0 12%,transparent 30%),conic-gradient(from 200deg,#7d96ff,#c08bff,#ff9ccc,#7fe3d4,#7d96ff)'],
    ['neon','Neon','linear-gradient(120deg,#ff3ea5,#8a3ffc 55%,#2f6bff)'],
    ['heft','Schulheft','linear-gradient(#b9c8de 1px,transparent 1px) 0 0/7px 7px,linear-gradient(90deg,#b9c8de 1px,transparent 1px) 0 0/7px 7px,#f8f4e8'],
    ['plakat','Plakat','radial-gradient(circle at 70% 30%,#ff4b2b 0 24%,transparent 26%),#1d35c8'],
    ['desktop',MOBILE?'Chat':'Desktop','linear-gradient(#fff,#fff) 22% 26%/56% 44% no-repeat,linear-gradient(#ffffffaa,#ffffffaa) 35% 86%/30% 8% no-repeat,linear-gradient(140deg,#5d7dff,#9b6bff)']];

  /* Was zeigt eine Adresse? Schlüssel, Name, Symbol */
  function info(href){
    var u=new URL(href,location.href),p=u.pathname.replace(ROOT.replace(/^https?:\/\/[^/]+/,''),'/'),m=p.match(/^\/([a-z]+)\/(demo\/)?/);
    if(m&&m[1]==='viva')m[1]='voce';
    if(m&&m[1]==='gruppen')m[1]='aula';
    var a=m&&BYID[m[1]];
    if(a&&m[2])return {key:'demo:'+a.id,name:a.n+' – Demo',icon:a.img,app:a};
    if(a)return {key:a.id,name:a.n,icon:a.img,app:a};
    var name={'/':'theisapps','/datenschutz':'Datenschutz','/datenschutz.html':'Datenschutz','/impressum':'Impressum','/impressum.html':'Impressum','/lizenz':'Lizenz','/lizenz.html':'Lizenz','/kontakt/':'Kontakt'}[p];
    return {key:'p:'+p,name:name||'theisapps',icon:IMG+'favicon-192.png'};
  }
  function logo(){var b=document.querySelector('.bar .brand svg');return b?b.outerHTML:'<b>theisapps</b>'}

  /* Links in einem Fenster oder einer App: andere Programme öffnen ein eigenes Fenster, fremde Seiten einen neuen Tab */
  function hook(ifr,owner,openFn,onNav){
    var d;try{d=ifr.contentDocument}catch(e){return}
    if(!d||d.__dk)return;d.__dk=1;
    d.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
      var href=a.getAttribute('href');if(!href||/^(mailto|tel|javascript):/i.test(href))return;
      var u;try{u=new URL(a.href)}catch(x){return}
      if(u.origin!==location.origin){a.target='_blank';a.rel='noopener';return}
      if(a.hasAttribute('download')||/\.(pdf|zip|exe|dmg|json|mp4|webp|png)$/i.test(u.pathname)){a.target='_blank';return}
      var here=ifr.contentWindow.location;if(u.pathname===here.pathname&&u.search===here.search)return;
      var k=info(u.href).key;if(k===owner().key)return;
      e.preventDefault();openFn(u.href);
    },true);
    if(onNav)d.addEventListener('pointerdown',onNav,true);
  }
  function loader(icon){var l=h('div','dk-load');var im=new Image();im.alt='';im.src=icon;l.appendChild(im);return l}

  /* ================= Computer ================= */
  function desktop(){
    var D=h('div','dk');D.setAttribute('role','application');D.setAttribute('aria-label','theisapps Desktop');
    D.innerHTML='<div class="dk-wall"></div><div class="dk-mark" aria-hidden="true">'+logo()+'</div>';
    document.body.appendChild(D);
    var wins=[],Z=20,seq=0,menuBar,appName,dock,minArea;

    /* Menüleiste */
    menuBar=h('div','dk-menu');menuBar.setAttribute('role','menubar');D.appendChild(menuBar);
    function menu(label,items,cls){
      var m=h('div','dk-m'),b=h('button',cls||'',label);b.setAttribute('aria-haspopup','true');b.setAttribute('aria-expanded','false');
      var dd=h('div','dk-dd');dd.setAttribute('role','menu');m.appendChild(b);m.appendChild(dd);
      m.fill=function(){dd.innerHTML='';(typeof items==='function'?items():items).forEach(function(it){
        if(it==='-'){dd.appendChild(h('hr'));return}
        var x=h('button',it.dis?'dis':'','<span>'+it.t+'</span>'+(it.k?'<kbd>'+it.k+'</kbd>':''));x.setAttribute('role',it.chk!=null?'menuitemradio':'menuitem');if(it.chk!=null)x.setAttribute('aria-checked',it.chk?'true':'false');
        x.addEventListener('click',function(){closeMenus();it.f()});dd.appendChild(x)})};
      b.addEventListener('click',function(e){e.stopPropagation();var o=m.classList.contains('open');closeMenus();if(!o){m.fill();m.classList.add('open');b.setAttribute('aria-expanded','true')}});
      b.addEventListener('pointerenter',function(){if(menuBar.querySelector('.dk-m.open')&&!m.classList.contains('open')){closeMenus();m.fill();m.classList.add('open');b.setAttribute('aria-expanded','true')}});
      menuBar.appendChild(m);return b;
    }
    function closeMenus(){menuBar.querySelectorAll('.dk-m.open').forEach(function(m){m.classList.remove('open');m.firstChild.setAttribute('aria-expanded','false')})}
    document.addEventListener('click',closeMenus);
    var lb=menu(logo(),[
      {t:'Über theisapps',f:function(){open(ROOT+'#ueber')}},
      {t:'Kontakt',f:function(){open(ROOT+'kontakt/')}},
      {t:'Unterstützen',f:function(){open(ROOT+'#unterstuetzen')}},'-',
      {t:'Zur normalen Website',f:function(){leave('normal')}}],'dk-logo');
    lb.setAttribute('aria-label','theisapps-Menü');
    appName=menu('Schreibtisch',function(){var w=top1();var a=w&&w.app;return [
      {t:'Über '+(w?w.name:'theisapps'),dis:!w,f:function(){}},'-',
      a?{t:a.n+'-Seite öffnen',f:function(){open(a.u)}}:{t:'Startseite öffnen',f:function(){open(ROOT)}},
      a&&a.demo?{t:a.n+' im Browser ausprobieren',f:function(){open(a.u+'demo/')}}:{t:'Programme',f:folder},
      a&&a.id!=='aula'&&a.id!=='sportwahl'&&a.id!=='namo'?{t:'Herunterladen …',f:function(){open(a.u+'#laden')}}:{t:'Alle Programme',f:folder}]},'dk-app');
    menu('Ablage',function(){var w=top1();return [
      {t:'Neues Fenster: Startseite',f:function(){open(ROOT,true)}},
      {t:'Programme',f:folder},'-',
      {t:'In neuem Tab öffnen',dis:!w||!w.url(),f:function(){window.open(w.url(),'_blank','noopener')}},
      {t:'Fenster schließen',dis:!w,f:function(){w.close()}}]});
    menu('Fenster',function(){var l=[{t:'Im Dock ablegen',dis:!top1(),f:function(){top1().min()}},{t:'Vergrößern',dis:!top1(),f:function(){top1().max()}},{t:'Alle nebeneinander',dis:!wins.length,f:tile},'-'];
      wins.forEach(function(w){l.push({t:w.name,chk:w===top1(),f:function(){w.focus()}})});if(!wins.length)l.push({t:'Keine Fenster offen',dis:1,f:function(){}});return l});
    menu('Stil',function(){return STYLES.map(function(s){return {t:s[1],chk:s[0]==='desktop',f:function(){if(s[0]!=='desktop')leave(s[0])}}}).concat(['-',{t:'Stile vergleichen …',f:stilWin}])});
    menu('Hilfe',[{t:'So funktioniert der Desktop',f:function(){note(true)}},{t:'Kontakt',f:function(){open(ROOT+'kontakt/')}}]);
    var right=h('div','dk-right','<span aria-hidden="true"><svg viewBox="0 0 22 14"><rect x=".5" y=".5" width="18" height="13" rx="3.5" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="13" height="10" rx="2" fill="currentColor"/><rect x="19.5" y="4.5" width="2" height="5" rx="1" fill="currentColor" opacity=".5"/></svg></span><span aria-hidden="true"><svg viewBox="0 0 18 14"><path d="M9 12.5 1.2 4.6a11 11 0 0 1 15.6 0z" fill="currentColor"/></svg></span><time></time>');
    menuBar.appendChild(right);
    var clock=right.querySelector('time'),fmt=new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    function tick(){var n=new Date();clock.textContent=fmt.format(n).replace(/,/g,'');clock.dateTime=n.toISOString()}tick();setInterval(tick,15000);

    /* Symbole rechts */
    var icons=h('div','dk-icons');D.appendChild(icons);
    [{n:'Programme',g:SVG.folder,f:folder},
     {n:'Foliva ausprobieren',g:'<img src="'+IMG+'foliva-icon.png" alt=""><em>Demo</em>',f:function(){open(ROOT+'foliva/demo/')}},
     {n:'Voce ausprobieren',g:'<img src="'+IMG+'viva-icon.png" alt=""><em>Demo</em>',f:function(){open(ROOT+'voce/demo/')}},
     {n:'Libretto ausprobieren',g:'<img src="'+IMG+'libretto-icon.png" alt=""><em>Demo</em>',f:function(){open(ROOT+'libretto/demo/')}},
     {n:'Über mich',g:'<img class="round" src="'+IMG+'julian-blau.webp" alt="">',f:function(){open(ROOT+'#ueber')}},
     {n:'Kontakt',g:SVG.mail,f:function(){open(ROOT+'kontakt/')}},
     {n:'Datenschutz',g:SVG.shield,f:function(){open(ROOT+'datenschutz')}},
     {n:'Impressum',g:SVG.doc,f:function(){open(ROOT+'impressum')}}
    ].forEach(function(it){
      var b=h('button','dk-ic','<span class="g">'+it.g+'</span><span>'+it.n+'</span>');b.setAttribute('aria-label',it.n+' öffnen');
      var coarse=matchMedia('(pointer:coarse)').matches;
      b.addEventListener('click',function(e){e.stopPropagation();icons.querySelectorAll('.sel').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');if(coarse||e.detail===0)it.f()});
      b.addEventListener('dblclick',function(){it.f()});
      icons.appendChild(b);
    });
    D.querySelector('.dk-wall').addEventListener('pointerdown',function(){icons.querySelectorAll('.sel').forEach(function(x){x.classList.remove('sel')})});

    /* Notizzettel */
    var nt=null;
    function note(force){
      if(nt){nt.remove();nt=null;if(!force)return}
      if(!force&&lget('theis-desk-notiz')==='weg')return;
      nt=h('div','dk-note','<b>Willkommen auf dem Desktop!</b><p>Die Programme im Dock unten öffnen sich als Fenster. Fenster lassen sich an der Titelleiste verschieben und an der Ecke größer ziehen.</p><p>Doppelklick auf ein Symbol rechts öffnet es. Zurück zur normalen Website: Menü <i>Stil</i>.</p>');
      var x=h('button','x',X);x.setAttribute('aria-label','Notiz schließen');x.addEventListener('click',function(){lput('theis-desk-notiz','weg');nt.remove();nt=null});nt.appendChild(x);
      D.insertBefore(nt,icons);
    }
    note();

    /* Dock */
    dock=h('div','dk-dock');dock.setAttribute('role','toolbar');dock.setAttribute('aria-label','Dock');D.appendChild(dock);
    function dockBtn(label,inner,f,cls){var b=h('button',cls||'',inner+'<span class="tip">'+label+'</span>');b.setAttribute('aria-label',label);b.addEventListener('click',f);dock.appendChild(b);return b}
    dockBtn('Programme',SVG.folder,folder);
    APPS.forEach(function(a){a.dk=dockBtn(a.n,'<img src="'+a.img+'" alt="">',function(){var w=find(a.id);if(w){if(w.hidden||w!==top1())w.focus();else w.min()}else open(a.u)})});
    dock.appendChild(h('span','sep'));
    dockBtn('Unterstützen',SVG.cup,function(){open(ROOT+'#unterstuetzen')});
    dockBtn('Stil wählen',SVG.stil,stilWin);
    minArea=h('span','');minArea.style.display='contents';dock.appendChild(minArea);

    /* Fenster */
    function find(key){for(var i=0;i<wins.length;i++)if(wins[i].key===key)return wins[i];return null}
    function top1(){var t=null;wins.forEach(function(w){if(!w.hidden&&(!t||+w.el.style.zIndex>+t.el.style.zIndex))t=w});return t}
    function area(){var m=menuBar.offsetHeight;return {x:0,y:m,w:innerWidth,h:innerHeight-m-(dock.offsetHeight+16)}}
    function save(){ss('theis-desk',wins.map(function(w){return {u:w.url(),k:w.key,b:w.box(),m:w.isMax,h:w.hidden,z:+w.el.style.zIndex}}))}
    function syncUrl(){var w=top1(),u=w&&w.url();try{if(u)history.replaceState(history.state,'',u);else history.replaceState(history.state,'',ROOT)}catch(e){}
      appName.textContent=w?w.name.replace(/ – .*/,''):'Schreibtisch';document.title=w?w.name+' · theisapps':'theisapps';
      APPS.forEach(function(a){a.dk.classList.toggle('run',!!find(a.id))})}

    function Win(o){
      var self=this,el=h('div','dk-win');el.setAttribute('role','dialog');el.setAttribute('aria-label',o.name);
      self.el=el;self.key=o.key;self.name=o.name;self.app=o.app;self.hidden=false;self.isMax=false;
      el.innerHTML='<div class="dk-tb"><div class="dk-lights"><button class="c" aria-label="Schließen">'+X+'</button><button class="m" aria-label="Im Dock ablegen"><svg viewBox="0 0 10 10"><path d="M2 5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><button class="x" aria-label="Vergrößern"><svg viewBox="0 0 10 10"><path d="M2.5 6.5V2.5h4zM7.5 3.5v4h-4z" fill="currentColor"/></svg></button></div>'+
        '<div class="dk-nav"'+(o.native?' hidden':'')+'><button class="bk" aria-label="Zurück" disabled><svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="fw" aria-label="Vorwärts" disabled><svg viewBox="0 0 16 16"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>'+
        '<div class="dk-ttl"><img alt="" src="'+o.icon+'"><span></span></div>'+
        '<div class="dk-act"'+(o.native?' hidden':'')+'><button class="nt" aria-label="In neuem Tab öffnen" title="In neuem Tab öffnen"><svg viewBox="0 0 16 16"><path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>'+
        '<div class="dk-body"></div><div class="dk-re"></div><div class="dk-be"></div><div class="dk-rs"></div>';
      var body=el.querySelector('.dk-body'),ttl=el.querySelector('.dk-ttl span'),ico=el.querySelector('.dk-ttl img'),bk=el.querySelector('.bk'),fw=el.querySelector('.fw');
      ttl.textContent=o.name;
      var ifr=null,depth=0,maxDepth=0,pend=null;
      if(o.native){body.appendChild(o.native)}
      else{
        ifr=h('iframe');ifr.title=o.name;ifr.src=o.url;var ld=loader(o.icon);body.appendChild(ifr);body.appendChild(ld);
        var first=true;
        ifr.addEventListener('load',function(){
          ld.classList.add('done');
          var t='';try{t=ifr.contentDocument.title}catch(e){}
          var inf=info(self.url()||o.url);
          if(first)first=false;else if(pend)pend=null;else{depth++;maxDepth=depth}
          self.name=(t||inf.name).replace(/ · theisapps$/,'').replace(/^theisapps – .*/,'theisapps');ttl.textContent=self.name;el.setAttribute('aria-label',self.name);ico.src=inf.icon;
          if(inf.key!==self.key&&!find(inf.key)){self.key=inf.key;self.app=inf.app}
          hook(ifr,function(){return self},function(u){open(u)},function(){closeMenus();self.focus()});
          bk.disabled=depth<=0;fw.disabled=depth>=maxDepth;
          if(self===top1())syncUrl();save();
        });
        bk.addEventListener('click',function(){if(depth>0){depth--;pend=1;try{ifr.contentWindow.history.back()}catch(e){}}});
        fw.addEventListener('click',function(){if(depth<maxDepth){depth++;pend=1;try{ifr.contentWindow.history.forward()}catch(e){}}});
      }
      self.url=function(){if(!ifr)return null;try{var l=ifr.contentWindow.location.href;return l==='about:blank'?o.url:l}catch(e){return o.url}};
      self.box=function(){return [el.offsetLeft,el.offsetTop,el.offsetWidth,el.offsetHeight]};
      function place(b){el.style.left=b[0]+'px';el.style.top=b[1]+'px';el.style.width=b[2]+'px';el.style.height=b[3]+'px'}
      self.place=place;
      var a=area(),n=seq++%5,W=Math.min(o.w||1180,a.w-260),H=Math.min(o.h||860,a.h-28-n*24);
      place(o.b||[Math.max(16,Math.round((a.w-130-W)/2+n*30-60)),a.y+14+n*24,W,H]);
      self.focus=function(){
        if(self.hidden){self.hidden=false;el.hidden=false;if(self.mb){self.mb.remove();self.mb=null}if(!calm)el.animate([{transform:'translateY(40%) scale(.2)',opacity:0},{transform:'none',opacity:1}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)'})}
        if(el.style.zIndex!=Z)el.style.zIndex=++Z;wins.forEach(function(w){w.el.classList.toggle('on',w===self)});syncUrl();save()};
      self.close=function(){wins.splice(wins.indexOf(self),1);if(self.mb)self.mb.remove();
        var done=function(){el.remove();var t=top1();if(t)t.focus();else{syncUrl();save()}};
        if(calm)done();else el.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.94)'}],{duration:160,easing:'ease-in'}).finished.then(done,done)};
      self.min=function(){
        var tgt=self.app&&self.app.dk;
        var go=function(){self.hidden=true;el.hidden=true;el.classList.remove('on');
          if(!tgt){var mb=h('button','min','<img src="'+ico.src+'" alt=""><span class="tip">'+self.name.replace(/</g,'&lt;')+'</span>');mb.setAttribute('aria-label',self.name+' wieder öffnen');mb.addEventListener('click',function(){self.focus()});minArea.appendChild(mb);self.mb=mb}
          var t=top1();if(t)t.focus();else{syncUrl();save()}};
        if(calm){go();return}
        var dr=(tgt||dock).getBoundingClientRect(),er=el.getBoundingClientRect();
        el.animate([{transform:'none',opacity:1},{transform:'translate('+(dr.left+dr.width/2-er.left-er.width/2)+'px,'+(dr.top-er.top-er.height/2)+'px) scale(.06)',opacity:.3}],{duration:330,easing:'cubic-bezier(.5,0,.75,0)'}).finished.then(go,go)};
      var before=null;
      self.max=function(){el.classList.add('anim');
        if(self.isMax){place(before);self.isMax=false;el.classList.remove('max')}
        else{before=self.box();var a=area();place([8,a.y+8,a.w-16,a.h-12]);self.isMax=true;el.classList.add('max')}
        setTimeout(function(){el.classList.remove('anim');save()},320)};
      if(o.m){before=self.box();var a2=area();place([8,a2.y+8,a2.w-16,a2.h-12]);self.isMax=true;el.classList.add('max')}
      el.querySelector('.c').addEventListener('click',function(e){e.stopPropagation();self.close()});
      el.querySelector('.m').addEventListener('click',function(e){e.stopPropagation();self.min()});
      el.querySelector('.x').addEventListener('click',function(e){e.stopPropagation();self.max()});
      el.querySelector('.nt').addEventListener('click',function(){window.open(self.url(),'_blank','noopener')});
      el.addEventListener('pointerdown',function(){closeMenus();if(top1()!==self)self.focus()});
      /* Verschieben an der Titelleiste */
      var tb=el.querySelector('.dk-tb');
      tb.addEventListener('dblclick',function(e){if(!e.target.closest('button'))self.max()});
      tb.addEventListener('pointerdown',function(e){
        if(e.button||e.target.closest('button'))return;e.preventDefault();
        var sx=e.clientX,sy=e.clientY,ox=el.offsetLeft,oy=el.offsetTop,moved=false;tb.setPointerCapture(e.pointerId);
        function mv(ev){var dx=ev.clientX-sx,dy=ev.clientY-sy;if(!moved&&Math.abs(dx)+Math.abs(dy)<4)return;
          if(!moved){moved=true;D.classList.add('drag');if(self.isMax){var w0=el.offsetWidth;self.isMax=false;el.classList.remove('max');place(before||[0,0,Math.min(1100,w0),Math.min(800,innerHeight-140)]);ox=ev.clientX-el.offsetWidth*((sx-ox)/w0);oy=menuBar.offsetHeight;sx=ev.clientX;sy=ev.clientY;dx=dy=0}}
          el.style.left=Math.min(innerWidth-120,Math.max(120-el.offsetWidth,ox+dx))+'px';el.style.top=Math.min(innerHeight-60,Math.max(menuBar.offsetHeight,oy+dy))+'px'}
        function up(){tb.removeEventListener('pointermove',mv);tb.removeEventListener('pointerup',up);tb.removeEventListener('pointercancel',up);D.classList.remove('drag');if(moved)save()}
        tb.addEventListener('pointermove',mv);tb.addEventListener('pointerup',up);tb.addEventListener('pointercancel',up);
      });
      /* Größe ändern: Ecke, rechter und unterer Rand */
      [['.dk-rs',1,1],['.dk-re',1,0],['.dk-be',0,1]].forEach(function(q){var g=el.querySelector(q[0]);
        g.addEventListener('pointerdown',function(e){if(e.button)return;e.preventDefault();e.stopPropagation();self.focus();g.setPointerCapture(e.pointerId);D.classList.add('drag');
          var sx=e.clientX,sy=e.clientY,ow=el.offsetWidth,oh=el.offsetHeight;
          function mv(ev){if(q[1])el.style.width=Math.max(420,ow+ev.clientX-sx)+'px';if(q[2])el.style.height=Math.max(280,Math.min(innerHeight-el.offsetTop-6,oh+ev.clientY-sy))+'px'}
          function up(){g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);D.classList.remove('drag');self.isMax=false;el.classList.remove('max');save()}
          g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up)})});
      D.insertBefore(el,dock);wins.push(self);
      if(!calm&&!o.quiet)el.animate([{opacity:0,transform:'scale(.92) translateY(14px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
      if(o.h0){self.hidden=true;el.hidden=true}
      self.focus();
    }

    function open(href,fresh,opt){
      var inf=info(href),w=!fresh&&find(inf.key);
      if(w){if(w.url()!==new URL(href,location.href).href){try{w.el.querySelector('iframe').contentWindow.location.href=href}catch(e){}}w.focus();return w}
      opt=opt||{};
      return new Win({key:inf.key,name:inf.name,icon:inf.icon,app:inf.app,url:href,b:opt.b,m:opt.m,h0:opt.h,quiet:opt.quiet});
    }
    function folder(){
      var w=find('folder');if(w){w.focus();return}
      var f=h('div','dk-fold');
      f.innerHTML='<h2>Programme</h2><div class="dk-grid a"></div><h2>Im Browser ausprobieren</h2><div class="dk-grid d"></div><h2>Website</h2><div class="dk-grid s"></div>';
      function tile(g,img,b,s,tag,u){var t=h('button','dk-tile','<img src="'+img+'" alt=""><b>'+b+'</b><small>'+s+'</small>'+(tag?'<span class="tag">'+tag+'</span>':''));t.addEventListener('click',function(){open(u)});f.querySelector('.'+g).appendChild(t)}
      APPS.forEach(function(a){tile('a',a.img,a.n,a.s,a.tag,a.u)});
      APPS.filter(function(a){return a.demo}).forEach(function(a){tile('d',a.img,a.n+' – Demo','ohne Installation','',a.u+'demo/')});
      tile('s',IMG+'favicon-192.png','Startseite','theisapps.de','',ROOT);
      tile('s',IMG+'julian-blau.webp','Über mich','Julian Theis','',ROOT+'#ueber');
      tile('s',IMG+'favicon-192.png','Datenschutz','Was mit Daten passiert','',ROOT+'datenschutz');
      new Win({key:'folder',name:'Programme',icon:'data:image/svg+xml,'+encodeURIComponent(SVG.folder.replace(/url\(#(dkf\d)\)/g,'#5b93f7')),native:f,w:860,h:640});
    }
    function stilWin(){
      var w=find('stil');if(w){w.focus();return}
      var f=h('div','dk-stil','<p>Fünf Stile für dieselbe Website. Die Wahl gilt für alle Seiten und wird in diesem Browser gemerkt.</p><div class="dk-grid"></div>');
      STYLES.forEach(function(s){var b=h('button','dk-sw','<i style="background:'+s[2]+'"></i>'+s[1]);b.setAttribute('role','radio');b.setAttribute('aria-checked',s[0]==='desktop'?'true':'false');b.addEventListener('click',function(){if(s[0]!=='desktop')leave(s[0])});f.querySelector('.dk-grid').appendChild(b)});
      new Win({key:'stil',name:'Stil der Website',icon:'data:image/svg+xml,'+encodeURIComponent(SVG.stil.replace(/url\(#dks\)/,'#7a6bff')),native:f,w:700,h:340});
    }
    function tile(){
      var vis=wins.filter(function(w){return !w.hidden});if(!vis.length)return;var a=area(),n=vis.length,c=Math.ceil(Math.sqrt(n)),rws=Math.ceil(n/c),gw=(a.w-130)/c,gh=a.h/rws;
      vis.forEach(function(w,i){w.el.classList.add('anim');w.isMax=false;w.el.classList.remove('max');w.place([8+(i%c)*gw,a.y+6+Math.floor(i/c)*gh,gw-12,gh-12]);setTimeout(function(){w.el.classList.remove('anim')},320)});save();
    }
    function leave(st){
      var w=top1(),u=(w&&w.url())||ROOT;
      lput('theis-stil',st);lput('theis-stil-gefragt','1');ss('theis-desk',null);
      try{history.replaceState(null,'',u)}catch(e){}location.reload();
    }
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenus()});
    /* Browserfenster geändert: vergrößerte Fenster anpassen, andere sichtbar halten */
    var rz=0;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){var a=area();wins.forEach(function(w){
      if(w.isMax){w.place([8,a.y+8,a.w-16,a.h-12]);return}
      var b=w.box(),W=Math.min(b[2],a.w-16),H=Math.min(b[3],a.h-10);w.place([Math.min(Math.max(8,b[0]),a.w-W-8),Math.min(Math.max(a.y+4,b[1]),a.y+a.h-H),W,H])});save()},120)});
    /* Dock: Symbole wachsen unter dem Mauszeiger, die Nachbarn ein wenig mit */
    if(!calm&&matchMedia('(hover:hover) and (pointer:fine)').matches){
      var dbs=function(){return [].slice.call(dock.querySelectorAll('button'))};
      dock.addEventListener('pointermove',function(e){dbs().forEach(function(b){var r=b.getBoundingClientRect(),d=Math.abs(e.clientX-(r.left+r.width/2)),k=Math.max(0,1-d/150),s=1+.5*k*k*(3-2*k);
        b.style.setProperty('--z',s.toFixed(3))})});
      dock.addEventListener('pointerleave',function(){dbs().forEach(function(b){b.style.removeProperty('--z')})});
    }

    /* Start: gemerkte Fenster dieses Tabs, sonst die aufgerufene Seite */
    var saved=ss('theis-desk'),here=location.href,inf=info(here);
    if(saved&&saved.length){
      saved.sort(function(a,b){return a.z-b.z}).forEach(function(s){if(s.k==='folder')folder();else if(s.k==='stil')stilWin();else open(s.u,true,{b:s.b,m:s.m,h:s.h,quiet:1})});
      var hit=null;wins.forEach(function(w){if(w.url()&&info(w.url()).key===inf.key)hit=w});
      if(!hit&&inf.key!=='p:/')open(here);else if(hit)hit.focus();
    }else if(inf.key==='p:/'&&!location.hash){folder()}
    else open(here);
    return {leave:leave};
  }

  /* ================= Handy: Chat mit theisapps ================= */
  /* Kein Nachbau der Website: Man fragt, theisapps antwortet mit Nachrichten und Karten. Programme für den Computer werden nicht vorgeführt, sondern als Link an den Computer geschickt. */
  function chat(){
    var C=h('div','ct');C.setAttribute('aria-label','theisapps im Chat');
    var MAIL='hallo'+'@'+'theisapps.de',STRIPE='https://buy.stripe.com/3cI3cv0i8eLk31g4mNgw000';
    var INFO={
      libretto:{shot:'libretto-gemischt.webp',t:'Noten führen und nach der GSO verrechnen, von der 5. Klasse bis Q13.',f:[['Rechnet nach','GSO, KMK und ISB'],['Daten','verschlüsselt, nur lokal'],['Version','1.0.6']],pc:1},
      voce:{shot:'voce-bewerten.webp',t:'Mündliche Schulaufgaben planen, nach den Rastern für Bayern bewerten und den Bogen für jede Schülerin und jeden Schüler ausgeben.',f:[['Für','Englisch, Italienisch, Französisch, Spanisch'],['Daten','nur auf Ihrem Rechner'],['Version','1.9.3']],pc:1},
      foliva:{shot:'foliva-editor.webp',t:'Arbeitsblätter und Proben gestalten, mit Lösungsblatt auf Knopfdruck und fast 400 Vorlagen.',f:[['Für','Grundschule bis Gymnasium'],['Vorlagen','fast 400'],['Stand','Beta 0.9.14']],pc:1,neu:'Neu: Foliva gibt es jetzt als Beta zum Herunterladen.'},
      aula:{shot:'aula-bilden.webp',t:'Zufällige, ausgewogene Gruppen mit einem Klick, dazu Timer, Uhr, Sitzplan und Tagesübersicht, groß am Beamer.',f:[['Früher','Gruppo'],['Daten','nur auf dem Gerät'],['Version','1.4.0']],pc:1},
      sportwahl:{shot:'sportwahl-verteilung.webp',t:'Die Sportwahl der Oberstufe: Wahlbogen über Mebis, Kursplanung und Verteilung, mit Warnung bei Regelverstößen.',f:[['Für','Q12 und Q13 im G9'],['Läuft','im Browser'],['Daten','nur in Ihrem Browser']],web:1},
      namo:{shot:'namo-handys.webp',t:'Klassenfahrten, Studienfahrten und andere Schülerfahrten organisieren: Programm, Zimmer, Tickets und Ansagen für die ganze Gruppe am Handy.',f:[['Für','Lehrkräfte und Reisegruppe'],['Läuft auf','Handy und Browser'],['Einrichtung','auf Anfrage']],phone:1}
    };
    C.innerHTML='<div class="ct-bg"></div>'+
      '<header class="ct-hd"><span class="ct-av"><img src="'+IMG+'julian-blau.webp" alt=""><i></i></span><span class="ct-who"><b>theisapps</b><small>Julian · Software für den Schulalltag</small></span>'+
      '<button type="button" class="ct-ib ct-stil" aria-label="Stil der Website"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="8" r="1.3" fill="currentColor"/><circle cx="10.5" cy="6.4" r="1.3" fill="currentColor"/><circle cx="13.4" cy="9" r="1.3" fill="currentColor"/><path d="M8.5 13.6c1.6.6 3 .2 3.6-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></header>'+
      '<div class="ct-log" role="log" aria-live="polite"><div class="ct-day">Heute</div></div>'+
      '<footer class="ct-ft"><div class="ct-chips"></div><form class="ct-in"><input type="text" enterkeyhint="send" autocomplete="off" placeholder="Frage stellen …" aria-label="Frage an theisapps"><button type="submit" aria-label="Senden"><svg viewBox="0 0 20 20"><path d="M10 16V4M5 9l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form></footer>'+
      '<div class="ct-sheet" hidden><div role="dialog" aria-label="Stil der Website"><i class="grab"></i><h3>Stil der Website</h3><p>Am Computer wird aus diesem Stil ein Schreibtisch mit Fenstern, am Handy dieser Chat.</p><div class="dk-grid"></div></div></div>'+
      '<div class="ct-page" hidden><div class="ct-pg-hd"><button type="button" class="ct-ib" aria-label="Schließen"><svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><b></b><span></span></div><div class="ct-pg-bd"></div></div>';
    document.body.appendChild(C);
    var log=C.querySelector('.ct-log'),chips=C.querySelector('.ct-chips'),form=C.querySelector('.ct-in'),inp=form.querySelector('input'),queue=Promise.resolve(),busy=0;
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function down(){log.scrollTo({top:log.scrollHeight,behavior:calm?'auto':'smooth'})}
    function wait(ms){return new Promise(function(r){setTimeout(r,calm?0:ms)})}
    function add(el){log.appendChild(el);down();return el}
    function me(t){var r=h('div','ct-row me');r.appendChild(h('div','ct-b',esc(t)));add(r)}
    /* Antworten nacheinander, mit kurzem Tippen davor */
    function say(parts,next){
      busy++;setChips([]);
      parts.forEach(function(p){queue=queue.then(function(){
        var ty=add(h('div','ct-row bot','<div class="ct-b ct-ty" aria-label="schreibt"><i></i><i></i><i></i></div>'));
        return wait(typeof p==='string'?Math.min(1100,380+p.length*7):650).then(function(){ty.remove();var r=h('div','ct-row bot');
          if(typeof p==='string')r.appendChild(h('div','ct-b',p));else r.appendChild(p);add(r);
          r.querySelectorAll('img').forEach(function(i){i.addEventListener('load',down)});return wait(160)})})});
      queue=queue.then(function(){busy--;setChips(next||MAINCHIPS)});
    }
    function setChips(list){chips.innerHTML='';list.forEach(function(c){var b=h('button','ct-chip',esc(c[0]));b.type='button';b.addEventListener('click',function(){ask(c[0],c[1])});chips.appendChild(b)});chips.scrollLeft=0}
    function ask(label,intent){if(busy)return;me(label);run(intent)}
    var MAINCHIPS=[['Welche Programme gibt es?','alle'],['Arbeitsblätter','foliva'],['Noten','libretto'],['Mündliche Prüfungen','voce'],['Gruppen und Timer','aula'],['Sportwahl','sportwahl'],['Schülerfahrten','namo'],['Was kostet das?','kosten'],['Meine Daten?','daten'],['Wer steckt dahinter?','ueber'],['Kontakt','kontakt']];
    function btns(list){var d=h('div','ct-acts');list.forEach(function(x){var b=h(x.href?'a':'button','ct-act'+(x.main?' main':''),esc(x.t));if(x.href){b.href=x.href;if(/^https?:/.test(x.href)){b.target='_blank';b.rel='noopener'}}else{b.type='button';b.addEventListener('click',x.f)}d.appendChild(b)});return d}
    function card(id){
      var a=BYID[id],I=INFO[id],c=h('div','ct-card a-'+id);
      c.innerHTML='<div class="ct-shot"><img src="'+IMG+I.shot+'" alt="" loading="lazy"></div><div class="ct-cbody"><div class="ct-cn"><img src="'+a.img+'" alt=""><span><b>'+a.n+(a.tag?' <em>'+a.tag+'</em>':'')+'</b><small>'+a.s+'</small></span></div><p>'+I.t+'</p><dl>'+I.f.map(function(f){return '<div><dt>'+f[0]+'</dt><dd>'+f[1]+'</dd></div>'}).join('')+'</dl></div>';
      var acts=[];
      if(I.phone)acts.push({t:'Demo am Handy öffnen',main:1,f:function(){page(a.u+'demo/',a.n+' – Demo')}});
      else acts.push({t:'Link an den Computer schicken',main:1,f:function(){send(a.u,a.n)}});
      acts.push({t:'Ganze Seite lesen',f:function(){page(a.u,a.n)}});
      c.querySelector('.ct-cbody').appendChild(btns(acts));
      return c;
    }
    function carousel(){
      var w=h('div','ct-car');
      APPS.forEach(function(a){var b=h('button','ct-mini','<img src="'+a.img+'" alt=""><b>'+a.n+'</b><small>'+a.s+'</small>'+(a.tag?'<em>'+a.tag+'</em>':''));b.type='button';b.addEventListener('click',function(){ask(a.n,a.id)});w.appendChild(b)});
      return w;
    }
    /* Link teilen: Teilen-Menü des Handys, sonst E-Mail an sich selbst, sonst kopieren */
    function send(u,name){
      var url=new URL(u,location.href).href,title=name+' · theisapps';
      var done=function(how){me(how);say(['Gut. Am Computer öffnen Sie den Link, laden das Programm und los geht’s.'],[['Andere Programme','alle'],['Was kostet das?','kosten'],['Kontakt','kontakt']])};
      if(navigator.share){navigator.share({title:title,text:name+' für den Computer',url:url}).then(function(){done('Link geteilt')},function(){})}
      else{location.href='mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(url);done('Per E-Mail geschickt')}
    }
    /* Ganze Seite: liegt als Blatt über dem Chat */
    var pg=C.querySelector('.ct-page'),pgb=pg.querySelector('.ct-pg-bd'),pgt=pg.querySelector('b'),pgs=pg.querySelector('.ct-pg-hd span');
    function page(u,name){
      var inf=info(u);pgt.textContent=name;pgs.innerHTML='<img src="'+inf.icon+'" alt="">';pgb.innerHTML='';
      var f=h('iframe');f.title=name;f.src=u;var ld=loader(inf.icon);pgb.appendChild(f);pgb.appendChild(ld);
      f.addEventListener('load',function(){ld.classList.add('done');hook(f,function(){return info(f.contentWindow.location.href)},function(nu){try{f.contentWindow.location.href=nu}catch(e){}})});
      pg.hidden=false;try{history.pushState({ct:1},'')}catch(e){}
    }
    function closePage(){if(pg.hidden)return;pg.classList.add('out');setTimeout(function(){pg.hidden=true;pg.classList.remove('out');pgb.innerHTML=''},calm?0:260)}
    pg.querySelector('button').addEventListener('click',function(){history.state&&history.state.ct?history.back():closePage()});
    addEventListener('popstate',closePage);

    function run(k){
      var a=BYID[k];
      if(a){var I=INFO[k],more=[];
        if(I.neu)more.push(I.neu);
        if(I.pc)more.push(a.n+' ist ein Programm für Mac und Windows, am Handy lässt es sich nicht installieren. Schicken Sie sich den Link einfach an den Computer.');
        if(I.web)more.push('Sportivo läuft im Browser, ganz ohne Installation. Für die Planung eignet sich der Computer am besten.');
        if(I.phone)more.push('’namo. ist fürs Handy gemacht. Die Demo zeigt eine erfundene Fahrt, Sie können also gleich hier ausprobieren.');
        var oth=APPS.filter(function(x){return x.id!==k}).slice(0,3).map(function(x){return [x.n,x.id]});
        say([card(k)].concat(more),[['Was kostet das?','kosten']].concat(oth,[['Alle Programme','alle']]));return}
      ({
        hallo:function(){say(['Hallo! Hier ist theisapps.','Ich bin Julian, Lehrer für Englisch und Italienisch an einem Gymnasium in München. Ich baue Programme für den Schulalltag in Bayern: kostenlos, ohne Konto, und Ihre Daten bleiben auf Ihrem Gerät.','Was suchen Sie?'])},
        alle:function(){say(['Sechs Programme, alle kostenlos:',carousel(),'Tippen Sie auf eines, dann erzähle ich mehr.'])},
        kosten:function(){say(['Nichts. Alle Programme sind kostenlos, ohne Konto und ohne Werbung.',(function(){var d=h('div','ct-b','Wenn Ihnen eines Zeit spart, können Sie mir einen Kaffee ausgeben. Das ist freiwillig, bezahlt wird sicher über Stripe.');d.appendChild(btns([{t:'Einen Kaffee ausgeben',main:1,href:STRIPE}]));return d})()])},
        daten:function(){say(['Ihre Daten bleiben auf Ihrem Gerät. Es gibt kein Konto und keinen Server, auf dem Noten, Namen oder Arbeitsblätter landen. Libretto verschlüsselt zusätzlich alle Noten.','Einzige Ausnahme ist ’namo.: Damit die ganze Reisegruppe denselben Stand sieht, liegen die Reisedaten auf einem Server in der EU und werden nach der Fahrt gelöscht.',(function(){var d=h('div','ct-b','Alles im Detail:');d.appendChild(btns([{t:'Datenschutzerklärung',f:function(){page(ROOT+'datenschutz','Datenschutz')}}]));return d})()])},
        ueber:function(){var p=h('div','ct-photo','<img src="'+IMG+'julian-blau.webp" alt="Julian">');say([p,'Ich bin Julian und unterrichte Englisch und Italienisch an einem Gymnasium in München. Die Programme schreibe ich, weil ich sie selbst brauche oder weil Kolleginnen und Kollegen danach fragen.','Den Programmcode schreibe ich mit Hilfe von KI (Claude von Anthropic). Was die Programme können und ob sie richtig rechnen, lege ich selbst fest und prüfe es im Unterricht.'])},
        kontakt:function(){var d=h('div','ct-b','Fragen, Fehler, Ideen? Schreiben Sie mir an <b>'+MAIL+'</b>.');d.appendChild(btns([{t:'E-Mail schreiben',main:1,href:'mailto:'+MAIL+'?subject='+encodeURIComponent('Frage zu theisapps')},{t:'Impressum',f:function(){page(ROOT+'impressum','Impressum')}}]));say([d])},
        laden:function(){say(['Libretto, Voce, Foliva und Aula sind Programme für Mac und Windows. Am Handy lassen sie sich nicht installieren.','Am einfachsten: Sie schicken sich den Link an den Computer.',btns([{t:'Link an den Computer schicken',main:1,f:function(){send(ROOT+'#programme','Programme')}}])])},
        demo:function(){say(['Die Demos von Libretto, Voce und Foliva brauchen einen großen Bildschirm. Am Computer oder Tablet laufen sie direkt im Browser.','Die Demo von ’namo. ist dagegen fürs Handy gemacht.',btns([{t:'’namo.-Demo öffnen',main:1,f:function(){page(ROOT+'namo/demo/','’namo. – Demo')}},{t:'Link an den Computer',f:function(){send(ROOT+'#programme','Programme')}}])])},
        stil:function(){sheet()},
        weiss:function(){say(['Das weiß ich leider nicht. Vielleicht hilft eines davon weiter – oder Sie schreiben mir direkt an '+MAIL+'.'])}
      }[k]||function(){run('weiss')})();
    }
    var KW=[[/foliva|arbeitsbl|blatt|probe|grundschul|lösung|vorlage|förder/,'foliva'],[/libretto|note|zeugnis|gso|notenschl|schulaufgabe(?!.*mündl)/,'libretto'],[/voce|viva|mündl|prüfung|sprechen|raster/,'voce'],
      [/aula|gruppo|gruppe|timer|sitzplan|beamer|uhr/,'aula'],[/sport|kurs|q1[23]|mebis|sportivo/,'sportwahl'],[/namo|fahrt|reise|ausflug|ticket|zimmer/,'namo'],
      [/kost|preis|geld|gratis|kostenlos|zahl|kaffee|spend|unterstütz/,'kosten'],[/daten|dsgvo|sicher|server|cloud|privat/,'daten'],[/download|herunterl|laden|install|mac|windows|pc|computer/,'laden'],
      [/demo|ausprobier|test/,'demo'],[/kontakt|mail|schreib|fehler|frage|impressum/,'kontakt'],[/wer|julian|über dich|über sie|lehrer|ki|claude/,'ueber'],[/programm|app|übersicht|alle|was gibt/,'alle'],[/stil|design|theme|aussehen|farbe|dunkel/,'stil'],[/^(hallo|hi|hey|servus|moin|grüß|guten)/,'hallo']];
    form.addEventListener('submit',function(e){e.preventDefault();var t=inp.value.trim();if(!t||busy)return;inp.value='';me(t);var l=t.toLowerCase(),k='weiss';for(var i=0;i<KW.length;i++)if(KW[i][0].test(l)){k=KW[i][1];break}run(k)});
    /* Stil wählen */
    var sh=C.querySelector('.ct-sheet');
    STYLES.forEach(function(s){var b=h('button','dk-sw','<i style="background:'+s[2]+'"></i>'+s[1]);b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked',s[0]==='desktop'?'true':'false');
      b.addEventListener('click',function(){if(s[0]==='desktop'){sh.hidden=true;return}leave(s[0])});sh.querySelector('.dk-grid').appendChild(b)});
    function sheet(){sh.hidden=false;sh.querySelector('button').focus()}
    sh.addEventListener('click',function(e){if(e.target===sh)sh.hidden=true});
    C.querySelector('.ct-stil').addEventListener('click',sheet);
    function leave(st){lput('theis-stil',st);lput('theis-stil-gefragt','1');location.reload()}
    /* Einstieg: auf einer Programmseite gleich dieses Programm */
    var inf=info(location.href),start=inf.app?inf.app.id:(location.hash==='#ueber'?'ueber':location.hash==='#unterstuetzen'?'kosten':/datenschutz/.test(location.pathname)?'daten':/impressum|kontakt/.test(location.pathname)?'kontakt':null);
    run('hallo');
    if(start){queue=queue.then(function(){var a=BYID[start];me(a?'Erzählen Sie mir von '+a.n:({ueber:'Wer steckt dahinter?',kosten:'Was kostet das?',daten:'Meine Daten?',kontakt:'Kontakt'})[start]);run(start)})}
    return {leave:leave};
  }

  var api=MOBILE?chat():desktop();
  window.theisDesk=api;
  /* Wechsel zwischen Handy- und Computerbreite: neu aufbauen */
  matchMedia('(max-width:820px)').addEventListener('change',function(){location.reload()});
})();
