/******************* ANIMEKAI / ANIKAI *************************/
/* enc-dec.app API - used when anikai.to is active */
var encDecApi={
  encKai:function(text,cb){
    console.log('[KAI-DBG] encKai req',(text+'').substring(0,20)+'...');
    $ap('https://enc-dec.app/api/enc-kai?text='+encodeURIComponent(text),function(r){
      if (r.ok){ try{ var j=JSON.parse(r.responseText); console.log('[KAI-DBG] encKai ok'); cb(j.result); }catch(e){ console.log('[KAI-DBG] encKai parse err',e); cb(null); } }
      else{ console.log('[KAI-DBG] encKai fail',r.status); cb(null); }
    });
  },
  decKai:function(text,cb){
    console.log('[KAI-DBG] decKai req len',(text+'').length);
    $ap('https://enc-dec.app/api/dec-kai?text='+encodeURIComponent(text),function(r){
      if (r.ok){ try{ var j=JSON.parse(r.responseText); console.log('[KAI-DBG] decKai ok'); cb(j.result); }catch(e){ console.log('[KAI-DBG] decKai parse err',e); cb(null); } }
      else{ console.log('[KAI-DBG] decKai fail',r.status); cb(null); }
    });
  },
  decMega:function(text,agent,cb){
    console.log('[KAI-DBG] decMega req len',(text+'').length);
    var ua=(typeof _JSAPI!=='undefined'&&_JSAPI.getUserAgent)?_JSAPI.getUserAgent():(typeof Conf!=='undefined'&&Conf.USER_AGENT)?Conf.USER_AGENT:('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    $apPost('https://enc-dec.app/api/dec-mega',{text:text,agent:agent||ua},function(r){
      if (!r.ok){ console.log('[KAI-DBG] decMega fail status',r.status); cb(null); return; }
      var raw=r.responseText||'';
      console.log('[KAI-DBG] decMega resp len',raw.length);
      if (!raw||raw.length<2){ console.log('[KAI-DBG] decMega empty resp'); cb(null); return; }
      try{
        var j=JSON.parse(raw);
        var res=j.result;
        if (res&&typeof res==='object'&&res.sources){
          console.log('[KAI-DBG] decMega ok has sources');
          cb(res);
        }else if (res&&typeof res==='string'){
          try{ var parsed=JSON.parse(res); cb(parsed); }catch(e2){ cb(null); }
        }else{
          console.log('[KAI-DBG] decMega unexpected result shape raw:',raw.substring(0,200));
          cb(null);
        }
      }catch(e){
        console.log('[KAI-DBG] decMega parse err',e.message,'resp head:',raw.substring(0,120));
        cb(null);
      }
    });
  }
};
var ANIKAI_PROXY='https://deno-proxies-sznvnpnxwhbv.deno.dev/?url=';
function kaiUrl(url){
  if (typeof kai!=='undefined'&&kai.useEncDec&&kai.useDenoProxy)
    return ANIKAI_PROXY+encodeURIComponent(url);
  return url;
}
function cleanJsonHtml(s){
  if (!s)return'';
  return (s+'').replace(/\\"/g,'"').replace(/\\'/g,"'").replace(/\\\\/g,'\\').replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\r/g,'\r');
}
if (__SDKAI){
  $ap('https://raw.githubusercontent.com/amarullz/AnimeTV/refs/heads/master/tools/utils/kai.js?'+$time(),function(r){
    if (r.ok){
      try{ eval(r.responseText); }catch(e){}
    }
  });
}
const kai={
  sdns:'megaup.cc',
  dns:'anikai.to',
  useEncDec:true,
  useDenoProxy:true,
  req(u,cb,vdns){
    if (!vdns){
      vdns=__SD_DOMAIN?__SD_DOMAIN:kai.dns;
    }
    var fullUrl="https://"+vdns+u;
    return $ap(kaiUrl(fullUrl),cb,{
      "X-Org-Prox":"https://"+vdns+"/",
      "X-Ref-Prox":"https://"+vdns+"/",
      'X-Requested-With':'XMLHttpRequest',
      'Pragma':'no-cache',
      'Cache-Control':'no-cache'
    });
  },
  caches:{
    ttip:{},
    eps:{}
  },
  getTooltip(id, cb, url, isview){
    var tipOut={
      tip:null,
      ep:null,
      more:null,
      n:0
    };
    if (!id && url){
      id=url;
    }
    var ttip_ttid=id;

    if (id in kai.caches.ttip){
      requestAnimationFrame(
        function(){
          cb(JSON.parse(kai.caches.ttip[id]));
        }
      );
      return;
    }
    function tipFinalize(){
      if (tipOut.n<3){
        return;
      }
      var o=tipOut.tip;
      o.ep=tipOut.ep.epnum;
      o.epdata=tipOut.ep; 
      o.more=tipOut.more;
      o.poster='';
      o.banner='';

      if (o.more){
        if (o.more.poster){
          o.poster=o.more.poster;
        }
        if (o.more.banner){
          o.banner=o.more.banner;
        }
        if (o.more.detail.duration){
          o.duration=o.more.detail.duration;
        }
        if (o.more.detail.genres){
          o.genre=o.more.detail.genres.toLowerCase().replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
          });
        }
        if (o.more.detail.status){
          o.status=o.more.detail.status.toUpperCase();
        }
        if (tipOut.more.anilistid){
          o.anilistId=tipOut.more.anilistid;
        }
        if (tipOut.more.malid){
          o.malId=tipOut.more.malid;
        }
      }

      console.log(o);
      kai.caches.ttip[id]=JSON.stringify(o);
      cb(o);
    }

    /* parse ttip */
    function tipParse(r){
      var o={
        title:'',
        title_jp:'',
        synopsis:'',
        genres:[],
        quality:null,
        ep:0,
        rating:'',
        ttid:''
      };
      var d=$n('div','',0,0,r);

      
      try{
        var did=d.querySelector('[data-id]').getAttribute('data-id');
        o.ttid=o.url=ttip_ttid;
        // o.ttid=

        var detailuri=d.querySelector('a.watch-btn').getAttribute('href');
        kai.req(detailuri,function(t){
          if (t.ok){
            var txs=t.responseText;
            try{
              var jsdt=JSON.parse(txs);
              if (jsdt && ('result' in jsdt)){
                txs=jsdt.result;
              }
            }catch(e){}
            var g=$n('div','',0,0,txs);
            // window._kaitip=g;
            tipOut.more={
              banner:'',
              poster:'',
              desc:'',
              detail:{}
            };
            try{
              tipOut.more.banner=g.querySelector('div.player-main div.player-bg').style.backgroundImage.slice(4, -1).replace(/["']/g, "");
              tipOut.more.poster=g.querySelector('section div.poster-wrap div.poster img').src;
              tipOut.more.desc=g.querySelector('section div.main-entity div.desc').textContent.trim();

              try{
                tipOut.more.type=g.querySelector('section div.main-entity div.info span:last-child').textContent;
              }catch(e){}

              /* Get Anilist */
              try{
                var meta=g.querySelector('div#wrapper main div[data-meta]');
                try{
                  tipOut.more.anilistid = meta.getAttribute('data-al-id');
                }catch(ee){}
                try{
                  tipOut.more.malid = meta.getAttribute('data-mal-id');
                }catch(ee){}
              }catch(e){}

              var dtEl=g.querySelectorAll('section div.main-entity div.detail>div');
              tipOut.more.detail={};
              for (var i=0;i<dtEl.length;i++){
                var tx=dtEl[i].textContent.split(':');
                if (tx.length==2){
                  var key=tx[0].trim().toLowerCase();
                  var val=tx[1].trim().toLowerCase();
                  tipOut.more.detail[key]=val;
                }
              }
            }catch(e){}
            g.innerHTML='';
          }
          tipOut.n++;
          tipFinalize();
        });
      }
      catch(e){
        return 0;
      }
      var tt=d.querySelector('div.title');
      if (tt){
        o.title=tt.textContent.trim();
        o.title_jp=tt.getAttribute('data-jp');
      }
      try{
        o.synopsis=d.querySelector('div.desc').textContent.trim();
      }catch(e){}
      try{
        var gn=d.querySelectorAll('div.genre a');
        for (var i=0;i<gn.length;i++){
          var gd={
            name:gn[i].textContent.trim(),
            val:null
          };
          var gnr=gn[i].getAttribute('href').split('/');
          gd.val=gnr[gnr.length-1].trim();
          o.genres.push(gd);
        }
      }catch(e){}
      try{
        o.rating=d.querySelector('span.ttrating').textContent.trim();
      }catch(e){}
      tipOut.tip=o;

      tipOut.n++;
      tipFinalize();
      return 1;
    }

    /* parse episodes */
    function epParse(r){
      var raw=r;
      if (typeof r==='object'&&r&&'result' in r) raw=r.result;
      if (typeof raw==='string') raw=cleanJsonHtml(raw);
      var d=$n('div','',0,0,raw);
      var epEls=d.querySelectorAll('ul li a[token], ul li a[num], ul.range li a');
      if (epEls.length===0) epEls=d.querySelectorAll('a[token], a[num]');
      var epd={
        ep:[],
        epnum:0,
        epsub:0,
        epdub:0
      };
      for (var i=0;i<epEls.length;i++){
        var t=epEls[i];
        var tok=t.getAttribute('token');
        if (!tok) continue;
        var p={};
        p.ep=(t.getAttribute('num')||(i+1))+"";
        p.token=tok;
        var lg = toInt(t.getAttribute('langs'));
        if (lg&2==2){
          epd.epdub++;
          p.dub=true;
        }
        if (lg&1==1){
          epd.epsub++;
        }
        p.filler=t.classList.contains('filler');
        epd.epnum++;
        p.title="EP-"+p.ep;
        p.title_jp=p.title;
        var tt=t.querySelector('span');
        if (tt){
          var titen=tt.textContent.trim();
          var titjp=tt.getAttribute('data-jp').trim();
          if (titen){
            p.title=titen;
            p.title_jp=titen;
          }
          if (titjp){
            p.title_jp=titjp;
          }
        }
        epd.ep.push(p);
      }
      tipOut.ep=epd;
    }

    /* Load Tooltip */
    kai.req("/ajax/anime/tip?id="+enc(id),function(r){
      if (r.ok){
        var vd=JSON.parse(r.responseText);
        if ('result' in vd){
          if (tipParse(vd.result)){
            return;
          }
        }
      }
      tipOut.n+=2;
      tipFinalize();
    });

    /* Load Episodes Info */
    function doEpisodesReq(encToken){
      var epUrl="/ajax/episodes/list?ani_id="+enc(id)+"&_="+(encToken||enc(id));
      kai.req(epUrl,function(r){
        if (r.ok){
          var vd=JSON.parse(r.responseText);
          var resHtml=vd;
          if (typeof vd==='object'&&'result' in vd){
            resHtml=vd.result;
            if (typeof resHtml==='string') resHtml=cleanJsonHtml(resHtml);
            epParse(resHtml);
          }
        }
        tipOut.n++;
        tipFinalize();
      });
    }
    if (kai.useEncDec){
      encDecApi.encKai(id,function(tok){
        doEpisodesReq(tok);
      });
    }else if (typeof KAICODEX!=='undefined'&&KAICODEX.enc){
      doEpisodesReq(KAICODEX.enc(id));
    }else{
      doEpisodesReq(null);
    }
  },
  getView(url,f){
    var uid=++_API.viewid;
    var ux=url.split('#');
    var uri=ux[0];
    var ep=1;
    if (ux.length==2){
      ep=ux[1]?ux[1]:0;
    }
    function callCb(d){
      d.status=true;
      f(JSON.parse(JSON.stringify(d)),uid);
    }
    function failCb(){
      f({status:false},uid);
    }

    /* DATA FETCH */
    var dat ={
      tip:null,
      out:{}
    };

    function datacb(d){
      if (!d){
        failCb();
        return;
      }
      dat.tip=d;
      dat.out={
        "title": d.title,
        "title_jp": d.title_jp,
        "synopsis": (d.more&&d.more.desc)?d.more.desc:d.synopsis,
        "genres": d.genres,
        "quality": null,
        "banner": d.banner,
        "rating": "",
        "ttid": d.ttid,
        "url": d.url,
        "poster": d.poster,
        "rating":"",
        "status": false,
        "epavail": d.ep,
        "epdub": d.epdata.epdub,
        "type": "",
        "genre": d.genre?d.genre:'',
        "info": {
            "type": {
                "val": "_TV",
                "name": "TV"
            },
            "rating": "",
            "quality": null
        },
        "ep": [],
        "epactive":0,
        "epactivenum":ep,
        "servers":{dub:[],sub:[],softsub:[]},
        "streamtype":"sub",
        "stream_url":{}
      };

      if (d.anilistId){
        dat.out.anilistId=d.anilistId;
      }
      if (d.malId){
        dat.out.malId=d.malId;
      }

      /* fetch episode */
      function encTokenForEp(tok,cb){
        if (kai.useEncDec){
          encDecApi.encKai(tok,cb);
        }else if (typeof KAICODEX!=='undefined'&&KAICODEX.enc){
          cb(KAICODEX.enc(tok));
        }else{
          cb(enc(tok));
        }
      }
      var eps=d.epdata.ep;
      var encPending=eps.length;
      var encTokens=[];
      if (encPending===0){
        console.log("KAI PROVIDER DATA:");
        console.log(dat.out);
        callCb(dat.out);
        return;
      }
      for (var i=0;i<eps.length;i++){
        (function(idx){
          encTokenForEp(eps[idx].token,function(encTok){
            encTokens[idx]=encTok||enc(eps[idx].token);
            encPending--;
            if (encPending<=0){
              for (var j=0;j<eps.length;j++){
                var pp=eps[j];
                var oe={
                  "ep":pp.ep,
                  "url":dat.out.url+"#"+pp.ep,
                  "active":ep==pp.ep,
                  "title":pp.title,
                  "title_jp":pp.title_jp,
                  "dub":pp.dub,
                  "filler":pp.filler,
                  "token":pp.token,
                  "epuri":"/ajax/links/list?token="+enc(pp.token)+"&_="+(encTokens[j]||enc(pp.token))
                };
                if (oe.active){
                  dat.out.epactive=j;
                }
                dat.out.ep.push(oe);
              }
              try{
                dat.out.ep[dat.out.epactive].active=true;
                dat.out.epactivenum = dat.out.ep[dat.out.epactive].ep;
              }catch(e){}
              console.log("KAI PROVIDER DATA:");
              console.log(dat.out);
              callCb(dat.out);
            }
          });
        })(i);
      }
    }

    /* get tooltip data */
    kai.getTooltip(uri, datacb, uri, true);
    return uid;
  },
  loadVideo(dt,cb){
    console.log('[KAI-DBG] loadVideo start streamtype='+(dt.streamtype||''));
    var aEp=dt.ep[dt.epactive];
    if (!aEp){
      console.log('[KAI-DBG] loadVideo FAIL: no aEp');
      cb(null);
      return;
    }

    function serverOpen(eps){
      console.log('[KAI-DBG] serverOpen sub/soft/dub:',(eps.sub?eps.sub.length:0),(eps.softsub?eps.softsub.length:0),(eps.dub?eps.dub.length:0));
      console.log(eps);

      dt.streamtype="sub";
      var is_soft=false;
      var streamObj=eps.sub;
      if (_API.currentStreamType==2){
        if (eps.dub.length>0){
          dt.streamtype="dub";
          streamObj=eps.dub;
        } 
      }
      else if (pb.cfg_data.lang!='hard' || pb.cfg_data.lang!='sub'){
        is_soft=true;
      }
      if (is_soft && (_API.currentStreamType==1)){
        if (eps.softsub.length>0){
          dt.streamtype="softsub";
          streamObj=eps.softsub;
        }
      }

      dt.servers=JSON.parse(JSON.stringify(eps));
      dt.stream_url={};
      if (eps.softsub.length>0){
        dt.stream_url.soft="1";
      }
      if (eps.dub.length>0){
        dt.stream_url.dub="1";
      }
      if (eps.sub.length>0){
        dt.stream_url.hard="1";
      }

      var srcuri="";
      for (var i=0;i<streamObj.length;i++){
        var sc=streamObj[i];
        if ((pb.cfg_data.mirrorserver==i) || !srcuri){
          srcuri=sc.suri;
          dt.stream_provider=sc.n;
        }
      }

      /* Load Data */
      function onLinkViewDecoded(decResult){
        console.log('[KAI-DBG] onLinkViewDecoded',decResult?'has result':'null');
        if (!decResult){
          console.log('[KAI-DBG] onLinkViewDecoded FAIL: no decResult');
          cb(null);
          return;
        }
        var sv;
        try{
          sv=typeof decResult==='string'?JSON.parse(decResult):decResult;
        }catch(e){ console.log('[KAI-DBG] onLinkViewDecoded parse err',e); cb(null); return; }
        console.log('[KAI-DBG] sv.url',sv&&sv.url?sv.url.substring(0,50)+'...':'none');
        dt.skip=[[0,0],[0,0]];
        if (sv&&'skip' in sv){
          if ('intro' in sv.skip){
            try{ dt.skip[0]=[sv.skip.intro[0],sv.skip.intro[1]]; }catch(e){}
          }
          if ('outro' in sv.skip){
            try{ dt.skip[1]=[sv.skip.outro[0],sv.skip.outro[1]]; }catch(e){}
          }
        }
        var megaId=(sv.url||'').split('/');
        megaId=megaId[megaId.length-1];
        if (!megaId){ console.log('[KAI-DBG] no megaId from sv.url'); cb(null); return; }
        var mediaHost=(sv.url||'').replace(/^https?:\/\//,'').split('/')[0]||kai.sdns;
        var megaUrl="/media/"+megaId;
        var fullMediaUrl="https://"+mediaHost+megaUrl;
        console.log('[KAI-DBG] fetch media',megaUrl);
        function doMediaFetch(fetchCb){
          if (kai.useEncDec){
            $ap(fullMediaUrl,fetchCb,{
              "X-Org-Prox":"https://"+mediaHost+"/",
              "X-Ref-Prox":"https://"+mediaHost+"/",
              "X-NoH-Proxy":"1",
              'X-Requested-With':'XMLHttpRequest'
            });
          }else{
            kai.req(megaUrl,fetchCb,kai.sdns);
          }
        }
        doMediaFetch(function(r2){
          console.log('[KAI-DBG] media resp',r2.ok?'ok':'fail');
          if (r2.ok){
            try{
              var rs2=JSON.parse(r2.responseText);
              var resStr=(rs2&&'result' in rs2)?rs2.result:rs2;
              function onMegaDecoded(megaResult){
                console.log('[KAI-DBG] onMegaDecoded',megaResult?'has result':'null');
                if (megaResult){
                  var sv2=typeof megaResult==='string'?JSON.parse(megaResult):megaResult;
                  if (sv2&&sv2.sources&&sv2.sources[0]){
                    console.log('[KAI-DBG] m3u8 url len',(sv2.sources[0].file||'').length);
                    cb(sv2);
                  }else{
                    console.log('[KAI-DBG] onMegaDecoded no sources');
                    cb(null);
                  }
                }else cb(null);
              }
              var decAgent=(typeof _JSAPI!=='undefined'&&_JSAPI.getUserAgent)?_JSAPI.getUserAgent():(typeof Conf!=='undefined'&&Conf.USER_AGENT)?Conf.USER_AGENT:null;
              if (kai.useEncDec){
                encDecApi.decMega(resStr,decAgent,onMegaDecoded);
              }else if (typeof KAICODEX!=='undefined'&&KAICODEX.decMega){
                try{ onMegaDecoded(JSON.parse(KAICODEX.decMega(resStr))); }catch(e){ cb(null); }
              }else{ cb(null); }
            }catch(e){ cb(null); }
          }else cb(null);
        });
      }
      console.log('[KAI-DBG] fetch links/view',srcuri.substring(0,80)+'...');
      kai.req(srcuri,function(r){
        console.log('[KAI-DBG] links/view resp',r.ok?'ok':'fail',r.status);
        if (r.ok){
          try{
            var rs=JSON.parse(r.responseText);
            var resStr=(rs&&'result' in rs)?rs.result:rs;
            if (kai.useEncDec){
              encDecApi.decKai(resStr,onLinkViewDecoded);
            }else if (typeof KAICODEX!=='undefined'&&KAICODEX.dec){
              try{
                var decStr=KAICODEX.dec(resStr);
                onLinkViewDecoded(decStr);
              }catch(e){ cb(null); }
            }else{ cb(null); }
          }catch(e){ cb(null); }
        }else cb(null);
      });
    }

    if (aEp.token in kai.caches.eps){
      requestAnimationFrame(function(){
        serverOpen(kai.caches.eps[aEp.token]);
      });
      return;
    }

    function encLid(lid,cb){
      if (kai.useEncDec){
        encDecApi.encKai(lid,cb);
      }else if (typeof KAICODEX!=='undefined'&&KAICODEX.enc){
        cb(KAICODEX.enc(lid));
      }else{
        cb(enc(lid));
      }
    }
    function serverParse(r){
      console.log('[KAI-DBG] serverParse start');
      var rawHtml=typeof r==='string'?cleanJsonHtml(r):r;
      var htmlStr=(typeof rawHtml==='string')?rawHtml:(rawHtml&&rawHtml.result?rawHtml.result:(''+rawHtml));
      var d=$n('div','',0,0,htmlStr);
      var sList=[
        d.querySelectorAll('div[data-id="sub"] span.server, div[data-id="hard"] span.server'),
        d.querySelectorAll('div[data-id="softsub"] span.server'),
        d.querySelectorAll('div[data-id="dub"] span.server')
      ];
      var serversRaw=[];
      for (var j=0;j<3;j++){
        var ls=sList[j];
        for (var i=0;i<ls.length;i++){
          var t=ls[i];
          var lid=t.getAttribute('data-lid');
          if (lid){
            serversRaw.push({lid:lid,n:t.textContent.trim(),p:i,j:j});
          }
        }
      }
      if (serversRaw.length===0){
        var lidRe=/data-lid="([^"]+)"/g;
        var lids=[];
        var m;
        while ((m=lidRe.exec(htmlStr))!==null){ lids.push(m[1]); }
        lids.forEach(function(lid,i){
          serversRaw.push({lid:lid,n:'Server '+(i+1),p:i,j:0});
        });
      }
      var encPending=serversRaw.length;
      var encResults={};
      if (encPending===0){
        console.log('[KAI-DBG] serverParse FAIL: no servers found');
        d.innerHTML='';
        cb(null);
        return;
      }
      console.log('[KAI-DBG] serverParse found',serversRaw.length,'servers');
      serversRaw.forEach(function(sr,idx){
        encLid(sr.lid,function(encTok){
          encResults[idx]=encTok||enc(sr.lid);
          encPending--;
          if (encPending<=0){
            var epServers=[[],[],[]];
            serversRaw.forEach(function(sr2,k){
              var so={lid:sr2.lid,n:sr2.n,p:sr2.p};
              so.suri="/ajax/links/view?id="+enc(sr2.lid)+"&_="+(encResults[k]||enc(sr2.lid));
              epServers[sr2.j].push(so);
            });
            kai.caches.eps[aEp.token]={sub:epServers[0],softsub:epServers[1],dub:epServers[2]};
            d.innerHTML='';
            serverOpen(kai.caches.eps[aEp.token]);
          }
        });
      });
    }

    console.log('[KAI-DBG] loadVideo fetch links/list epuri',(aEp.epuri||'').substring(0,60)+'...');
    kai.req(aEp.epuri,function(r){
      console.log('[KAI-DBG] links/list resp',r.ok?'ok':'fail');
      if (r.ok){
        var rs=null;
        try{ rs=JSON.parse(r.responseText); }catch(e){}
        if (rs && ('result' in rs)){
          var res=rs.result;
          serverParse(typeof res==='string'?cleanJsonHtml(res):res);
          return;
        }
      }
      console.log('[KAI-DBG] links/list no result, cb(null)');
      cb(null);
    });
  },
  /* PARSE HOME SLIDESHOW */
  parseHomeSlideshow:function(d){
    var r=d.querySelectorAll('main section div.swiper.featured div.swiper-slide');
    var g=[];
    for (var i=0;i<r.length;i++){
      try{
        var k=r[i];
        var h={};
        h.banner=k.style.backgroundImage.slice(4, -1).replace(/["']/g, "");
        h.synopsis=k.querySelector('p.desc').textContent.trim();
        var titEl=k.querySelector('p.title');
        h.title=titEl.textContent.trim();
        h.title_jp=titEl.getAttribute('data-jp');
        if (!h.title_jp) h.title_jp=h.title;
        h.url=h.tip=k.querySelector('div.swiper-ctrl div[data-id]').getAttribute('data-id');

        try{
          h.ep=k.querySelector('div.info span.sub').textContent;
        }catch(e){}

        try{
          h.type=k.querySelector('div.info span:nth-last-child(2)').textContent;
        }catch(e){}
        g.push(h);
      }catch(e2){}
    }
    return g;
  }
};




/* ANIWAVE & ANIX SOURCE */
// if (__SD<=2){
//   $ap('https://raw.githubusercontent.com/amarullz/AnimeTV/master/tools/utils/vrf.js?'+$time(),function(r){
//     if (r.ok){
//       try{
//         eval(r.responseText+"\n\nwindow.VRF=VRF;");
//       }catch(e){}
//     }
//   });
// }
const wave={
  ns:'https://'+__DNS,
  origin:{
    "X-Org-Prox":"https://"+__DNS+"/",
    "X-Ref-Prox":"https://"+__DNS+"/",
    'X-Requested-With':'XMLHttpRequest',
    'Pragma':'no-cache',
    'Cache-Control':'no-cache'
  },
  vrfEncrypt:function (t) {
    return VRF.vrfEncrypt(t);
  },
  vrfDecrypt:function(input){
    return VRF.vrfDecrypt(input);
  },

  /* PARSE HOME SLIDESHOW */
  parseHomeSlideshow:function(d){
    var r=d.querySelectorAll('.swiper-wrapper .swiper-slide.item');
    var g=[];
    for (var i=0;i<r.length;i++){
      try{
        var h={};
        var slide_url=r[i].querySelector('a.btn.play').getAttribute('href');
        h.banner=r[i].querySelector('.image div').style.backgroundImage.slice(4, -1).replace(/["']/g, "");
        h.synopsis=r[i].querySelector('.info .synopsis').textContent.trim();
        var t=d.querySelector('#top-anime .side [href="'+slide_url+'"].item');
        if (t){
          var tt=t.querySelector('div.d-title');
          h.title=tt.textContent.trim();
          h.title_jp=tt.getAttribute('data-jp');
          h.url=t.href;
          h.tip=t.querySelector('div.poster').getAttribute('data-tip');
          h.poster=$imgcdn(t.querySelector('img').src);
          h.adult=t.querySelector('div.adult')?true:false;
          try{
            h.ep=(t.querySelector('span.ep-status.sub').textContent+'').trim()
          }catch(e){}
          try{
            h.type=(t.querySelector('div.info .meta span.dot:not(.ep-wrap)').textContent+'').trim();
          }catch(e){}
          g.push(h);
        }
      }catch(e2){}
    }
    return g;
  },
  
  /* Get Episode View */
  view_cache:{},
  getView:function(url_with_hash, f, retuid){
    var uid=retuid?retuid:++_API.viewid;
    try { if (VRF){} }
    catch(e){
      console.log("No VRF Yet...");
      setTimeout(function(){
        wave.getView(url_with_hash,f,uid);
      },500);
      return uid;
    }
    var url_parse_hash=url_with_hash.split('#');
    var url=url_parse_hash[0];
    var hash_ep='';
    if (url_parse_hash[1]){
      hash_ep=url_parse_hash[1];
    }
    var url_parse=url.split('/');
    var animeId = url_parse[4];
    var epId = 1;
    if (url_parse[5]){
      epId=url_parse[5].substring(3);
    }

    // var root_view_url='https://'+__DNS+(__SD==1?'/watch/':'/anime/')+animeId;
    var root_view_url='https://'+__DNS+'/watch/'+animeId;
    var watch_url=root_view_url+'/ep-'+epId;
    console.log("WATCH URL : "+watch_url);

    console.log(
      "wave.getView - EPID: "+epId+" / url="+url+" / fullurl = "+url_with_hash+" / animeId = "+animeId+" / ROOTURL = "+root_view_url);
    var data=null;

    function cbErr(msg){
      console.warn(msg);
      f({status:false},uid);
    }

    function skipScore(s){
      var sc=(s[0][0]+s[0][1]>0)?1:0;
      sc+=(s[1][0]+s[1][1]>0)?1:0;
      return sc;
    }
    function callCb(d){
      if (!d.stream_url.hard){
        d.stream_url.hard=d.stream_url.soft;
        d.skip_vals.hard=d.skip_vals.soft;
      }
      d.stream_vurl = d.stream_url.hard;
      d.skip=d.skip_vals.hard;
      var cscore=skipScore(d.skip);
      d.streamtype="sub";
      var is_soft=false;
      if (_API.currentStreamType==2){
        if (d.stream_url.dub){
          d.stream_vurl = d.stream_url.dub;
          d.streamtype="dub";
          if (d.skip_vals.dub.length>0){
            if (cscore<skipScore(d.skip_vals.dub)){
              d.skip=d.skip_vals.dub;
            }
          }
        }
        else if (pb.cfg_data.lang!='hard' || pb.cfg_data.lang!='sub'){
          is_soft=true;
        }
      }
      if (is_soft||_API.currentStreamType==1){
        if (d.stream_url.soft){
          d.stream_vurl = d.stream_url.soft;
          d.streamtype="softsub";
          if (d.skip_vals.soft.length>0){
            if (cscore<skipScore(d.skip_vals.soft)){
              d.skip=d.skip_vals.soft;
            }
          }
        }
      }
      f(JSON.parse(JSON.stringify(d)),uid);
    }

    function loadServer(){
      var slist_url=
        "/ajax/server/list/"+
        data.curr_ep+'?vrf='+enc(wave.vrfEncrypt(data.curr_ep));
      var num_servers=0;
      var loaded_servers=0;
      data.servers={
        'sub':[],
        'softsub':[],
        'dub':[]
      };
      function fetchServer(t,s){
        data.stream_url[t]='';
        data.skip_vals[t]=[];
        if (!s){
          return;
        }
        var dLink=s.getAttribute('data-link-id');
        var isFilemoon=s.isfilemoon?true:false;
        var svurl=
          "/ajax/server/"+
          dLink+'?vrf='+enc(wave.vrfEncrypt(dLink));
        $a(svurl,function(r){
          if (r.ok){
            try{
              var j=JSON.parse(r.responseText);
              var surl=wave.vrfDecrypt(j.result.url);
              if (isFilemoon){
                surl+="#FILEMOON";
              }
              var skdt=JSON.parse(wave.vrfDecrypt(j.result.skip_data));
              data.stream_url[t]=surl;
              data.skip_vals[t]=[
                skdt.intro,
                skdt.outro
              ];
            }catch(e){}
          }
          if (++loaded_servers>=num_servers){
            data.status=true;
            callCb(data);
          }
        },{
          'X-Requested-With':'XMLHttpRequest',
          "X-Ref-Prox":url
        });
      }
      function findServer(stid, d){
        var sid={
          main:null,
          mirror:null,
        };
        // data.servers
        var mp4upload=null;
        var load_s=null;

        var vnames=[
          'vidplay','megaf','mp4u','moonf'
        ];
        var vtitles=[
          'VidPlay','MegaF','Mp4Upload','Filemoon'
        ];
        if ('server_ids' in VRF){
          vnames=VRF.server_ids;
        }
        if ('server_titles' in VRF){
          vtitles=VRF.server_titles;
        }

        for (var i=0;i<d.length;i++){
          var s=d[i];
          var st=s.textContent.toLowerCase().trim();
          if (st==vnames[0]){
            sid.main=s;
            data.servers[stid].push(
              pb.serverobj(vtitles[0],0)
            );
            if (pb.server_selected(3)==0){
              load_s=s;
            }
          }
          else if (st==vnames[1]){
            sid.mirror=s;
            data.servers[stid].push(
              pb.serverobj(vtitles[1],1)
            );
            if (pb.server_selected(3)==1){
              load_s=s;
            }
          }
          else if (st==vnames[2]){
            if (!_ISELECTRON){
              mp4upload=s;
              data.servers[stid].push(
                pb.serverobj(vtitles[2],2)
              );
              if (pb.server_selected(3)==2){
                load_s=s;
              }
            }
          }
          else if (st==vnames[3]){
            s.isfilemoon=true;
            data.servers[stid].push(
              pb.serverobj(vtitles[3],3)
            );
            if (pb.server_selected(3)==3){
              load_s=s;
            }
          }
        }
        
        if (!load_s){
          if (sid.main==null && sid.mirror==null && mp4upload){
            sid.main=mp4upload;
          }
          else if (sid.mirror==null && mp4upload){
            sid.mirror=mp4upload;
          }
          else if (sid.main==null && mp4upload){
            sid.main=sid.mirror;
            sid.mirror=mp4upload;
          }
          if (pb.server_selected(3)==1){
            load_s=(sid.main)?sid.main:sid.mirror;
          }
          else{
            load_s=(sid.mirror)?sid.mirror:sid.main;
          }
        }
        if (load_s){
          num_servers++;
          return load_s;
        }
        return null;
      }
      $a(slist_url,function(r){
        if (r.ok){
          var query_el=(__SD==1)?'li':'div.server';
          try{
            var j=JSON.parse(r.responseText);
            var d=$n('div','',0,0,j.result);
            fetchServer('hard',findServer('sub',d.querySelectorAll('[data-type=sub] '+query_el)));
            fetchServer('soft',findServer('softsub',d.querySelectorAll('[data-type=softsub] '+query_el)));
            fetchServer('dub',findServer('dub',d.querySelectorAll('[data-type=dub] '+query_el)));
            d.innerHTML='';
            d='';
            return;
          }catch(e){}
        }
        cbErr('findServer');
      },{
        'X-Requested-With':'XMLHttpRequest',
        "X-Ref-Prox":url
      });
    }

    if (animeId in wave.view_cache){
      data=wave.view_cache[animeId];
      data.url=watch_url;
      var sold=data.ep[data.curr_ep_index];
      if (sold){
        sold.active=false;
      }
      for (var i=0;i<data.ep.length;i++){
        var s=data.ep[i];
        var g=false;
        if (hash_ep){
          if (hash_ep==s.ids) g=true;
        }else if (epId==s.datanum) g=true;
        if (g){
          s.active=true;
          data.curr_ep=s.ids;
          data.curr_ep_index=i;
          break;
        }
      }
      loadServer();
      return uid;
    }
    else{
      data={
        status:true,
        title:'',
        title_jp:'',
        synopsis:'',
        stream_url:{
            hard:'',
            soft:'',
            dub:''
        },
        skip_vals:{
          hard:[],
          soft:[],
          dub:[]
        },
        stream_vurl:'',
        poster:'',
        banner:null,
        "url":watch_url,
        skip:[],
        ep:[],
        related:[],
        genres:[],
        seasons:[],
        recs:[],
        info:{
            type:null,
            rating:null,
            quality:null
        },
        curr_ep:0,
        curr_ep_index:0,
        animeId:null
      };
    }

    function getEpisodes(){
      var eps_url="/ajax/episode/list/"+data.animeId+'?vrf='+enc(wave.vrfEncrypt(data.animeId));
      $a(eps_url,function(r){
        if (r.ok){
          try{
            var j=JSON.parse(r.responseText);
            var d=$n('div','',0,0,j.result);
            var ep=[];
            if (__SD==1){
              ep=d.querySelectorAll(".body li a");
            }
            else{
              ep=d.querySelectorAll("div.range-wrap a");
            }
            data.ep=[];
            for (var i=0;i<ep.length;i++){
              var a=ep[i];
              var s={};
              s.ids=a.getAttribute('data-ids');
              s.sub=toInt(a.getAttribute('data-sub'))?true:false;
              s.dub=toInt(a.getAttribute('data-dub'))?true:false;
              s.slug=a.getAttribute('data-slug');
              s.datanum=a.getAttribute('data-num');
              s.url=root_view_url+'/ep-'+s.slug+"#"+s.ids;
              var b=a.firstElementChild;
              if (b){
                s.ep=b.textContent;
                var span=b.nextElementSibling;
                s.title=span.textContent;
              }
              else{
                s.ep=a.textContent;
                s.title='';
              }

              if (epId==s.datanum){
              // if (a.classList.contains('active')){
                s.active=true;
                data.curr_ep=s.ids;
                data.curr_ep_index=i;
              }
              if (a.classList.contains('filler')){
                s.filler=true;
              }
              data.ep.push(s);
            }
            d.innerHTML='';
            d='';

            // Cache:
            wave.view_cache[animeId]=data;
            loadServer();
            return;
          }catch(e){
            console.warn("Error wave.getEpisodes "+e);
          }
        }
        cbErr('getEpisodes');
      },{'X-Requested-With':'XMLHttpRequest'});
    }
    function waveParse(d){
      try{
        var player=d.querySelector('#player');
        data.animeId=d.querySelector('#watch-main').getAttribute('data-id');
        try{
          data.banner=player.style.backgroundImage.slice(4, -1).replace(/["']/g, "");
        }catch(e){}
        data.poster=d.querySelector('#w-info img').src;
        var title=d.querySelector('#w-info h1')
        data.title=title.textContent;
        data.title_jp=title.getAttribute('data-jp');
        data.synopsis=d.querySelector('#w-info .info .synopsis .content').textContent;

        /* info */
        var info=d.querySelector('#w-info');
        if (info){
            /* get genres */
            var bmeta=info.getElementsByClassName('bmeta');
            if (bmeta[0]){
                try{
                    /* Find Genres */
                    var k=bmeta[0].firstElementChild.lastElementChild.getElementsByTagName('a');
                    for (var i=0;i<k.length;i++){
                        try{
                            var gn={};
                            gn.val=k[i].href.substring(k[i].href.lastIndexOf('/')+1);
                            gn.name=k[i].textContent.trim();
                            data.genres.push(gn);
                        }catch(ee){}
                    }
                }catch(e){}
                try{
                    /* Find Type */
                    var r=bmeta[0].firstElementChild.firstElementChild.getElementsByTagName('a');
                    if (r.length>0){
                        data.info.type={
                            val:r[0].getAttribute('href'),
                            name:r[0].textContent.trim()
                        };
                    }
                }catch(e){}
            }
            try{
                /* rating */
                data.info.rating=info.querySelectorAll("i.rating")[0].textContent;
            }catch(e){}
            try{
                /* quality */
                data.info.quality=info.querySelectorAll("i.quality")[0].textContent;
            }catch(e){}
        }

        /* get seasons */
        var ses=d.querySelector('#w-seasons');
        if (ses){
            var sa=ses.getElementsByTagName('a');
            data.seasons=[];
            for (var i=0;i<sa.length;i++){
                var sv={};
                sv.url=sa[i].href;
                sv.title=sa[i].textContent.trim();
                if (sa[i].parentNode.className.indexOf(' active')>0)
                    sv.active=true;
                try{
                    sv.poster=sa[i].style.backgroundImage.slice(4, -1).replace(/["']/g, "");
                }catch(e){}
                data.seasons.push(sv);
            }
        }

        /* get related */
        var rel=d.querySelector('#w-related');
        if (rel){
            var ri=rel.getElementsByTagName('a');
            for (var i=0;i<ri.length;i++){
                try{
                    var ra=ri[i];
                    var rd={};
                    rd.poster=ra.getElementsByTagName('img')[0].src;
                    rd.url=ra.href;
                    rd.title=ra.getElementsByClassName('d-title')[0].textContent.trim();
                    var dtip=ra.querySelector('[data-tip]');
                    if (dtip)
                       rd.tip=dtip.getAttribute('data-tip');
                    data.related.push(rd);
                }catch(e){}
            }
        }

        /* get recs */
        var ws=d.querySelector('#watch-second');
        if (ws){
            var wss=ws.querySelector('section.w-side-section');
            if (wss){
                var recs=wss.querySelectorAll('a.item');
                for (var i=0;i<recs.length;i++){
                    try{
                        var ra=recs[i];
                        var rd={};
                        rd.url=ra.href;
                        rd.poster=ra.querySelector('img').src;
                        rd.title=ra.querySelector('div.d-title').textContent.trim();
                        var dtip=ra.querySelector('[data-tip]');
                        if (dtip)
                           rd.tip=dtip.getAttribute('data-tip');
                        data.recs.push(rd);
                    }catch(e){}
                }
            }
        }

        getEpisodes();
        return true;
      }catch(e){
        console.warn("Error waveParse "+e);
      }
      return false;
    }

    function anixParse(d){
      try{
        data.animeId=d.querySelector('main div.watch-wrap').getAttribute('data-id');
        var ply=d.querySelector('#ani-player-section');
        try{
          data.banner=ply.querySelector('div.player-bg').style.backgroundImage.slice(4, -1).replace(/["']/g, "");
        }catch(e){}
        /* info */
        var info=d.querySelector('#ani-detail-info');
        if (info){
            var poster=info.querySelector('div.poster img');
            var title=info.querySelector('.maindata h1');
            var content=info.querySelector('.maindata .description .full.cts-block');
            if (poster){
              data.poster=poster.src;
            }
            if (title){
                data.title=(title.textContent+"").trim();
                data.title_jp=title.getAttribute('data-jp');
            }
            if (content){
              data.synopsis=(content.textContent+"").trim();
            }

            /* get genres */
            var bmeta=info.querySelector('.metadata');
            if (bmeta){
              var cmeta=bmeta.querySelectorAll('div.limiter div div');
              function findMeta(kw){
                for (var i=0;i<cmeta.length;i++){
                  if ((cmeta[i].textContent+"").trim().toLowerCase()==kw){
                    return cmeta[i].nextElementSibling;
                  }
                }
                return null;
              }

              var gnr=findMeta('genre:');
              if (gnr){
                try{
                  var k=gnr.querySelectorAll('a');
                  for (var i=0;i<k.length;i++){
                    try{
                      var gn={};
                      gn.val=k[i].href.substring(k[i].href.lastIndexOf('/')+1);
                      gn.name=k[i].textContent.trim();
                      data.genres.push(gn);
                    }catch(ee){}
                  }
                }catch(e){}
              }
              
              gnr=findMeta('type:');
              if (gnr){
                try{
                  var k=gnr.querySelector('a');
                  if (k){
                    data.info.type={
                      val:k.getAttribute('href'),
                      name:k.textContent.trim()
                    };
                  }
                }catch(e){}
              }
            }
            try{
                /* rating */
                data.info.rating=info.querySelector('.maindata .sub-info .rating').textContent;
            }catch(e){}

            try{
                /* quality */
                data.info.quality=info.querySelector('.maindata .sub-info .quality').textContent;
            }catch(e){}
        }

        /* get seasons */
        if (ply){
          data.seasons=[];
          var sa=ply.querySelectorAll('div.ani-season div.ani-season-body a');
          for (var i=0;i<sa.length;i++){
              var sv={};
              sv.url=sa[i].href;
              sv.title=(sa[i].textContent+'').trim();
              if (sa[i].classList.contains('active')){
                  sv.active=true;
              }
              try{
                  sv.poster=sa[i].querySelector('div.swiper-banner').style.backgroundImage.slice(4, -1).replace(/["']/g, "");
              }catch(e){}
              data.seasons.push(sv);
          }
        }

        /* get related */
        var ri=d.querySelectorAll('section.sidebar-set.related div.sidebar-item a');
        for (var i=0;i<ri.length;i++){
            try{
                var ra=ri[i];
                var rd={};
                rd.poster=ra.querySelector('div.poster img').src;
                rd.url=ra.href;
                rd.title=(ra.querySelector('div.ani-detail div.ani-name').textContent+'').trim();
                rd.tip=ra.querySelector('div.poster').getAttribute('data-tip');
                data.related.push(rd);
            }catch(e){}
        }

        var ws=d.querySelectorAll('section.sidebar-set:not(.related) div.sidebar-item a');
        for (var i=0;i<ws.length;i++){
            try{
                var ra=ws[i];
                var rd={};
                rd.poster=ra.querySelector('div.poster img').src;
                rd.url=ra.href;
                rd.title=(ra.querySelector('div.ani-detail div.ani-name').textContent+'').trim();
                rd.tip=ra.querySelector('div.poster').getAttribute('data-tip');
                data.recs.push(rd);
            }catch(e){}
        }

        getEpisodes();
        return true;
      }catch(e){
        console.warn("Error anixParse "+e);
      }
      return false;
    }

    $a(watch_url,function(r){
      if (r.ok){
        try{
          var d=$n('div','',0,0,r.responseText);
          var isok=false;
          if (__SD==1){
            isok=waveParse(d);
          }
          else{
            isok=anixParse(d);
          }
          d.innerHTML='';
          d='';
          if (isok){
            return;
          }
        }catch(e){
          console.warn("ERR WatchURL = "+e);
        }
      }
      cbErr('getWatch : '+watch_url);
    },
    {
      'Pragma':'no-cache',
      'Cache-Control':'no-cache'
    });

    return uid;
  },

  vidplayLastKeys:{
    tick:0,
    k:null
  },

  /* Streaming Video */
  vidplayKeys:function(cb){
    if (wave.vidplayLastKeys.tick>$time()){
      cb(JSON.parse(wave.vidplayLastKeys.k));
      return;
    }
    $ap("https://raw.githubusercontent.com/KillerDogeEmpire/vidplay-keys/keys/keys.json?"+$tick(),
    function(r){
      if (r.ok){
        try{
          var d=JSON.parse(r.responseText);
          try{
            wave.vidplayLastKeys.tick=$time()+3600;
            wave.vidplayLastKeys.k=r.responseText;
            cb(d);
          }catch(e){}
          return;
        }catch(e){}
      }
      cb(null);
    },{
      'Pragma':'no-cache',
      'Cache-Control':'no-cache'
    });
  },
  vidplayFuToken:function(host,embedurl,cb){
    $ap("https://"+host+"/futoken?"+$tick(),
      function(r){
        if (r.ok){
          cb(r.responseText);
          return;
        }
        cb(null);
      },
      {
        "X-Org-Prox":"https://"+host+"/",
        "X-Ref-Prox":embedurl,
        'Pragma':'no-cache',
        'Cache-Control':'no-cache'
      });
  },
  vidEncode:function(videoID,k1,k2){
    var encoded=VRF.rc4(k1,videoID);
    encoded=VRF.rc4(k2,encoded);
    return VRF.safeBtoa(encoded);
  },
  vidplayGetMedia:function(u, cb){
    var vidLoc=u.substring(0,u.indexOf("?"));
    var vidSearch=u.substring(u.indexOf("?"));
    var vidHost=vidLoc.split('/')[2];
    var vidId=vidLoc.substring(vidLoc.lastIndexOf("/")+1);
    var vidDataId=null;
    var vidFutoken=null;
    function vidplayMediaCallback(){
      if (!vidDataId) return;
      if (!vidFutoken) return;
      try{
        var su=vidFutoken.substring(vidFutoken.indexOf('function(v)'));
        su="("+su.substring(0,su.indexOf('+location')).replace('jQuery.ajax','')+')})';
        var slug=eval(su+"('"+vidDataId+"')");
        var mediaUrl=
          'https://'+
          vidHost+
          '/'+
          slug+
          vidSearch;
        try{
          console.warn("MEDIA-URL:: "+mediaUrl);
          cb(mediaUrl);
        }catch(e){}
        return;
      }catch(e){}
      cb(null);
    }
    /* Request Keys */
    wave.vidplayKeys(function(k){
      if (k){
        // vidDataId=_JSAPI.vidEncode(vidId,k[0],k[1]);
        vidDataId=wave.vidEncode(vidId,k[0],k[1]);
        if (vidDataId){
          vidplayMediaCallback();
          return;
        }
      }
      cb(null);
    });
    /* Request Futoken */
    wave.vidplayFuToken(vidHost,u,function(r){
      if (r){
        vidFutoken=r;
        vidplayMediaCallback();
        return;
      }
      cb(null);
    });
  },
  mp4uploadGetData:function(u,cb){
    console.warn("MP4UPLOAD VID: "+u);
    $ap(u,function(r){
      if (r.ok){
        try{
          var player_data=null;
          eval("player_data="+r.responseText.split('player.src(',2)[1].split(');')[0]);
          if (player_data){
            console.warn(player_data);
            cb({
              result:{
                sources:[
                  {
                    file:player_data.src,
                    type:player_data.type
                  }
                ]
              }
            });
            return;
          }
        }catch(e){}
      }
      cb(null);
    });
  },
  filemoonGetData:function(u,cb){
    console.warn("FILEMOON VID: "+u);
    $ap(u,function(r){
      if (r.ok){
        try{
          var d=$n('div','',null,null,r.responseText);
          var src=d.querySelector('script:last-child').innerHTML;
          var vdat='';
          eval("vdat="+src.trim().substr(4));
          if (vdat){
            var uri=JSON.parse("["+vdat.split('{sources:[{file:')[1].split("}]")[0]+"]")[0];
            cb({
              result:{
                sources:[
                  {
                    file:uri+"#FILEMOON",
                    type:'hls'
                  }
                ]
              }
            });
          }
          d=null;
          return;
        }catch(e){}
      }
      cb({
        result:{
          sources:[
            {
              file:'ERROR',
              type:''
            }
          ]
        }
      });
    });
  },

  /* Vidstream data scrapper */
  vidstream:{
    keys:null,
    get:function(u,cb){
      var vidLoc=u.substring(0,u.indexOf("?"));
      var vidSearch=u.substring(u.indexOf("?"));
      var vidHost=vidLoc.split('/')[2];
      var vidId=vidLoc.substring(vidLoc.lastIndexOf("/")+1);
      var mediaUrl = VRF.vidstreamMakeUrl(vidHost,vidSearch,vidId);

      console.log("[VIDSTREAM] VideoID: "+vidId+" -> Mediainfo = "+mediaUrl);
      $ap(mediaUrl,function(r){
        if (r.ok){
          try{
            var d=JSON.parse(r.responseText);
            try{
              var de=VRF.vidstreamDecode(d.result);
              d.result=JSON.parse(de);
              cb(d);
              console.log("[VIDSTREAM] Got Mediainfo Data: "+JSON.stringify(d)+"");
              return;
            }catch(e){}
          }catch(e){}
        }
        cb(null);
      },
      {
        "X-Org-Prox":"https://"+vidHost+"/",
        "X-Ref-Prox":u,
        'X-Requested-With':'XMLHttpRequest',
        'Accept':'application/json, text/javascript, */*; q=0.01'
      }
      );
    }
  },

  vidplayGetData:function(u,cb){
    var vidHost=u.split('/')[2];
    if (vidHost.indexOf("mp4upload.com")>-1){
      wave.mp4uploadGetData(u,cb);
      return;
    }
    else if (u.indexOf("#FILEMOON")>0){
      wave.filemoonGetData(u,cb);
      return;
    }
    else{
      wave.vidstream.get(u,cb);
      return;
    }

    /* Old legacy Vidplay - todo: delete + cleanup old vidplay functions */
    wave.vidplayGetMedia(u,function(url){
      if (url){
        $ap(url,function(r){
          if (r.ok){
            try{
              var d=JSON.parse(r.responseText);
              try{
                cb(d);
              }catch(e){}
              return;
            }catch(e){}
          }
          cb(null);
        },
        {
          "X-Org-Prox":"https://"+vidHost+"/",
          "X-Ref-Prox":u,
          'X-Requested-With':'XMLHttpRequest',
          'Accept':'application/json, text/javascript, */*; q=0.01'
        }
        );
        return;
      }
      cb(null);
    });
  }
  
};


/* ajax request */
function $a(uri, cb, hdr, pd){
  var xhttp = new XMLHttpRequest();
  if (pd!==undefined){
    xhttp.args=pd;
  }
  xhttp.onload = function() {
    xhttp.ok=true;
    cb(xhttp);
  };
  xhttp.ontimeout =
  xhttp.onerror = function() {
      xhttp.ok=false;
      cb(xhttp);
  };
  
  /* Post Request */
  var ispost=false;
  var postdata='';
  try{
    if (hdr && hdr!==1){
      if ('post' in hdr){
        ispost=true;
        postdata=hdr.post+'';
        delete hdr.post;
      }
    }
  }catch(e){}

  xhttp.open(ispost?"POST":"GET", uri, true);
  if (hdr){
    if (hdr===1){
      if (__SD2){
        xhttp.setRequestHeader('X-Requested-With','XMLHttpRequest');
      }
    }
    else{
      for (var k in hdr){
        if (k!='post'){
          xhttp.setRequestHeader(k, hdr[k]);
        }
      }
    }
  }
  if (ispost){
    xhttp.send(postdata);
  }
  else{
    xhttp.send();
  }
  return xhttp;
}
function $scroll(el,val,isHoriz,duration){
  if (!_TOUCH){
    el[isHoriz?'scrollLeft':'scrollTop']=val;
    return;
  }
  if (duration && duration<0){
    if (el.__scroll_to){
      clearTimeout(el.__scroll_to);
      el.__scroll_to=null;
    }
    el[isHoriz?'scrollLeft':'scrollTop']=val;
    return;
  }
  var sid=el.__scroll_id=$tick();
  el.__scroll_duration = duration?duration:100;
  el.__scroll_end=$tick()+el.__scroll_duration;
  el.__scroll_duration = parseFloat(el.__scroll_duration);
  el.__scroll_start=(isHoriz?el.scrollLeft:el.scrollTop);
  el.__scroll_target=val;
  if (el.__scroll_to){
    clearTimeout(el.__scroll_to);
    el.__scroll_to=null;
  }
  function move(){
    if (sid!=el.__scroll_id){
      return;
    }
    var delta = (el.__scroll_end-$tick());
    if (delta>0){
      var t = 1.0 - (delta / el.__scroll_duration);
      var v = el.__scroll_start+((el.__scroll_target-el.__scroll_start) * t);
      if (v>0 || v<el[isHoriz?'scrollWidth':'scrollHeight']){
        requestAnimationFrame(function(){
          if (sid!=el.__scroll_id){
            return;
          }
          el[isHoriz?'scrollLeft':'scrollTop']=v;
          el.__scroll_to=setTimeout(move,8);
        });
        return;
      }
    }
    el[isHoriz?'scrollLeft':'scrollTop']=el.__scroll_target;
    return;
  }
  el.__scroll_to=setTimeout(move,2);
}

/* proxy ajax */
function $ap(uri, cb, hdr){
  return $a("/__proxy/"+uri,cb, hdr);
}
/* proxy ajax POST with body (Post-Body header for Android proxy) */
function $apPost(uri, bodyJson, cb){
  var bodyStr=typeof bodyJson==='string'?bodyJson:JSON.stringify(bodyJson);
  if (_ISELECTRON){
    return $a("/__proxy/"+uri,cb,{'Content-Type':'application/json',post:bodyStr});
  }
  var xhttp=new XMLHttpRequest();
  xhttp.onload=function(){ xhttp.ok=true; cb(xhttp); };
  xhttp.ontimeout=xhttp.onerror=function(){ xhttp.ok=false; cb(xhttp); };
  xhttp.open("POST","/__proxy/"+uri,true);
  xhttp.setRequestHeader("Content-Type","application/json");
  xhttp.setRequestHeader("Post-Body",encodeURIComponent(bodyStr));
  xhttp.setRequestHeader("X-Post-Prox","application/json");
  xhttp.send();
  return xhttp;
}

var __IMGCDNL=toInt(_JSAPI.storeGet("imgcdnl","1"));

/* proxy image */
function $imgnl(src, maxw){
  if (__IMGCDNL!=1 || src.indexOf("anilist.co")){
    return src;
  }
  return 'https://wsrv.nl/?url='+encodeURIComponent(src)+'&w='+maxw+'&we';
}

/* proxy image */
function $img(src){
  /* kai image cache */
  // if ((src.indexOf('https://static.animekai.')==0) && (src.indexOf('https://wsrv.nl')==-1)){
  //   return 'https://wsrv.nl/?url='+encodeURIComponent(src)+'&w=256&we';
  // }

  if (src && __IMGCDNL==1){
    if (src.substring(0,1)=='/' && (src.indexOf("/poster/")>-1 || src.indexOf("/thumbnail/")>-1) && false){
      return $imgnl('https://'+__DNS+src, 256);
    }
    else if (
      src.indexOf("//img.flawlessfiles.com/")>-1||
      src.indexOf("//cdn.noitatnemucod.net/")>-1||
      src.indexOf("//img.zorores.com/")>-1){
      return $imgnl(src, 256);
    }
  }

  if (!src || ((src+'')=='undefined')){
    return '/__view/noimg.jpg';
  }
  // if (src.indexOf('/hqdefault.jpg')>0){
  //   src=src.replace('/hqdefault.jpg','/maxresdefault.jpg');
  // }
  return src;
}
function $aimg(cvi){
  if (cvi.large){
    return cvi.large;
  }
  return cvi.medium;
}

function $imgcdn(src){
  try{
    return src.replace('@100.jpg','.jpg');
  }catch(e){}
  return src;
}

function stripHtml(s){
  var d=$n('div','',null,null,s);
  s=d.textContent;
  d.innerHTML='';
  d=null;
  return s;
}

/* new element */
function $n(t,c,a,p,h){
  var l=document.createElement(t);
  if (a!=undefined&&a){
    for (var i in a)
      l.setAttribute(i,a[i]);
  }
  if (c!=undefined&&c) l.className=c;
  if (h!=undefined&&h) l.innerHTML=h;
  if (p!=undefined&&p) p.appendChild(l);
  return l;
}

/* htmlspecial */
function special(str){
  return (str+"").replace(/\&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tspecial(str){
    return '<ttl>'+special(str)+'</ttl>';
}

function utfascii(nq){
  try{
    nq = nq.replace(/\u201C|\u201D|\u201e|\u2033/g, '"');
    nq = nq.replace(/\u2013|\u2014|\u2015/g, '-');
    nq = nq.replace(/\u2017/g, '_');
    nq = nq.replace(/\u201a/g, ',');
    nq = nq.replace(/\u2018|\u2019|\u201b|\u2032/g, "'");
  }catch(e){}
  return nq;
}

/* trim */
function trim(s){
  return (s+"").trim();
}
function ucfirst(string,lw) {
  if (lw){
    string=(string+'').toLowerCase();
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function slugString(Text,rp) {
  if (rp===undefined || rp===null){
    rp=' ';
  }
  return Text.toLowerCase()
    .replace(/[^\w]+/g, " ")
    .replace(/  /g, "  ")
    .replace(/  /g, " ")
    .replace(/  /g, " ")
    .replace(/  /g, " ").trim()
    .replace(/ /g, rp);
}

/* nl2br */
function nlbr(s) {
  return s.replace(/\n/g, "<br>");
}

/* url encode */
function enc(s){
  return encodeURIComponent(s);
}

/* time tick */
function $tick() {
  var dt = new Date();
  return dt.getTime();
}

function $time(){
  return Math.floor($tick()/1000);
}

/* make search query url from object */
function query(r){
  var v=[];
  for (var i in r){
    v.push(i+'='+enc(r[i]));
  }
  return v.join('&');
}

/* Parse Number */
function toInt(x) {
  var x = parseInt(x);
  return isNaN(x)?0:x;
}
function toFloat(x) {
  var x = parseFloat(x);
  return isNaN(x)?0:x;
}

/* absolute y position */
function absY(v){
  var rect = v.getBoundingClientRect();
  return rect.y+window.scrollY;
}

/* doublepad */
function pad2(v) {
  return ("00" + v).slice(-2);
}

/* seconds to timestamp */
function sec2ts(s,nohour){
  var s=Math.floor(s);
  var h=Math.floor(s/3600);
  s-=(h*3600);
  var m=Math.floor(s/60.0);
  s-=m*60;
  var o='';
  if (!nohour||h>0)
    o+=h+":";
  o+=pad2(m)+":"+pad2(s);
  return o;
}

function md2html(text,safe_code){
  return nlbr(special(text))
    .replace(/(?:\*\*)([^*<\n]+)(?:\*\*)/g, safe_code?"<b>$1</b>":"<strong>$1</strong>")
    .replace(/(?:__)([^_<\n]+)(?:__)/g, "<u>$1</u>")
    .replace(/(?:\*)([^*<\n]+)(?:\*)/g, "<i>$1</i>")
    .replace(/(?:_)([^_<\n]+)(?:_)/g, "<i>$1</i>")
    .replace(/(?:`)([^`<\n]+)(?:`)/g, safe_code?"<b>$1</b>":"<t>$1</t>")
}

/* animekai.js end */
