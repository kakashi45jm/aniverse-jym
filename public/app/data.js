/* AniVerse Library — demo data (ES5). Replace/extend via the Admin screen. */
/* All demo media is public-domain or CC-BY, or a placeholder path you fill in. */
var AV_DATA = (function () {
  "use strict";

  function eps(n, base) {
    var a = [], i;
    for (i = 1; i <= n; i++) {
      a.push({
        id: "ep" + i,
        number: i,
        title: "Episode " + i,
        duration: "24:00",
        video: base
      });
    }
    return a;
  }

  var BBB = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  var ED = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

  var anime = [];

  function pages(n) {
    var a = [], i;
    for (i = 1; i <= n; i++) { a.push("/app/img/page.svg"); }
    return a;
  }
  function chapters(n, pcount) {
    var a = [], i;
    for (i = 1; i <= n; i++) {
      a.push({ id: "c" + i, number: i, title: "Chapter " + i, pages: pages(pcount) });
    }
    return a;
  }

  var manga = [];

  function novelChapters(list) {
    var a = [], i;
    for (i = 0; i < list.length; i++) {
      a.push({ id: "nc" + (i + 1), number: i + 1, title: list[i].t, text: list[i].x });
    }
    return a;
  }

  var loremPara =
    "The road bent away from the harbour and climbed until the town was only a scatter of roofs below. " +
    "There was no wind that morning, only the smell of salt and cut grass, and the sound of a gate " +
    "swinging somewhere out of sight.\n\n" +
    "She had promised herself she would not look back before the second milestone, and she kept the " +
    "promise the way people keep small promises: badly, and with great seriousness.\n\n" +
    "By noon the sea was a grey line and the hills had closed behind her like a door.";

  var novels = [];

  var artists = [];
  var albums = [];
  var songs = [];

  /* Bible: full 66-book structure with chapter counts. */
  var otRaw = "Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4," +
    "1 Samuel:31,2 Samuel:24,1 Kings:22,2 Kings:25,1 Chronicles:29,2 Chronicles:36,Ezra:10,Nehemiah:13," +
    "Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,Song of Solomon:8,Isaiah:66,Jeremiah:52," +
    "Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3," +
    "Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4";
  var ntRaw = "Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,1 Corinthians:16,2 Corinthians:13," +
    "Galatians:6,Ephesians:6,Philippians:4,Colossians:4,1 Thessalonians:5,2 Thessalonians:3,1 Timothy:6," +
    "2 Timothy:4,Titus:3,Philemon:1,Hebrews:13,James:5,1 Peter:5,2 Peter:3,1 John:5,2 John:1,3 John:1," +
    "Jude:1,Revelation:22";

  function parseBooks(raw, testament) {
    var out = [], parts = raw.split(","), i, p;
    for (i = 0; i < parts.length; i++) {
      p = parts[i].split(":");
      out.push({
        id: p[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: p[0],
        chapters: parseInt(p[1], 10),
        testament: testament
      });
    }
    return out;
  }
  var bibleBooks = parseBooks(otRaw, "old").concat(parseBooks(ntRaw, "new"));

  /* Bible text is loaded from the server (King James Version, public domain). */
  var bibleText = {};

  return {
    anime: anime,
    manga: manga,
    novels: novels,
    songs: songs,
    albums: albums,
    artists: artists,
    bibleBooks: bibleBooks,
    bibleText: bibleText,
    genres: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi", "Horror"]
  };
})();
