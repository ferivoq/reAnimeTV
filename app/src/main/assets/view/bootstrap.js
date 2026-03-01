/* Body */
const body=document.body;
const __DNS=('_JSAPI' in window)?_JSAPI.dns():"anikai.to";
const __SD=('_JSAPI' in window)?_JSAPI.getSd():1;

/* Migrate removed sources (Anix, Aniwatch, Animeflix, KickAss, Gojo, Miruro) */
if (__SD>2){
  _JSAPI.setSd(1);
  _JSAPI.reloadHome();
}

/*
 * SOURCES CONFIG - Add new sources here, update Conf.java & electron/common.js dns.
 */
const __SOURCE_NAME=['AnimeKAI','Hianime'];
const __SOURCE_DOMAINS=[
  ['anikai.to','animekai.to','animekai.bz'],
  ['hianime.to','hianime.sx','hianime.nz','aniwatchtv.to','hianime.bz']
];

/* Source Constants */
const __SDKAI=(__SD==1);
const __SD2=(__SD==2); /* Hianime */
const __SD5=false;const __SD6=false;const __SD7=false;const __SD8=false; /* removed */
/* is touch screen */
var _USE_TOUCH=true;
var _TOUCH=false;
var _ISELECTRON=('isElectron' in _JSAPI);

/* video res change */
var __VIDRESW=0;
var __VIDRESH=0;
window.__VIDRESCB=function(w,h){
  __VIDRESW=w;
  __VIDRESH=h;
  try{
    pb.cfg_update_el("quality");
  }catch(e){}
};
/* sysnav change */
var __SYSHNAV=0;
var __SYSHSTAT=0;
window.__INSETCHANGE=function(s,n){
  __SYSHNAV=n;
  __SYSHSTAT=s;
  document.documentElement.style.setProperty("--sys-nav-height", n+"px");
  document.documentElement.style.setProperty("--sys-stat-height", s+"px");
};
var __VIDLANGS='';
window.__VIDLANGAVAIL=function(s){
  __VIDLANGS=s;
  try{
    pb.cfg_update_el("alang");
  }catch(e){}
};
requestAnimationFrame(function(){
  try{
    __INSETCHANGE(_JSAPI.getSysHeight(false),_JSAPI.getSysHeight(true));
  }catch(e){
    __INSETCHANGE(0,0);
  }
});

var _video_is_dash=false;
function html5video(){
  return _ISELECTRON || (pb.cfg_data.html5player && !_video_is_dash);
}

const __SD_NAME = __SD+". "+(__SOURCE_NAME[__SD-1]);
var __SD_DOMAIN = "";
function SD_CHECK_DOMAIN(sd,cb){
  var sm=sd-1;
  if (sm<0 || sd>2){
    return false;
  }
  var chk_url='/manifest.json';
  var chk_json='name';
  var res=[];
  var num=__SOURCE_DOMAINS[sm].length;
  function do_test(dm,u,c,i,tstart){
    res[i]={
      dn:dm,
      st:0,
      tm:-1
    };
    $ap(u,function(r){
      var rv={
        dn:dm,
        st:1,
        tm:$tick()-tstart
      };
      if (r.ok){
        try{
          var jv=JSON.parse(r.responseText);
          if (c in jv){
            rv.st=2;
          }
        }catch(e){}
      }
      res[i]=rv;
      if (--num<1){
        if (cb){
          cb(JSON.parse(JSON.stringify(res)));
        }
        console.log(["TEST RESULT", res]);
      }
    },{"X-Fixdomain-Prox":"1"}).timeout=4000;
  }
  for (var i=0;i<__SOURCE_DOMAINS[sm].length;i++){
    do_test(__SOURCE_DOMAINS[sm][i],"https://"+__SOURCE_DOMAINS[sm][i]+chk_url,chk_json,i,$tick());
  }
  return true;
}
function SD_CFGNAME(n){
  return _API.user_prefix+'sdomain_'+n;
}
function SD_CHANGE(){
  listOrder.showList(
    "Source Server",
    __SOURCE_NAME,
    __SD-1,
    function(nxe){
      if (nxe==null){
        return;
      }
      SD_SETTINGS(toInt(nxe)+1);
    },
    false,
    '',
    true
  );
}
function SD_SETTINGS(n, cb){
  $('popupcontainer').className='active';
  $('aboutpopup').className='active'; 
  $('popup_qrcode').onclick=null;
  $('popup_qrcode').innerHTML='Benchmarking...';
  $('popup_qrcode').style.display='';
  SD_CHECK_DOMAIN(n,function(r){
    home.settings.close_qrcode();
    $('popup_qrcode').innerHTML='';
    var list_info=[];
    var sid=0;
    var sid_time=60000;
    for (var i=0;i<r.length;i++){
      var w=r[i];
      var tx=special(w.dn)+'<span class="value">'+(w.st==2?("OK - "+w.tm+"ms"):"ERROR")+'</span>';
      if (w.st==2){
        if (w.tm<sid_time){
          sid=i;
          sid_time=w.tm;
        }
      }
      list_info.push(tx);
    }
    var nx=n-1;
    listOrder.showList(
      "Select Source Domain",list_info,
      sid,
      function(chval){
        if (chval!=null){
          var wsel=r[chval];
          function setDomainNow(){
            var sdomain="";
            if (chval>0){
              sdomain=__SOURCE_DOMAINS[nx][chval];
            }
            _JSAPI.storeSet(SD_CFGNAME(n),sdomain);
            if (cb){
              cb(__SOURCE_DOMAINS[nx][chval]);
            }
          }
          if (wsel.st!=2){
            _API.confirm("Domain Warning!!",
            "Target Domain <b>"+wsel.dn+"</b> is failed in benchmark!!!<br>"+
            "Do you want to continue?",
            function(val){
              if (val){
                setDomainNow();
              }
            });
            return;
          }
          setDomainNow();
          return;
        }
        if (cb){
          cb(null);
        }
      },
      true,
      '',
      true
    );
  });
}
function SD_LOAD_DOMAIN(){
    __SD_DOMAIN=_JSAPI.storeGet(SD_CFGNAME(__SD),"");
    _JSAPI.setSdomain(__SD_DOMAIN);
    console.log("SD Domain: "+__SD_DOMAIN);
}

/* getId */
function $(i){
  return document.getElementById(i);
}

/* Stubs for removed providers - never reached */
var gojo={loadVideo:function(d,f){if(f)f(null);},recent_parse:function(){return[]},getFromMAL:function(){}};
var miruro={loadVideo:function(d,f){if(f)f(null);},provider:0,getProvider:function(){return 0},beforeChangeSource:function(cb){if(cb)cb();},providers_name:[''],add_headers:{}};
var kaas={selectServer:function(){},streamGet:function(u,n,cb){if(cb)cb(null);},recentParse:function(){return[]},genres:{},subtitle_origin:{},getTooltip:function(){},getView:function(){},getAnimeId:function(){return''},getFilterOrigin:function(){return{}},getFilterUrl:function(){return''}};
var __AFLIX={origin:null,origin_dev:null,ns:'',req:function(u,cb){if(cb)cb({ok:false});},setCache:function(){},setUrl:function(){return''},getTitle:function(){return''},enc2:function(){return''},getSlug:function(){return''},getAid:function(){return''},getEp:function(){return 1},getUrl:function(){return''},cache:{}};

/* bootstrap.js end */
