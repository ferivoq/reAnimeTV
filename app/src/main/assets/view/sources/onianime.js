/**************************** ONIANIME ***************************/
const __ONIANIME = {
  ns: 'https://onianime.hu',
  server: 'karks',
  headers:function(){
    return {
      'Accept':'application/json, text/plain, */*',
      'Accept-Language':'en-US,en;q=0.9',
      'Referer':__ONIANIME.ns+'/home',
      'X-Org-Prox':__ONIANIME.ns,
      'X-Ref-Prox':__ONIANIME.ns+'/home'
    };
  },
  api:function(uri){
    return __ONIANIME.ns+uri;
  },
  req:function(uri, cb){
    return $ap(__ONIANIME.api(uri), cb, __ONIANIME.headers());
  },
  parseStatus:function(status){
    status=(status||'').toLowerCase();
    if (status=='fut') return 'ONGOING';
    if (status=='befejezett') return 'COMPLETED';
    return status?status.toUpperCase():'';
  },
  animeId:function(url){
    var clean=(url+'').split('#')[0].split('?')[0].split('/');
    return clean[clean.length-1];
  },
  epNumber:function(url){
    var hash=(url+'').split('#');
    if (hash.length>1 && hash[1]) return toInt(hash[1]);
    return 1;
  },
  toListItem:function(a){
    var d={};
    d.url='/anime/'+a.id;
    d.tip=d.url;
    d.title=a.name||a.eng_name||'';
    d.title_jp=a.eng_name||'';
    d.poster=a.image||'';
    d.synopsis=a.description||'';
    d.type=a.type||'';
    d.status=__ONIANIME.parseStatus(a.status);
    d.epsub=d.ep=a.part_count?(''+a.part_count):'';
    d.eptotal=d.ep;
    if (a.agerestriction && a.agerestriction>=18){
      d.adult=true;
    }
    if (a.release_year){
      d.duration=''+a.release_year;
    }
    return d;
  },
  parseCatalog:function(v){
    try{
      var j=(typeof v=='string')?JSON.parse(v):v;
      var animes=j.animes||[];
      var rd=[];
      for (var i=0;i<animes.length;i++){
        rd.push(__ONIANIME.toListItem(animes[i]));
      }
      return rd;
    }catch(e){
      console.log('OniAnime catalog parse error: '+e);
    }
    return [];
  },
  getTooltip:function(id, cb, url, isview){
    var animeId=__ONIANIME.animeId(id||url);
    __ONIANIME.req('/api/anime/'+enc(animeId)+'/info', function(r){
      if (!r.ok){
        cb(null);
        return;
      }
      try{
        var info=JSON.parse(r.responseText);
        var genres=[];
        var tagNames=info.tags||[];
        for (var i=0;i<tagNames.length;i++){
          genres.push({name:tagNames[i],val:null});
        }
        var o={
          title:info.name||info.eng_name||'',
          title_jp:info.eng_name||'',
          synopsis:info.description||'',
          genres:genres,
          genre:tagNames.join(', '),
          status:__ONIANIME.parseStatus(info.status),
          rating:'',
          quality:null,
          ep:0,
          ttid:'/anime/'+info.id,
          url:'/anime/'+info.id,
          poster:info.image||'',
          banner:info.image||'',
          anilistId:info.anilist||null,
          author:info.studio||info.translator||''
        };
        if (isview){
          o.seasons=[];
          o.related=[];
          o.recs=[];
          o.info={
            type:{val:(info.type||'').toLowerCase(),name:info.type||''},
            rating:o.rating,
            quality:o.quality
          };
          o.numep=o.ep;
          delete o.ep;
          o.stp=0;
          o.streamtype='';
        }
        cb(o);
      }catch(e){
        console.log('OniAnime tooltip parse error: '+e);
        cb(null);
      }
    });
  },
  getView:function(url, cb){
    var uid=++_API.viewid;
    var animeId=__ONIANIME.animeId(url);
    var getEp=__ONIANIME.epNumber(url);
    var out={
      status:true,
      title:'-',
      title_jp:'-',
      synopsis:'',
      stream_url:{hard:'',soft:'',dub:''},
      stream_vurl:'',
      poster:'',
      banner:null,
      url:'/anime/'+animeId,
      skip:[],
      ep:[],
      related:[],
      genres:[],
      seasons:[],
      recs:[],
      info:{type:null,rating:null,quality:null},
      active_ep:null,
      active_ep_index:0,
      ep_streamdata:null
    };
    var pending=2;
    var failed=false;
    function done(){
      if (failed || --pending>0) return;
      if (!out.ep.length){
        cb({status:false}, uid);
        return;
      }
      var active=out.ep[out.active_ep_index]||out.ep[0];
      out.active_ep=active.ep;
      __ONIANIME.req(
        '/api/anime/'+enc(animeId)+'/parts?episode='+enc(active.ep)+'&type=sub&server='+enc(__ONIANIME.server),
        function(r){
          if (!r.ok){
            cb({status:false}, uid);
            return;
          }
          try{
            out.ep_streamdata=JSON.parse(r.responseText);
            out.stream_vurl='';
            cb(out, uid);
          }catch(e){
            cb({status:false}, uid);
          }
        }
      );
    }
    __ONIANIME.getTooltip('/anime/'+animeId,function(tip){
      if (!tip){
        failed=true;
        cb({status:false}, uid);
        return;
      }
      out.title=tip.title;
      out.title_jp=tip.title_jp;
      out.synopsis=tip.synopsis;
      out.poster=tip.poster;
      out.banner=tip.banner;
      out.genres=tip.genres;
      out.info=tip.info||out.info;
      out.anilistId=tip.anilistId;
      done();
    },url,1);
    __ONIANIME.req('/api/anime/'+enc(animeId)+'/episodes', function(r){
      if (!r.ok){
        failed=true;
        cb({status:false}, uid);
        return;
      }
      try{
        var j=JSON.parse(r.responseText);
        var eps=j.episodes||[];
        eps.sort(function(a,b){ return a.ep-b.ep; });
        for (var i=0;i<eps.length;i++){
          var ep=eps[i];
          var s={
            ep:ep.ep,
            url:'/anime/'+animeId+'#'+ep.ep,
            active:(getEp==ep.ep),
            filler:false,
            ep_id:ep.ep,
            title:ep.title||('Episode '+ep.ep),
            synopsis:ep.description||'',
            poster:ep.thumbnail||''
          };
          if (s.active){
            out.active_ep=s.ep;
            out.active_ep_index=i;
          }
          out.ep.push(s);
        }
        if (!out.active_ep && out.ep.length){
          out.ep[0].active=true;
          out.active_ep=out.ep[0].ep;
          out.active_ep_index=0;
        }
        if (j.meta){
          out.title=j.meta.name||out.title;
          out.title_jp=j.meta.eng_name||out.title_jp;
          out.poster=j.meta.image||out.poster;
          out.banner=out.poster;
        }
        done();
      }catch(e){
        failed=true;
        cb({status:false}, uid);
      }
    });
    return uid;
  },
  loadVideo:function(data, cb){
    try{
      var sources=(data.ep_streamdata&&data.ep_streamdata.sources)||[];
      if (!sources.length){
        cb(null);
        return;
      }
      sources.sort(function(a,b){
        return toInt((b.label||'').replace(/\D/g,''))-toInt((a.label||'').replace(/\D/g,''));
      });
      cb({
        sources:sources,
        url:sources[0].src
      });
    }catch(e){
      cb(null);
    }
  }
};
window.onianime=__ONIANIME;
/* onianime.js end */
