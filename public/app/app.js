/* AniVerse Library — ES5 only. No arrow functions, let/const, template literals,
   promises, fetch, classes, optional chaining or service workers. Targets Safari 9 / iOS 9.3.5. */
(function () {
  "use strict";

  /* ---------------- storage ---------------- */
  var KEY = "aniverse.v1";
  var db;

  function defaults() {
    return {
      favorites: {},      /* "type:id" -> {type,id,title,ts} */
      history: [],        /* {type,id,title,sub,href,ts} */
      progress: {},       /* "anime:a1" -> {ep, pos}, etc. */
      playlists: [],      /* {id,name,songs:[]} */
      custom: { anime: [], manga: [], novels: [], songs: [], albums: [], artists: [], bible: {} },
      settings: { fontSize: 18, readerLight: false, lastSong: null, volume: 100 }
    };
  }
  function load() {
    var raw = null, obj = null, d = defaults(), k;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) { try { obj = JSON.parse(raw); } catch (e2) { obj = null; } }
    if (!obj) { return d; }
    for (k in d) { if (d.hasOwnProperty(k) && typeof obj[k] === "undefined") { obj[k] = d[k]; } }
    if (!obj.custom) { obj.custom = d.custom; }
    for (k in d.custom) { if (d.custom.hasOwnProperty(k) && !obj.custom[k]) { obj.custom[k] = d.custom[k]; } }
    for (k in d.settings) { if (d.settings.hasOwnProperty(k) && typeof obj.settings[k] === "undefined") { obj.settings[k] = d.settings[k]; } }
    return obj;
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* quota / private mode */ }
  }
  db = load();

  /* ---------------- data access (demo + admin additions) ---------------- */
  function all(kind) { return AV_DATA[kind].concat(db.custom[kind] || []); }
  function byId(kind, id) {
    var list = all(kind), i;
    for (i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }
  function bibleBook(id) {
    var b = AV_DATA.bibleBooks, i;
    for (i = 0; i < b.length; i++) { if (b[i].id === id) { return b[i]; } }
    return null;
  }
  function bibleVerses(bookId, ch) {
    var k = bookId + "|" + ch;
    if (db.custom.bible && db.custom.bible[k]) { return db.custom.bible[k]; }
    if (AV_DATA.bibleText[k]) { return AV_DATA.bibleText[k]; }
    return null;
  }
  function artistName(id) {
    var a = all("artists"), i;
    for (i = 0; i < a.length; i++) { if (a[i].id === id) { return a[i].name; } }
    return "Unknown artist";
  }
  function albumOf(id) {
    var a = all("albums"), i;
    for (i = 0; i < a.length; i++) { if (a[i].id === id) { return a[i]; } }
    return null;
  }
  function albumTitle(id) { var a = albumOf(id); return a ? a.title : "Unknown album"; }
  function albumCover(id) { var a = albumOf(id); return a && a.cover ? a.cover : "/app/img/cover.svg"; }

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === null || typeof s === "undefined" ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtTime(sec) {
    if (!sec || isNaN(sec) || sec === Infinity) { return "0:00"; }
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function indexOfStr(arr, v) { var i; for (i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } } return -1; }
  function on(el, ev, fn) { if (el) { if (el.addEventListener) { el.addEventListener(ev, fn, false); } else { el.attachEvent("on" + ev, fn); } } }
  function bindClick(id, fn) { on($(id), "click", fn); }
  function bindAll(sel, fn) {
    var nodes = $("view").querySelectorAll(sel), i;
    for (i = 0; i < nodes.length; i++) { on(nodes[i], "click", fn); }
  }
  function uid(p) { return p + "_" + (new Date()).getTime() + "_" + Math.floor(Math.random() * 1000); }

  /* ---------------- favorites / history / progress ---------------- */
  function favKey(t, id) { return t + ":" + id; }
  function isFav(t, id) { return !!db.favorites[favKey(t, id)]; }
  function toggleFav(t, id, title, href) {
    var k = favKey(t, id);
    if (db.favorites[k]) { delete db.favorites[k]; }
    else { db.favorites[k] = { type: t, id: id, title: title, href: href || "", ts: (new Date()).getTime() }; }
    save();
  }
  function addHistory(type, id, title, sub, href) {
    var i;
    for (i = 0; i < db.history.length; i++) {
      if (db.history[i].type === type && db.history[i].id === id) { db.history.splice(i, 1); break; }
    }
    db.history.unshift({ type: type, id: id, title: title, sub: sub, href: href, ts: (new Date()).getTime() });
    if (db.history.length > 100) { db.history.length = 100; }
    save();
  }
  function setProgress(type, id, obj) { db.progress[type + ":" + id] = obj; save(); }
  function getProgress(type, id) { return db.progress[type + ":" + id] || null; }
  function progressList(type) {
    var out = [], k;
    for (k in db.progress) {
      if (db.progress.hasOwnProperty(k) && k.indexOf(type + ":") === 0) {
        out.push({ id: k.substring(type.length + 1), data: db.progress[k] });
      }
    }
    out.sort(function (a, b) { return (b.data.ts || 0) - (a.data.ts || 0); });
    return out;
  }

  /* ---------------- music player ---------------- */
  var audio = $("audio");
  var queue = [], qIndex = -1, shuffle = false, repeat = false, seeking = false;

  function songById(id) { var s = all("songs"), i; for (i = 0; i < s.length; i++) { if (s[i].id === id) { return s[i]; } } return null; }

  function playQueue(ids, start) {
    queue = ids.slice(0);
    qIndex = start || 0;
    playCurrent();
  }
  var wantPlaying = false;

  function setMediaSession(s) {
    if (!window.navigator || !navigator.mediaSession || !window.MediaMetadata) { return; }
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: s.title,
        artist: artistName(s.artistId),
        album: albumTitle(s.albumId),
        artwork: [{ src: albumCover(s.albumId), sizes: "512x512", type: "image/jpeg" }]
      });
      navigator.mediaSession.setActionHandler("play", function () { wantPlaying = true; audio.play(); });
      navigator.mediaSession.setActionHandler("pause", function () { wantPlaying = false; audio.pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { prevTrack(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextTrack(false); });
    } catch (e) { /* ignore */ }
  }

  function playCurrent() {
    var s = songById(queue[qIndex]);
    if (!s) { return; }
    $("player").className = "";
    $("pl-title").innerHTML = esc(s.title);
    $("pl-sub").innerHTML = esc(artistName(s.artistId) + " \u2014 " + albumTitle(s.albumId));
    $("pl-img").src = albumCover(s.albumId);
    audio.src = s.url;
    audio.volume = db.settings.volume / 100;
    wantPlaying = true;
    try { audio.play(); } catch (e) { /* ignore */ }
    $("pl-play").innerHTML = "&#10074;&#10074;";
    setMediaSession(s);
    db.settings.lastSong = s.id;
    save();
    addHistory("song", s.id, s.title, artistName(s.artistId), "#/music");
    setProgress("music", "last", { songId: s.id, ts: (new Date()).getTime() });
  }

  function nextTrack(auto) {
    if (!queue.length) { return; }
    if (repeat && auto) { audio.currentTime = 0; audio.play(); return; }
    if (shuffle) { qIndex = Math.floor(Math.random() * queue.length); }
    else { qIndex = qIndex + 1; }
    if (qIndex >= queue.length) {
      if (auto && !repeat) { qIndex = queue.length - 1; $("pl-play").innerHTML = "&#9654;"; return; }
      qIndex = 0;
    }
    playCurrent();
  }
  function prevTrack() {
    if (!queue.length) { return; }
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    qIndex = qIndex - 1; if (qIndex < 0) { qIndex = queue.length - 1; }
    playCurrent();
  }

  bindClick("pl-play", function () {
    if (!audio.src) { return; }
    if (audio.paused) { wantPlaying = true; audio.play(); $("pl-play").innerHTML = "&#10074;&#10074;"; }
    else { wantPlaying = false; audio.pause(); $("pl-play").innerHTML = "&#9654;"; }
  });
  bindClick("pl-next", function () { nextTrack(false); });
  bindClick("pl-prev", prevTrack);
  bindClick("pl-shuffle", function () { shuffle = !shuffle; this.className = shuffle ? "pbtn sm on" : "pbtn sm"; });
  bindClick("pl-repeat", function () { repeat = !repeat; this.className = repeat ? "pbtn sm on" : "pbtn sm"; });
  bindClick("pl-close", function () { wantPlaying = false; audio.pause(); $("player").className = "hidden"; });

  on(audio, "timeupdate", function () {
    if (seeking || !audio.duration) { return; }
    $("pl-range").value = Math.floor(audio.currentTime / audio.duration * 1000);
    $("pl-cur").innerHTML = fmtTime(audio.currentTime);
    $("pl-dur").innerHTML = fmtTime(audio.duration);
  });
  on(audio, "ended", function () { nextTrack(true); });
  on(audio, "error", function () {
    wantPlaying = false;
    $("pl-play").innerHTML = "&#9654;";
    $("pl-sub").innerHTML = "Could not load this audio file. Check the URL in Admin (MP3 or AAC/M4A).";
  });

  on($("pl-range"), "mousedown", function () { seeking = true; });
  on($("pl-range"), "touchstart", function () { seeking = true; });
  function doSeek() {
    if (audio.duration) { audio.currentTime = ($("pl-range").value / 1000) * audio.duration; }
    seeking = false;
  }
  on($("pl-range"), "change", doSeek);
  on($("pl-range"), "mouseup", doSeek);
  on($("pl-range"), "touchend", doSeek);
  on($("pl-vol"), "change", function () {
    db.settings.volume = parseInt(this.value, 10); save();
    audio.volume = db.settings.volume / 100;
  });
  $("pl-vol").value = db.settings.volume;

  /* keep playing while the tab is in the background / another app is in front */
  function resumeIfWanted() {
    if (wantPlaying && audio.src && audio.paused) {
      try { audio.play(); } catch (e) { /* ignore */ }
    }
  }
  on(audio, "pause", function () {
    if (!wantPlaying) { $("pl-play").innerHTML = "&#9654;"; return; }
    // browser throttled us, not the user: try to pick playback back up
    setTimeout(resumeIfWanted, 300);
  });
  on(audio, "play", function () { $("pl-play").innerHTML = "&#10074;&#10074;"; });
  on(document, "visibilitychange", resumeIfWanted);
  on(window, "focus", resumeIfWanted);
  on(window, "pageshow", resumeIfWanted);


  /* ---------------- rendering pieces ---------------- */
  function card(href, cover, title, sub, wide) {
    return '<div class="card' + (wide ? " wide" : "") + '"><a href="' + href + '">' +
      '<div class="thumb"><img src="' + esc(cover || "/app/img/cover.svg") + '" alt="' + esc(title) + ' cover"></div>' +
      '<div class="cbody"><div class="ctitle">' + esc(title) + '</div>' +
      '<div class="csub">' + esc(sub || "") + '</div></div></a></div>';
  }
  function favBtn(type, id, title, href) {
    return '<button type="button" class="btn sm favbtn' + (isFav(type, id) ? " on" : "") +
      '" data-t="' + esc(type) + '" data-i="' + esc(id) + '" data-title="' + esc(title) +
      '" data-href="' + esc(href) + '">' + (isFav(type, id) ? "\u2605 Favorited" : "\u2606 Favorite") + "</button>";
  }
  function wireFavs() {
    bindAll(".favbtn", function () {
      var b = this;
      toggleFav(b.getAttribute("data-t"), b.getAttribute("data-i"), b.getAttribute("data-title"), b.getAttribute("data-href"));
      var isOn = isFav(b.getAttribute("data-t"), b.getAttribute("data-i"));
      b.className = "btn sm favbtn" + (isOn ? " on" : "");
      b.innerHTML = isOn ? "\u2605 Favorited" : "\u2606 Favorite";
    });
  }
  function section(title, inner, extra) {
    return '<div class="section"><div class="section-head"><h2>' + esc(title) + "</h2>" +
      (extra || "") + '</div><div class="row">' + inner + "</div></div>";
  }
  function pageWrap(title, sub, body) {
    return "<h1>" + esc(title) + "</h1>" + (sub ? '<p class="muted">' + esc(sub) + "</p>" : "") + body;
  }

  /* ---------------- views ---------------- */
  var V = {};

  V.home = function () {
    var h = "", i, p, a, ep, list, s, pct;

    /* Continue Watching */
    list = progressList("anime"); h = "";
    for (i = 0; i < list.length && i < 6; i++) {
      a = byId("anime", list[i].id); p = list[i].data;
      if (!a) { continue; }
      ep = p.ep || 1;
      pct = p.pct || 0;
      h += '<div class="card"><a href="#/watch/' + a.id + "/" + ep + '">' +
        '<div class="thumb"><img src="' + esc(a.cover) + '" alt="' + esc(a.title) + ' cover"></div>' +
        '<div class="cbody"><div class="ctitle">' + esc(a.title) + "</div>" +
        '<div class="csub">Episode ' + ep + "</div>" +
        '<div class="prog"><span style="width:' + Math.round(pct) + '%"></span></div>' +
        '<span class="btn sm primary">Continue</span></div></a></div>';
    }
    var out = section("Continue Watching", h || '<p class="muted">Nothing yet. Open an anime episode to start.</p>');

    /* Continue Reading: manga + bible + novels */
    h = "";
    list = progressList("manga");
    for (i = 0; i < list.length && i < 4; i++) {
      a = byId("manga", list[i].id); p = list[i].data;
      if (a) { h += card("#/manga/" + a.id + "/" + (p.ch || 1) + "/" + (p.page || 1), a.cover, a.title, "Manga \u2014 Ch " + (p.ch || 1) + ", p " + (p.page || 1)); }
    }
    list = progressList("novel");
    for (i = 0; i < list.length && i < 4; i++) {
      a = byId("novels", list[i].id); p = list[i].data;
      if (a) { h += card("#/novel/" + a.id + "/" + (p.ch || 1), a.cover, a.title, "Novel \u2014 Chapter " + (p.ch || 1)); }
    }
    list = progressList("bible");
    for (i = 0; i < list.length && i < 4; i++) {
      a = bibleBook(list[i].id); p = list[i].data;
      if (a) { h += card("#/bible/" + a.id + "/" + (p.ch || 1), "/app/img/cover.svg", a.name, "Bible \u2014 Chapter " + (p.ch || 1)); }
    }
    out += section("Continue Reading", h || '<p class="muted">Nothing yet. Open a manga, novel or Bible chapter.</p>');

    /* Continue Listening */
    h = "";
    p = getProgress("music", "last");
    if (p) {
      s = songById(p.songId);
      if (s) {
        h += '<div class="card"><a href="#" class="playsong" data-i="' + s.id + '">' +
          '<div class="thumb"><img src="' + esc(albumCover(s.albumId)) + '" alt="Album artwork"></div>' +
          '<div class="cbody"><div class="ctitle">' + esc(s.title) + "</div>" +
          '<div class="csub">' + esc(artistName(s.artistId)) + '</div>' +
          '<span class="btn sm primary">Play</span></div></a></div>';
      }
    }
    out += section("Continue Listening", h || '<p class="muted">No recently played track yet.</p>');

    /* Recently Added */
    h = "";
    list = all("anime"); for (i = list.length - 1; i >= 0 && i > list.length - 4; i--) { h += card("#/anime/" + list[i].id, list[i].cover, list[i].title, "Anime"); }
    list = all("manga"); for (i = list.length - 1; i >= 0 && i > list.length - 3; i--) { h += card("#/manga/" + list[i].id, list[i].cover, list[i].title, "Manga"); }
    list = all("novels"); for (i = list.length - 1; i >= 0 && i > list.length - 3; i--) { h += card("#/novel/" + list[i].id, list[i].cover, list[i].title, "Novel"); }
    list = all("songs"); for (i = list.length - 1; i >= 0 && i > list.length - 3; i--) {
      h += '<div class="card"><a href="#" class="playsong" data-i="' + list[i].id + '">' +
        '<div class="thumb"><img src="' + esc(albumCover(list[i].albumId)) + '" alt="Album artwork"></div>' +
        '<div class="cbody"><div class="ctitle">' + esc(list[i].title) + '</div><div class="csub">Song</div></div></a></div>';
    }
    out += section("Recently Added", h);

    /* Favorites */
    h = ""; var k, f, n = 0;
    for (k in db.favorites) {
      if (db.favorites.hasOwnProperty(k) && n < 8) {
        f = db.favorites[k]; n++;
        h += card(f.href || "#/favorites", "/app/img/cover.svg", f.title, f.type);
      }
    }
    out += section("Favorites", h || '<p class="muted">No favorites yet.</p>', "");

    render(pageWrap("Home", "Anime \u2022 Manga \u2022 Bible \u2022 Novels \u2022 Music", out));
    wirePlaySong();
  };

  function wirePlaySong() {
    bindAll(".playsong", function (e) {
      if (e && e.preventDefault) { e.preventDefault(); }
      playQueue([this.getAttribute("data-i")], 0);
      return false;
    });
  }

  var animeFilter = "All";
  V.anime = function () {
    var list = all("anime"), h = "", i, g, filters = "";
    var gl = ["All"].concat(AV_DATA.genres);
    for (i = 0; i < gl.length; i++) {
      filters += '<button type="button" class="btn sm gfilter' + (gl[i] === animeFilter ? " on" : "") +
        '" data-g="' + gl[i] + '">' + gl[i] + "</button>";
    }
    for (i = 0; i < list.length; i++) {
      g = (list[i].genres || []).join(", ");
      if (animeFilter !== "All" && indexOfStr(list[i].genres || [], animeFilter) === -1) { continue; }
      h += card("#/anime/" + list[i].id, list[i].cover, list[i].title,
        list[i].year + " \u2022 " + list[i].status + " \u2022 " + g);
    }
    render(pageWrap("Anime", "Browse the anime catalog",
      '<div class="bar">' + filters + "</div>" + '<div class="row">' + (h || '<p class="muted">No titles in this genre.</p>') + "</div>"));
    bindAll(".gfilter", function () { animeFilter = this.getAttribute("data-g"); V.anime(); });
  };

  V.animeDetail = function (id) {
    var a = byId("anime", id), h = "", i, e;
    if (!a) { return notFound(); }
    for (i = 0; i < a.episodes.length; i++) {
      e = a.episodes[i];
      h += '<li><a href="#/watch/' + a.id + "/" + e.number + '">Episode ' + e.number +
        ' <span class="tiny">' + esc(e.title) + " \u2022 " + esc(e.duration || "") + "</span></a></li>";
    }
    render(pageWrap(a.title, a.year + " \u2022 " + a.status + " \u2022 " + (a.genres || []).join(", "),
      '<div class="panel"><p>' + esc(a.description) + "</p>" +
      favBtn("anime", a.id, a.title, "#/anime/" + a.id) +
      '<a class="btn primary" href="#/watch/' + a.id + '/1">Play Episode 1</a></div>' +
      '<div class="panel"><h3>Episodes</h3><ul class="list">' + h + "</ul></div>"));
    wireFavs();
    addHistory("anime", a.id, a.title, "Viewed details", "#/anime/" + a.id);
  };

  function isDirectVideo(u) {
    u = String(u || "").split("?")[0].toLowerCase();
    return /\.(mp4|m4v|mov|webm|ogv|m3u8)$/.test(u);
  }

  function embedUrl(u) {
    u = String(u || "");
    var m;
    m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (m) { return "https://www.youtube.com/embed/" + m[1]; }
    m = u.match(/vimeo\.com\/(\d+)/);
    if (m) { return "https://player.vimeo.com/video/" + m[1]; }
    m = u.match(/dailymotion\.com\/video\/([A-Za-z0-9]+)/);
    if (m) { return "https://www.dailymotion.com/embed/video/" + m[1]; }
    return u;
  }

  V.watch = function (id, epNum) {
    var a = byId("anime", id), i, ep = null, nav = "", player;
    if (!a) { return notFound(); }
    epNum = parseInt(epNum, 10) || 1;
    for (i = 0; i < a.episodes.length; i++) { if (a.episodes[i].number === epNum) { ep = a.episodes[i]; } }
    if (!ep) { ep = a.episodes[0]; epNum = ep.number; }
    if (epNum > 1) { nav += '<a class="btn" href="#/watch/' + a.id + "/" + (epNum - 1) + '">&#9664; Previous</a>'; }
    if (epNum < a.episodes.length) { nav += '<a class="btn" href="#/watch/' + a.id + "/" + (epNum + 1) + '">Next &#9654;</a>'; }

    var direct = isDirectVideo(ep.video);
    if (direct) {
      player =
        '<video id="vid" controls preload="metadata" playsinline webkit-playsinline poster="' + esc(a.cover) + '">' +
        '<source src="' + esc(ep.video) + '" type="video/mp4">' +
        "Your browser cannot play this video." +
        "</video>" +
        '<p id="vidmsg" class="muted tiny">MP4 / H.264 / AAC recommended for iOS 9 playback.</p>';
    } else {
      player =
        '<div class="embedbox"><iframe id="vidframe" src="' + esc(embedUrl(ep.video)) +
        '" frameborder="0" scrolling="no" allowfullscreen webkitallowfullscreen mozallowfullscreen allow="autoplay; fullscreen; encrypted-media"></iframe></div>' +
        '<p id="vidmsg" class="muted tiny">Playing inside AniVerse. If a source blocks embedding, ' +
        '<a href="' + esc(ep.video) + '" target="_blank" rel="noopener">open it in a new tab</a>.</p>';
    }

    render(pageWrap(a.title, "Episode " + epNum + " \u2014 " + ep.title,
      '<div class="panel">' + player +
      '<div class="bar">' + nav +
      '<a class="btn" href="#/anime/' + a.id + '">All episodes</a>' +
      favBtn("anime", a.id, a.title, "#/anime/" + a.id) + "</div></div>"));
    wireFavs();

    if (direct) {
      var v = $("vid");
      on(v, "error", function () { $("vidmsg").innerHTML = "This video could not be loaded. Check the video URL in Admin, and make sure it is MP4 (H.264 + AAC)."; });
      on(v, "loadedmetadata", function () {
        var p = getProgress("anime", a.id);
        if (p && p.ep === epNum && p.pos > 5 && p.pos < v.duration - 10) {
          try { v.currentTime = p.pos; } catch (e2) { /* ignore */ }
        }
      });
      on(v, "timeupdate", function () {
        if (!v.duration) { return; }
        var now = (new Date()).getTime();
        if (!v._last || now - v._last > 5000) {
          v._last = now;
          setProgress("anime", a.id, { ep: epNum, pos: v.currentTime, pct: v.currentTime / v.duration * 100, ts: now });
        }
      });
    } else {
      setProgress("anime", a.id, { ep: epNum, pos: 0, pct: 0, ts: (new Date()).getTime() });
    }
    addHistory("anime", a.id, a.title, "Episode " + epNum, "#/watch/" + a.id + "/" + epNum);
  };


  V.manga = function () {
    var list = all("manga"), h = "", i;
    for (i = 0; i < list.length; i++) {
      h += card("#/manga/" + list[i].id, list[i].cover, list[i].title,
        list[i].author + " \u2022 " + list[i].status);
    }
    render(pageWrap("Manga", "Browse the manga catalog", '<div class="row">' + h + "</div>"));
  };

  V.mangaDetail = function (id) {
    var m = byId("manga", id), h = "", i, c;
    if (!m) { return notFound(); }
    for (i = 0; i < m.chapters.length; i++) {
      c = m.chapters[i];
      h += '<li><a href="#/manga/' + m.id + "/" + c.number + '/1">' + esc(c.title) +
        ' <span class="tiny">' + c.pages.length + " pages</span></a></li>";
    }
    render(pageWrap(m.title, m.author + " \u2022 art by " + m.artist + " \u2022 " + (m.genres || []).join(", "),
      '<div class="panel"><p>' + esc(m.description) + "</p>" +
      favBtn("manga", m.id, m.title, "#/manga/" + m.id) +
      '<a class="btn primary" href="#/manga/' + m.id + '/1/1">Read Chapter 1</a></div>' +
      '<div class="panel"><h3>Chapters</h3><ul class="list">' + h + "</ul></div>"));
    wireFavs();
  };

  var mangaZoom = 100, mangaVertical = false;
  V.mangaRead = function (id, ch, page) {
    var m = byId("manga", id), chapter = null, i, h = "";
    if (!m) { return notFound(); }
    ch = parseInt(ch, 10) || 1; page = parseInt(page, 10) || 1;
    for (i = 0; i < m.chapters.length; i++) { if (m.chapters[i].number === ch) { chapter = m.chapters[i]; } }
    if (!chapter) { return notFound(); }
    if (page < 1) { page = 1; }
    if (page > chapter.pages.length) { page = chapter.pages.length; }

    if (mangaVertical) {
      for (i = 0; i < chapter.pages.length; i++) {
        h += '<img class="page-img" style="width:' + mangaZoom + '%" src="' + esc(chapter.pages[i]) + '" alt="Page ' + (i + 1) + '">';
      }
    } else {
      h = '<img class="page-img" style="width:' + mangaZoom + '%" src="' + esc(chapter.pages[page - 1]) + '" alt="Page ' + page + '">';
    }

    var nav = "";
    nav += '<button type="button" class="btn" id="mprev">&#9664; Previous page</button>';
    nav += '<button type="button" class="btn" id="mnext">Next page &#9654;</button>';
    nav += '<button type="button" class="btn sm" id="mzin">Zoom +</button>';
    nav += '<button type="button" class="btn sm" id="mzout">Zoom -</button>';
    nav += '<button type="button" class="btn sm" id="mfit">Fit screen</button>';
    nav += '<button type="button" class="btn sm" id="mvert">' + (mangaVertical ? "Horizontal mode" : "Vertical mode") + "</button>";
    nav += '<button type="button" class="btn sm" id="mfull">Fullscreen</button>';

    render(pageWrap(m.title, chapter.title + " \u2014 page " + page + " of " + chapter.pages.length,
      '<div class="bar">' + nav + '<a class="btn sm" href="#/manga/' + m.id + '">Chapters</a></div>' +
      '<div class="panel" id="mreader">' + h + "</div>" +
      '<div class="bar">' + nav + "</div>"));

    function go(p) { location.hash = "#/manga/" + m.id + "/" + ch + "/" + p; }
    bindAll("#mprev", function () {
      if (page > 1) { go(page - 1); }
      else if (ch > 1) { location.hash = "#/manga/" + m.id + "/" + (ch - 1) + "/1"; }
    });
    bindAll("#mnext", function () {
      if (page < chapter.pages.length) { go(page + 1); }
      else if (ch < m.chapters.length) { location.hash = "#/manga/" + m.id + "/" + (ch + 1) + "/1"; }
    });
    bindAll("#mzin", function () { mangaZoom = Math.min(300, mangaZoom + 25); V.mangaRead(id, ch, page); });
    bindAll("#mzout", function () { mangaZoom = Math.max(40, mangaZoom - 25); V.mangaRead(id, ch, page); });
    bindAll("#mfit", function () { mangaZoom = 100; V.mangaRead(id, ch, page); });
    bindAll("#mvert", function () { mangaVertical = !mangaVertical; V.mangaRead(id, ch, page); });
    bindAll("#mfull", function () {
      var el = $("mreader");
      if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      else if (el.requestFullscreen) { el.requestFullscreen(); }
      else { alert("Fullscreen is not supported by this browser. Use zoom and fit-screen instead."); }
    });

    setProgress("manga", m.id, { ch: ch, page: page, ts: (new Date()).getTime() });
    addHistory("manga", m.id, m.title, chapter.title + " p" + page, "#/manga/" + m.id + "/" + ch + "/" + page);
  };

  V.bible = function () {
    var b = AV_DATA.bibleBooks, i, ot = "", nt = "";
    for (i = 0; i < b.length; i++) {
      var row = '<li><a href="#/bible/' + b[i].id + '/1">' + esc(b[i].name) +
        ' <span class="tiny">' + b[i].chapters + " chapters</span></a></li>";
      if (b[i].testament === "old") { ot += row; } else { nt += row; }
    }
    render(pageWrap("Bible", "World English Bible (public domain) sample text \u2014 add more chapters in Admin",
      '<div class="panel"><h3>Old Testament</h3><ul class="list">' + ot + "</ul></div>" +
      '<div class="panel"><h3>New Testament</h3><ul class="list">' + nt + "</ul></div>"));
  };

  V.bibleChapters = function (bookId) {
    var b = bibleBook(bookId), h = "", i;
    if (!b) { return notFound(); }
    for (i = 1; i <= b.chapters; i++) {
      h += '<a class="btn sm" href="#/bible/' + b.id + "/" + i + '">' + i + "</a>";
    }
    render(pageWrap(b.name, b.chapters + " chapters", '<div class="panel">' + h + "</div>"));
  };

  V.bibleRead = function (bookId, ch) {
    var b = bibleBook(bookId), verses, h = "", i;
    if (!b) { return notFound(); }
    ch = parseInt(ch, 10) || 1;
    if (ch < 1) { ch = 1; }
    if (ch > b.chapters) { ch = b.chapters; }
    verses = bibleVerses(b.id, ch);

    if (verses) {
      for (i = 0; i < verses.length; i++) {
        h += '<p class="verse"><b>' + (i + 1) + "</b>" + esc(verses[i]) +
          ' <button type="button" class="btn sm favbtn' + (isFav("verse", b.id + "." + ch + "." + (i + 1)) ? " on" : "") +
          '" data-t="verse" data-i="' + b.id + "." + ch + "." + (i + 1) +
          '" data-title="' + esc(b.name + " " + ch + ":" + (i + 1)) +
          '" data-href="#/bible/' + b.id + "/" + ch + '">' +
          (isFav("verse", b.id + "." + ch + "." + (i + 1)) ? "\u2605" : "\u2606") + "</button></p>";
      }
    } else {
      h = '<p class="muted">This chapter has no text loaded yet. Open <a href="#/admin">Admin &rarr; Bible</a> to paste verses for ' +
        esc(b.name) + " " + ch + " (one verse per line). Sample text is included for Genesis 1, Psalms 23 and John 1.</p>";
    }

    var chapterOptions = "", j;
    for (j = 1; j <= b.chapters; j++) {
      chapterOptions += '<option value="' + j + '"' + (j === ch ? " selected" : "") + ">Chapter " + j + "</option>";
    }
    var bookOptions = "", bb = AV_DATA.bibleBooks;
    for (j = 0; j < bb.length; j++) {
      bookOptions += '<option value="' + bb[j].id + '"' + (bb[j].id === b.id ? " selected" : "") + ">" + esc(bb[j].name) + "</option>";
    }

    render(pageWrap(b.name + " " + ch, "",
      '<div class="bar">' +
      '<select id="bsel">' + bookOptions + "</select>" +
      '<select id="csel">' + chapterOptions + "</select>" +
      '<button type="button" class="btn" id="bprev">&#9664; Previous chapter</button>' +
      '<button type="button" class="btn" id="bnext">Next chapter &#9654;</button>' +
      '<button type="button" class="btn sm" id="fplus">A+</button>' +
      '<button type="button" class="btn sm" id="fminus">A-</button>' +
      '<button type="button" class="btn sm" id="blight">Light / dark</button>' +
      favBtn("bible", b.id, b.name, "#/bible/" + b.id + "/" + ch) +
      "</div>" +
      '<div class="panel"><div class="reader' + (db.settings.readerLight ? " light" : "") +
      '" id="rd" style="font-size:' + db.settings.fontSize + 'px">' + h + "</div></div>"));

    wireFavs();
    bindAll("#bprev", function () { location.hash = "#/bible/" + b.id + "/" + (ch > 1 ? ch - 1 : 1); });
    bindAll("#bnext", function () { location.hash = "#/bible/" + b.id + "/" + (ch < b.chapters ? ch + 1 : ch); });
    bindAll("#fplus", function () { db.settings.fontSize = Math.min(34, db.settings.fontSize + 2); save(); $("rd").style.fontSize = db.settings.fontSize + "px"; });
    bindAll("#fminus", function () { db.settings.fontSize = Math.max(13, db.settings.fontSize - 2); save(); $("rd").style.fontSize = db.settings.fontSize + "px"; });
    bindAll("#blight", function () {
      db.settings.readerLight = !db.settings.readerLight; save();
      $("rd").className = "reader" + (db.settings.readerLight ? " light" : "");
    });
    on($("bsel"), "change", function () { location.hash = "#/bible/" + this.value + "/1"; });
    on($("csel"), "change", function () { location.hash = "#/bible/" + b.id + "/" + this.value; });

    setProgress("bible", b.id, { ch: ch, ts: (new Date()).getTime() });
    addHistory("bible", b.id + "-" + ch, b.name + " " + ch, "Bible", "#/bible/" + b.id + "/" + ch);
  };

  V.novels = function () {
    var list = all("novels"), h = "", i;
    for (i = 0; i < list.length; i++) {
      h += card("#/novel/" + list[i].id, list[i].cover, list[i].title, list[i].author);
    }
    render(pageWrap("Novels", "Books and long-form reading", '<div class="row">' + h + "</div>"));
  };

  V.novelDetail = function (id) {
    var n = byId("novels", id), h = "", i;
    if (!n) { return notFound(); }
    for (i = 0; i < n.chapters.length; i++) {
      h += '<li><a href="#/novel/' + n.id + "/" + n.chapters[i].number + '">' +
        n.chapters[i].number + ". " + esc(n.chapters[i].title) + "</a></li>";
    }
    render(pageWrap(n.title, n.author + " \u2022 " + (n.genres || []).join(", "),
      '<div class="panel"><p>' + esc(n.description) + "</p>" +
      favBtn("novel", n.id, n.title, "#/novel/" + n.id) +
      '<a class="btn primary" href="#/novel/' + n.id + '/1">Start reading</a></div>' +
      '<div class="panel"><h3>Chapters</h3><ul class="list">' + h + "</ul></div>"));
    wireFavs();
  };

  V.novelRead = function (id, ch) {
    var n = byId("novels", id), i, c = null, paras, h = "";
    if (!n) { return notFound(); }
    ch = parseInt(ch, 10) || 1;
    for (i = 0; i < n.chapters.length; i++) { if (n.chapters[i].number === ch) { c = n.chapters[i]; } }
    if (!c) { return notFound(); }
    paras = String(c.text).split("\n\n");
    for (i = 0; i < paras.length; i++) { h += "<p>" + esc(paras[i]) + "</p>"; }
    var pct = Math.round(ch / n.chapters.length * 100);

    render(pageWrap(n.title, "Chapter " + ch + " \u2014 " + c.title,
      '<div class="bar">' +
      '<button type="button" class="btn" id="nprev">&#9664; Previous</button>' +
      '<button type="button" class="btn" id="nnext">Next &#9654;</button>' +
      '<button type="button" class="btn sm" id="fplus">A+</button>' +
      '<button type="button" class="btn sm" id="fminus">A-</button>' +
      '<button type="button" class="btn sm" id="nlight">Light / dark</button>' +
      favBtn("novel", n.id, n.title, "#/novel/" + n.id + "/" + ch) +
      "</div>" +
      '<div class="prog"><span style="width:' + pct + '%"></span></div>' +
      '<p class="tiny">Reading progress: ' + pct + "%</p>" +
      '<div class="panel"><div class="reader' + (db.settings.readerLight ? " light" : "") +
      '" id="rd" style="font-size:' + db.settings.fontSize + 'px">' + h + "</div></div>"));

    wireFavs();
    bindAll("#nprev", function () { if (ch > 1) { location.hash = "#/novel/" + n.id + "/" + (ch - 1); } });
    bindAll("#nnext", function () { if (ch < n.chapters.length) { location.hash = "#/novel/" + n.id + "/" + (ch + 1); } });
    bindAll("#fplus", function () { db.settings.fontSize = Math.min(34, db.settings.fontSize + 2); save(); $("rd").style.fontSize = db.settings.fontSize + "px"; });
    bindAll("#fminus", function () { db.settings.fontSize = Math.max(13, db.settings.fontSize - 2); save(); $("rd").style.fontSize = db.settings.fontSize + "px"; });
    bindAll("#nlight", function () {
      db.settings.readerLight = !db.settings.readerLight; save();
      $("rd").className = "reader" + (db.settings.readerLight ? " light" : "");
    });

    setProgress("novel", n.id, { ch: ch, ts: (new Date()).getTime() });
    addHistory("novel", n.id, n.title, "Chapter " + ch, "#/novel/" + n.id + "/" + ch);
  };

  /* ---- music ---- */
  var musicTab = "songs";
  V.music = function (tab) {
    if (tab) { musicTab = tab; }
    var tabs = ["songs", "albums", "artists", "genres", "playlists"], i, h = "", bar = "";
    for (i = 0; i < tabs.length; i++) {
      bar += '<a class="btn sm' + (tabs[i] === musicTab ? " on" : "") + '" href="#/music/' + tabs[i] + '">' +
        tabs[i].charAt(0).toUpperCase() + tabs[i].substring(1) + "</a>";
    }

    var songs = all("songs"), j;
    if (musicTab === "songs") {
      h += '<div class="panel"><button type="button" class="btn primary" id="playall">Play all</button>' +
        '<ul class="list">' + songRows(songs) + "</ul></div>";
    } else if (musicTab === "albums") {
      var albums = all("albums"), row = "";
      for (i = 0; i < albums.length; i++) {
        row += card("#/album/" + albums[i].id, albums[i].cover, albums[i].title, artistName(albums[i].artistId));
      }
      h += '<div class="row">' + row + "</div>";
    } else if (musicTab === "artists") {
      var ars = all("artists"), lis = "";
      for (i = 0; i < ars.length; i++) {
        var count = 0;
        for (j = 0; j < songs.length; j++) { if (songs[j].artistId === ars[i].id) { count++; } }
        lis += '<li><a href="#/artist/' + ars[i].id + '">' + esc(ars[i].name) + ' <span class="tiny">' + count + " songs</span></a></li>";
      }
      h += '<div class="panel"><ul class="list">' + lis + "</ul></div>";
    } else if (musicTab === "genres") {
      var gmap = {}, gl = "";
      for (i = 0; i < songs.length; i++) { gmap[songs[i].genre || "Other"] = true; }
      for (var g in gmap) {
        if (gmap.hasOwnProperty(g)) {
          var sub = [];
          for (i = 0; i < songs.length; i++) { if ((songs[i].genre || "Other") === g) { sub.push(songs[i]); } }
          gl += '<div class="panel"><h3>' + esc(g) + '</h3><ul class="list">' + songRows(sub) + "</ul></div>";
        }
      }
      h += gl;
    } else {
      h += '<div class="panel"><h3>Create playlist</h3>' +
        '<input type="text" id="plname" placeholder="Playlist name"> ' +
        '<button type="button" class="btn primary" id="plcreate">Create</button></div>';
      for (i = 0; i < db.playlists.length; i++) {
        var pl = db.playlists[i], plSongs = [], k;
        for (k = 0; k < pl.songs.length; k++) { var so = songById(pl.songs[k]); if (so) { plSongs.push(so); } }
        h += '<div class="panel"><h3>' + esc(pl.name) + ' <span class="tiny">' + plSongs.length + " tracks</span></h3>" +
          '<button type="button" class="btn sm plplay" data-i="' + pl.id + '">Play</button>' +
          '<button type="button" class="btn sm plshuffle" data-i="' + pl.id + '">Shuffle</button>' +
          '<button type="button" class="btn sm plrename" data-i="' + pl.id + '">Rename</button>' +
          '<button type="button" class="btn sm pldelete" data-i="' + pl.id + '">Delete</button>' +
          '<ul class="list">' + songRows(plSongs, pl.id) + "</ul>" +
          '<label>Add a song</label>' + songSelect("pladd_" + pl.id) +
          '<button type="button" class="btn sm pladd" data-i="' + pl.id + '">Add to playlist</button></div>';
      }
    }

    render(pageWrap("Music", "Your own library \u2014 MP3 / AAC via the native HTML5 audio element",
      '<div class="bar">' + bar + "</div>" + h));
    wireSongRows();
    wireMusicExtras();
  };

  function songSelect(id) {
    var songs = all("songs"), o = "", i;
    for (i = 0; i < songs.length; i++) {
      o += '<option value="' + songs[i].id + '">' + esc(songs[i].title + " \u2014 " + artistName(songs[i].artistId)) + "</option>";
    }
    return '<select id="' + id + '">' + o + "</select>";
  }

  function songRows(list, playlistId) {
    var h = "", i, ids = [];
    for (i = 0; i < list.length; i++) { ids.push(list[i].id); }
    for (i = 0; i < list.length; i++) {
      h += '<li><div class="li"><a href="#" class="qplay" data-q="' + ids.join(",") + '" data-n="' + i + '">' +
        "\u25B6 " + esc(list[i].title) + '</a> <span class="tiny">' +
        esc(artistName(list[i].artistId) + " \u2022 " + albumTitle(list[i].albumId) + " \u2022 " + (list[i].duration || "")) + "</span> " +
        favBtn("song", list[i].id, list[i].title, "#/music") +
        (playlistId ? ' <button type="button" class="btn sm plremove" data-p="' + playlistId + '" data-i="' + list[i].id + '">Remove</button>' : "") +
        "</div></li>";
    }
    return h || '<li><div class="li muted">No songs.</div></li>';
  }

  function wireSongRows() {
    bindAll(".qplay", function (e) {
      if (e && e.preventDefault) { e.preventDefault(); }
      playQueue(this.getAttribute("data-q").split(","), parseInt(this.getAttribute("data-n"), 10));
      return false;
    });
    wireFavs();
  }

  function findPlaylist(id) { var i; for (i = 0; i < db.playlists.length; i++) { if (db.playlists[i].id === id) { return db.playlists[i]; } } return null; }

  function wireMusicExtras() {
    bindAll("#playall", function () {
      var songs = all("songs"), ids = [], i;
      for (i = 0; i < songs.length; i++) { ids.push(songs[i].id); }
      playQueue(ids, 0);
    });
    bindAll("#plcreate", function () {
      var name = $("plname").value;
      if (!name) { return; }
      db.playlists.push({ id: uid("pl"), name: name, songs: [] }); save(); V.music();
    });
    bindAll(".plplay", function () {
      var pl = findPlaylist(this.getAttribute("data-i"));
      if (pl && pl.songs.length) { shuffle = false; $("pl-shuffle").className = "pbtn sm"; playQueue(pl.songs, 0); }
    });
    bindAll(".plshuffle", function () {
      var pl = findPlaylist(this.getAttribute("data-i"));
      if (pl && pl.songs.length) {
        shuffle = true; $("pl-shuffle").className = "pbtn sm on";
        playQueue(pl.songs, Math.floor(Math.random() * pl.songs.length));
      }
    });
    bindAll(".plrename", function () {
      var pl = findPlaylist(this.getAttribute("data-i"));
      var name = window.prompt("New playlist name", pl.name);
      if (name) { pl.name = name; save(); V.music(); }
    });
    bindAll(".pldelete", function () {
      var id = this.getAttribute("data-i"), i;
      for (i = 0; i < db.playlists.length; i++) { if (db.playlists[i].id === id) { db.playlists.splice(i, 1); break; } }
      save(); V.music();
    });
    bindAll(".pladd", function () {
      var id = this.getAttribute("data-i"), pl = findPlaylist(id), sel = $("pladd_" + id);
      if (pl && sel) { pl.songs.push(sel.value); save(); V.music(); }
    });
    bindAll(".plremove", function () {
      var pl = findPlaylist(this.getAttribute("data-p")), sid = this.getAttribute("data-i"), i;
      if (!pl) { return; }
      for (i = 0; i < pl.songs.length; i++) { if (pl.songs[i] === sid) { pl.songs.splice(i, 1); break; } }
      save(); V.music();
    });
  }

  V.album = function (id) {
    var a = albumOf(id), songs = all("songs"), sub = [], i;
    if (!a) { return notFound(); }
    for (i = 0; i < songs.length; i++) { if (songs[i].albumId === a.id) { sub.push(songs[i]); } }
    render(pageWrap(a.title, artistName(a.artistId) + " \u2022 " + (a.year || ""),
      '<div class="panel"><img src="' + esc(a.cover) + '" alt="' + esc(a.title) + ' artwork" style="width:180px;border-radius:8px">' +
      favBtn("album", a.id, a.title, "#/album/" + a.id) +
      '<ul class="list">' + songRows(sub) + "</ul></div>"));
    wireSongRows();
  };

  V.artist = function (id) {
    var songs = all("songs"), sub = [], i;
    for (i = 0; i < songs.length; i++) { if (songs[i].artistId === id) { sub.push(songs[i]); } }
    render(pageWrap(artistName(id), sub.length + " songs",
      '<div class="panel"><ul class="list">' + songRows(sub) + "</ul></div>"));
    wireSongRows();
  };

  /* ---- search ---- */
  var lastQuery = "";
  V.search = function (q) {
    q = q || lastQuery || "";
    render(pageWrap("Search", "Anime, manga, Bible books, novels and music",
      '<div class="panel"><input type="text" id="q" placeholder="Type a title, author, artist or Bible book" value="' + esc(q) + '">' +
      '<button type="button" class="btn primary" id="gosearch">Search</button></div><div id="results"></div>'));

    function run() {
      var term = $("q").value.toLowerCase(), out = "";
      lastQuery = $("q").value;
      if (!term) { $("results").innerHTML = '<p class="muted">Enter a search term.</p>'; return; }
      out += group("Anime", all("anime"), function (x) { return x.title + " " + (x.genres || []).join(" ") + " " + x.description; }, function (x) { return "#/anime/" + x.id; }, function (x) { return x.title; });
      out += group("Manga", all("manga"), function (x) { return x.title + " " + x.author + " " + x.description; }, function (x) { return "#/manga/" + x.id; }, function (x) { return x.title; });
      out += group("Novels", all("novels"), function (x) { return x.title + " " + x.author + " " + x.description; }, function (x) { return "#/novel/" + x.id; }, function (x) { return x.title; });
      out += group("Bible books", AV_DATA.bibleBooks, function (x) { return x.name; }, function (x) { return "#/bible/" + x.id + "/1"; }, function (x) { return x.name; });
      out += group("Songs", all("songs"), function (x) { return x.title + " " + artistName(x.artistId) + " " + albumTitle(x.albumId) + " " + (x.genre || ""); }, function () { return "#/music"; }, function (x) { return x.title + " \u2014 " + artistName(x.artistId); });
      out += group("Albums", all("albums"), function (x) { return x.title + " " + artistName(x.artistId); }, function (x) { return "#/album/" + x.id; }, function (x) { return x.title; });
      out += group("Playlists", db.playlists, function (x) { return x.name; }, function () { return "#/music/playlists"; }, function (x) { return x.name; });
      $("results").innerHTML = out || '<p class="muted">No results.</p>';

      function group(label, list, hay, href, label2) {
        var h = "", i, n = 0;
        for (i = 0; i < list.length && n < 25; i++) {
          if (String(hay(list[i])).toLowerCase().indexOf(term) !== -1) {
            n++;
            h += '<li><a href="' + href(list[i]) + '">' + esc(label2(list[i])) + "</a></li>";
          }
        }
        return h ? '<div class="panel"><h3>' + label + " (" + n + ')</h3><ul class="list">' + h + "</ul></div>" : "";
      }
    }
    bindAll("#gosearch", run);
    on($("q"), "keyup", function (e) { if (e && e.keyCode === 13) { run(); } });
    if (q) { run(); }
  };

  var favFilter = "all";
  V.favorites = function () {
    var types = ["all", "anime", "manga", "novel", "verse", "bible", "song", "album"], i, bar = "", h = "", k, f;
    for (i = 0; i < types.length; i++) {
      bar += '<button type="button" class="btn sm ffilter' + (types[i] === favFilter ? " on" : "") +
        '" data-f="' + types[i] + '">' + types[i] + "</button>";
    }
    for (k in db.favorites) {
      if (db.favorites.hasOwnProperty(k)) {
        f = db.favorites[k];
        if (favFilter !== "all" && f.type !== favFilter) { continue; }
        h += '<li><div class="li"><a href="' + esc(f.href || "#/home") + '">' + esc(f.title) +
          '</a> <span class="tiny">' + esc(f.type) + "</span> " +
          '<button type="button" class="btn sm unfav" data-k="' + esc(k) + '">Remove</button></div></li>';
      }
    }
    render(pageWrap("Favorites", "Everything you starred",
      '<div class="bar">' + bar + '</div><div class="panel"><ul class="list">' +
      (h || '<li><div class="li muted">No favorites yet.</div></li>') + "</ul></div>"));
    bindAll(".ffilter", function () { favFilter = this.getAttribute("data-f"); V.favorites(); });
    bindAll(".unfav", function () { delete db.favorites[this.getAttribute("data-k")]; save(); V.favorites(); });
  };

  V.history = function () {
    var h = "", i, e, d;
    for (i = 0; i < db.history.length; i++) {
      e = db.history[i];
      d = new Date(e.ts);
      h += '<li><a href="' + esc(e.href || "#/home") + '">' + esc(e.title) +
        ' <span class="tiny">' + esc(e.type + " \u2022 " + (e.sub || "") + " \u2022 " + d.toLocaleDateString() + " " + d.toLocaleTimeString()) +
        "</span></a></li>";
    }
    render(pageWrap("History", "Watched, read and played",
      '<div class="bar"><button type="button" class="btn sm" id="clearh">Clear history</button></div>' +
      '<div class="panel"><ul class="list">' + (h || '<li><div class="li muted">Nothing yet.</div></li>') + "</ul></div>"));
    bindAll("#clearh", function () { db.history = []; save(); V.history(); });
  };

  V.settings = function () {
    render(pageWrap("Settings", "Stored locally on this device with localStorage",
      '<div class="panel"><h3>Reading</h3>' +
      '<label>Reader font size (' + db.settings.fontSize + "px)</label>" +
      '<button type="button" class="btn sm" id="fminus">A-</button>' +
      '<button type="button" class="btn sm" id="fplus">A+</button>' +
      '<button type="button" class="btn sm" id="tlight">' + (db.settings.readerLight ? "Reader: light" : "Reader: dark") + "</button></div>" +
      '<div class="panel"><h3>Data</h3><p class="muted tiny">Favorites, history, progress and playlists are stored in this browser only. ' +
      "No account and no server tracking are required.</p>" +
      '<button type="button" class="btn" id="wipe">Reset all local data</button></div>' +
      '<div class="panel"><h3>Compatibility</h3><p class="tiny muted">This interface is built with ES5 JavaScript, CSS3 and native HTML5 ' +
      "&lt;video&gt; / &lt;audio&gt; so it can run on Safari 9 (iPad, iOS 9.3.5) as well as current desktop and mobile browsers. " +
      "No service workers, WebGL, IndexedDB or CSS Grid are required.</p></div>"));
    bindAll("#fplus", function () { db.settings.fontSize = Math.min(34, db.settings.fontSize + 2); save(); V.settings(); });
    bindAll("#fminus", function () { db.settings.fontSize = Math.max(13, db.settings.fontSize - 2); save(); V.settings(); });
    bindAll("#tlight", function () { db.settings.readerLight = !db.settings.readerLight; save(); V.settings(); });
    bindAll("#wipe", function () {
      if (window.confirm("Delete all local favorites, history, progress and playlists?")) {
        db = defaults(); save(); V.settings();
      }
    });
  };

  /* ---- admin ---- */
  var adminTab = "anime";
  V.admin = function (tab) {
    if (tab) { adminTab = tab; }
    var tabs = ["anime", "manga", "bible", "novels", "music"], i, bar = "", h = "";
    for (i = 0; i < tabs.length; i++) {
      bar += '<a class="btn sm' + (tabs[i] === adminTab ? " on" : "") + '" href="#/admin/' + tabs[i] + '">' + tabs[i] + "</a>";
    }

    if (adminTab === "anime") {
      h = '<div class="panel"><h3>Add anime</h3>' +
        field("an_title", "Title") + field("an_cover", "Cover image URL", "/media/anime/example/cover.jpg") +
        field("an_genres", "Genres (comma separated)", "Action, Fantasy") +
        field("an_year", "Year", "2024") + field("an_status", "Status", "Ongoing") +
        area("an_desc", "Description") +
        area("an_eps", "Episode video or embed links (one per line \u2014 MP4 file, or a YouTube/Vimeo/site link that plays in-app)", "/media/anime/example/episode-01.mp4") +
        '<button type="button" class="btn primary" id="an_save">Save anime</button></div>' +
        listPanel("anime", all("anime"), function (x) { return x.title + " (" + x.episodes.length + " episodes)"; });
    } else if (adminTab === "manga") {
      h = '<div class="panel"><h3>Add manga</h3>' +
        field("mg_title", "Title") + field("mg_author", "Author") + field("mg_artist", "Artist") +
        field("mg_cover", "Cover image URL", "/media/manga/example/cover.jpg") +
        field("mg_genres", "Genres (comma separated)") + field("mg_status", "Status", "Ongoing") +
        area("mg_desc", "Description") +
        area("mg_pages", "Chapter 1 page image URLs (one per line, JPG/PNG)", "/media/manga/example/chapter-01/page-001.jpg") +
        '<button type="button" class="btn primary" id="mg_save">Save manga</button></div>' +
        listPanel("manga", all("manga"), function (x) { return x.title + " (" + x.chapters.length + " chapters)"; });
    } else if (adminTab === "bible") {
      var bookOptions = "", bb = AV_DATA.bibleBooks, j;
      for (j = 0; j < bb.length; j++) { bookOptions += '<option value="' + bb[j].id + '">' + esc(bb[j].name) + "</option>"; }
      h = '<div class="panel"><h3>Add or replace a chapter</h3>' +
        "<label>Book</label><select id=\"bb_book\">" + bookOptions + "</select>" +
        field("bb_ch", "Chapter number", "1") +
        area("bb_text", "Verses (one verse per line)") +
        '<p class="tiny muted">Use a translation whose licence permits your use (for example the World English Bible, public domain).</p>' +
        '<button type="button" class="btn primary" id="bb_save">Save chapter</button></div>';
    } else if (adminTab === "novels") {
      h = '<div class="panel"><h3>Add novel</h3>' +
        field("nv_title", "Title") + field("nv_author", "Author") +
        field("nv_cover", "Cover image URL") + field("nv_genres", "Genres (comma separated)") +
        area("nv_desc", "Description") +
        area("nv_text", "Chapter 1 text") +
        '<button type="button" class="btn primary" id="nv_save">Save novel</button></div>' +
        listPanel("novels", all("novels"), function (x) { return x.title + " (" + x.chapters.length + " chapters)"; });
    } else {
      var arOpts = "", ars = all("artists"), alOpts = "", als = all("albums"), q;
      for (q = 0; q < ars.length; q++) { arOpts += '<option value="' + ars[q].id + '">' + esc(ars[q].name) + "</option>"; }
      for (q = 0; q < als.length; q++) { alOpts += '<option value="' + als[q].id + '">' + esc(als[q].title) + "</option>"; }
      h = '<div class="panel"><h3>Add artist</h3>' + field("ar_name", "Artist name") +
        '<button type="button" class="btn" id="ar_save">Save artist</button></div>' +
        '<div class="panel"><h3>Add album</h3>' + field("al_title", "Album name") +
        "<label>Artist</label><select id=\"al_artist\">" + arOpts + "</select>" +
        field("al_cover", "Album artwork URL", "/media/music/example/cover.jpg") +
        field("al_year", "Year") +
        '<button type="button" class="btn" id="al_save">Save album</button></div>' +
        '<div class="panel"><h3>Add song</h3>' + field("sg_title", "Song title") +
        "<label>Artist</label><select id=\"sg_artist\">" + arOpts + "</select>" +
        "<label>Album</label><select id=\"sg_album\">" + alOpts + "</select>" +
        field("sg_genre", "Genre") + field("sg_duration", "Duration", "3:30") +
        field("sg_url", "Audio URL (MP3, or AAC/M4A)", "/media/music/example-song.mp3") +
        '<button type="button" class="btn primary" id="sg_save">Save song</button></div>' +
        listPanel("songs", all("songs"), function (x) { return x.title + " \u2014 " + artistName(x.artistId); });
    }

    render(pageWrap("Admin", "Content management \u2014 saved locally now, ready to move to a backend later",
      '<div class="bar">' + bar + "</div>" + h));
    wireAdmin();
  };

  function field(id, label, ph) {
    return "<label>" + esc(label) + '</label><input type="text" id="' + id + '" placeholder="' + esc(ph || "") + '">';
  }
  function area(id, label, ph) {
    return "<label>" + esc(label) + '</label><textarea id="' + id + '" placeholder="' + esc(ph || "") + '"></textarea>';
  }
  function listPanel(kind, list, label) {
    var h = "", i, custom;
    for (i = 0; i < list.length; i++) {
      custom = isCustom(kind, list[i].id);
      h += '<li><div class="li">' + esc(label(list[i])) +
        (custom ? ' <button type="button" class="btn sm adel" data-k="' + kind + '" data-i="' + list[i].id + '">Delete</button>' :
          ' <span class="tiny">demo entry</span>') + "</div></li>";
    }
    return '<div class="panel"><h3>Existing</h3><ul class="list">' + h + "</ul></div>";
  }
  function isCustom(kind, id) {
    var l = db.custom[kind] || [], i;
    for (i = 0; i < l.length; i++) { if (l[i].id === id) { return true; } }
    return false;
  }
  function val(id) { var el = $(id); return el ? el.value : ""; }
  function lines(id) {
    var v = val(id).split("\n"), out = [], i;
    for (i = 0; i < v.length; i++) { if (v[i].replace(/^\s+|\s+$/g, "")) { out.push(v[i].replace(/^\s+|\s+$/g, "")); } }
    return out;
  }
  function csv(id) {
    var v = val(id).split(","), out = [], i;
    for (i = 0; i < v.length; i++) { if (v[i].replace(/^\s+|\s+$/g, "")) { out.push(v[i].replace(/^\s+|\s+$/g, "")); } }
    return out;
  }

  function wireAdmin() {
    bindAll(".adel", function () {
      var kind = this.getAttribute("data-k"), id = this.getAttribute("data-i"), l = db.custom[kind], i;
      for (i = 0; i < l.length; i++) { if (l[i].id === id) { l.splice(i, 1); break; } }
      save(); V.admin();
    });
    bindAll("#an_save", function () {
      var urls = lines("an_eps"), epsArr = [], i;
      for (i = 0; i < urls.length; i++) { epsArr.push({ id: "ep" + (i + 1), number: i + 1, title: "Episode " + (i + 1), duration: "", video: urls[i] }); }
      if (!val("an_title")) { alert("Title is required."); return; }
      db.custom.anime.push({
        id: uid("a"), title: val("an_title"), cover: val("an_cover") || "/app/img/cover.svg",
        genres: csv("an_genres"), year: val("an_year"), status: val("an_status") || "Ongoing",
        description: val("an_desc"), episodes: epsArr
      });
      save(); V.admin();
    });
    bindAll("#mg_save", function () {
      if (!val("mg_title")) { alert("Title is required."); return; }
      var pg = lines("mg_pages");
      db.custom.manga.push({
        id: uid("m"), title: val("mg_title"), author: val("mg_author"), artist: val("mg_artist"),
        cover: val("mg_cover") || "/app/img/cover.svg", genres: csv("mg_genres"),
        status: val("mg_status") || "Ongoing", description: val("mg_desc"),
        chapters: [{ id: "c1", number: 1, title: "Chapter 1", pages: pg.length ? pg : ["/app/img/page.svg"] }]
      });
      save(); V.admin();
    });
    bindAll("#bb_save", function () {
      var v = lines("bb_text"), ch = parseInt(val("bb_ch"), 10) || 1;
      if (!v.length) { alert("Paste at least one verse."); return; }
      db.custom.bible[val("bb_book") + "|" + ch] = v;
      save(); alert("Chapter saved.");
    });
    bindAll("#nv_save", function () {
      if (!val("nv_title")) { alert("Title is required."); return; }
      db.custom.novels.push({
        id: uid("n"), title: val("nv_title"), author: val("nv_author"),
        cover: val("nv_cover") || "/app/img/cover.svg", genres: csv("nv_genres"),
        description: val("nv_desc"),
        chapters: [{ id: "nc1", number: 1, title: "Chapter 1", text: val("nv_text") }]
      });
      save(); V.admin();
    });
    bindAll("#ar_save", function () {
      if (!val("ar_name")) { return; }
      db.custom.artists.push({ id: uid("ar"), name: val("ar_name") }); save(); V.admin();
    });
    bindAll("#al_save", function () {
      if (!val("al_title")) { return; }
      db.custom.albums.push({
        id: uid("al"), title: val("al_title"), artistId: val("al_artist"),
        cover: val("al_cover") || "/app/img/cover.svg", year: val("al_year")
      });
      save(); V.admin();
    });
    bindAll("#sg_save", function () {
      if (!val("sg_title") || !val("sg_url")) { alert("Song title and audio URL are required."); return; }
      db.custom.songs.push({
        id: uid("s"), title: val("sg_title"), artistId: val("sg_artist"), albumId: val("sg_album"),
        genre: val("sg_genre") || "Other", duration: val("sg_duration"), url: val("sg_url")
      });
      save(); V.admin();
    });
  }

  /* ---------------- router ---------------- */
  function render(html) {
    $("view").innerHTML = html;
    if (window.scrollTo) { window.scrollTo(0, 0); }
  }
  function notFound() {
    render(pageWrap("Not found", "", '<p class="muted">That item does not exist. <a href="#/home">Go home</a>.</p>'));
  }
  function setActive(key) {
    var links = $("nav").getElementsByTagName("a"), i;
    for (i = 0; i < links.length; i++) {
      links[i].className = (links[i].getAttribute("data-key") === key) ? "active" : "";
    }
  }

  function route() {
    var hash = location.hash || "#/home";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var p0 = parts[0] || "home";
    setActive(p0 === "novel" ? "novels" : (p0 === "watch" ? "anime" : (p0 === "album" || p0 === "artist" ? "music" : p0)));
    if ($("nav").className === "open") { $("nav").className = ""; }

    if (p0 === "home" || p0 === "") { V.home(); }
    else if (p0 === "anime") { if (parts[1]) { V.animeDetail(parts[1]); } else { V.anime(); } }
    else if (p0 === "watch") { V.watch(parts[1], parts[2]); }
    else if (p0 === "manga") {
      if (parts[2]) { V.mangaRead(parts[1], parts[2], parts[3]); }
      else if (parts[1]) { V.mangaDetail(parts[1]); }
      else { V.manga(); }
    } else if (p0 === "bible") {
      if (parts[2]) { V.bibleRead(parts[1], parts[2]); }
      else if (parts[1]) { V.bibleChapters(parts[1]); }
      else { V.bible(); }
    } else if (p0 === "novels") { V.novels(); }
    else if (p0 === "novel") { if (parts[2]) { V.novelRead(parts[1], parts[2]); } else { V.novelDetail(parts[1]); } }
    else if (p0 === "music") { V.music(parts[1]); }
    else if (p0 === "album") { V.album(parts[1]); }
    else if (p0 === "artist") { V.artist(parts[1]); }
    else if (p0 === "search") { V.search(parts[1] ? decodeURIComponent(parts[1]) : ""); }
    else if (p0 === "favorites") { V.favorites(); }
    else if (p0 === "history") { V.history(); }
    else if (p0 === "settings") { V.settings(); }
    else if (p0 === "admin") { V.admin(parts[1]); }
    else { notFound(); }
  }

  on($("navtoggle"), "click", function (e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    $("nav").className = ($("nav").className === "open") ? "" : "open";
    return false;
  });

  if (window.addEventListener) { window.addEventListener("hashchange", route, false); }
  else { window.attachEvent("onhashchange", route); }

  if (!location.hash) { location.hash = "#/home"; }
  route();
})();
