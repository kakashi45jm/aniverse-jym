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

  var anime = [
    { id: "a1", title: "Skyward Lantern", year: 2021, status: "Completed", genres: ["Adventure", "Fantasy"],
      cover: "/app/img/cover.svg",
      description: "A lantern-maker's apprentice chases a rumour of a floating island. Demo entry using a CC-BY Blender short as the sample video source.",
      episodes: eps(6, BBB) },
    { id: "a2", title: "Neon Harbor", year: 2023, status: "Ongoing", genres: ["Sci-Fi", "Action"],
      cover: "/app/img/cover.svg",
      description: "Dock workers in a rain-soaked port city discover a derelict cargo ship that should not exist.",
      episodes: eps(4, ED) },
    { id: "a3", title: "Quiet Kitchen Club", year: 2019, status: "Completed", genres: ["Comedy", "Romance"],
      cover: "/app/img/cover.svg",
      description: "Four students keep a tiny after-school kitchen alive. Gentle, slow, mostly about soup.",
      episodes: eps(5, BBB) },
    { id: "a4", title: "Hollow Bell", year: 2020, status: "Completed", genres: ["Horror", "Drama"],
      cover: "/app/img/cover.svg",
      description: "A village rings a bell every night. Nobody remembers who started it.",
      episodes: eps(3, ED) }
  ];

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

  var manga = [
    { id: "m1", title: "Paper Compass", author: "A. Rivera", artist: "A. Rivera",
      status: "Ongoing", genres: ["Adventure", "Drama"], cover: "/app/img/cover.svg",
      description: "A cartographer maps a coastline that keeps changing shape overnight.",
      chapters: chapters(5, 8) },
    { id: "m2", title: "Midnight Ramen Log", author: "K. Ando", artist: "S. Mori",
      status: "Completed", genres: ["Comedy", "Slice of Life"], cover: "/app/img/cover.svg",
      description: "One stall, one cook, one hundred late-night customers.",
      chapters: chapters(4, 6) },
    { id: "m3", title: "Iron Lily", author: "R. Okonkwo", artist: "R. Okonkwo",
      status: "Ongoing", genres: ["Action", "Fantasy"], cover: "/app/img/cover.svg",
      description: "A blacksmith forges garden tools that refuse to stay peaceful.",
      chapters: chapters(6, 10) }
  ];

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

  var novels = [
    { id: "n1", title: "The Second Milestone", author: "Public Domain Sample",
      genres: ["Literary", "Drama"], cover: "/app/img/cover.svg",
      description: "A short sample novel included so the reader can be tested immediately.",
      chapters: novelChapters([
        { t: "The Harbour", x: loremPara },
        { t: "The Hill Road", x: loremPara },
        { t: "Winter Letters", x: loremPara },
        { t: "Return", x: loremPara }
      ]) },
    { id: "n2", title: "Notes on Small Machines", author: "Public Domain Sample",
      genres: ["Essays"], cover: "/app/img/cover.svg",
      description: "Essays about clocks, bicycles and other honest devices.",
      chapters: novelChapters([
        { t: "Clocks", x: loremPara },
        { t: "Bicycles", x: loremPara },
        { t: "Levers", x: loremPara }
      ]) }
  ];

  var artists = [
    { id: "ar1", name: "The Quiet Hours" },
    { id: "ar2", name: "Kestrel Trio" }
  ];
  var albums = [
    { id: "al1", title: "Long Evenings", artistId: "ar1", year: 2022, cover: "/app/img/cover.svg" },
    { id: "al2", title: "Field Recordings", artistId: "ar2", year: 2020, cover: "/app/img/cover.svg" }
  ];
  var songs = [
    { id: "s1", title: "Porch Light", artistId: "ar1", albumId: "al1", genre: "Ambient", duration: "3:41", url: "/media/music/porch-light.mp3" },
    { id: "s2", title: "Blue Kitchen", artistId: "ar1", albumId: "al1", genre: "Ambient", duration: "4:12", url: "/media/music/blue-kitchen.mp3" },
    { id: "s3", title: "Slow Train", artistId: "ar1", albumId: "al1", genre: "Folk", duration: "2:58", url: "/media/music/slow-train.mp3" },
    { id: "s4", title: "Riverbank", artistId: "ar2", albumId: "al2", genre: "Jazz", duration: "5:20", url: "/media/music/riverbank.mp3" },
    { id: "s5", title: "Nightbus", artistId: "ar2", albumId: "al2", genre: "Jazz", duration: "3:05", url: "/media/music/nightbus.mp3" }
  ];

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

  /* Sample verse text: World English Bible (public domain). */
  var bibleText = {
    "genesis|1": [
      "In the beginning, God created the heavens and the earth.",
      "The earth was formless and empty. Darkness was on the surface of the deep and God's Spirit was hovering over the surface of the waters.",
      "God said, \u201cLet there be light,\u201d and there was light.",
      "God saw the light, and saw that it was good. God divided the light from the darkness.",
      "God called the light \u201cday\u201d, and the darkness he called \u201cnight\u201d. There was evening and there was morning, the first day.",
      "God said, \u201cLet there be an expanse in the middle of the waters, and let it divide the waters from the waters.\u201d",
      "God made the expanse, and divided the waters which were under the expanse from the waters which were above the expanse; and it was so.",
      "God called the expanse \u201csky\u201d. There was evening and there was morning, a second day.",
      "God said, \u201cLet the waters under the sky be gathered together to one place, and let the dry land appear;\u201d and it was so.",
      "God called the dry land \u201cearth\u201d, and the gathering together of the waters he called \u201cseas\u201d. God saw that it was good."
    ],
    "psalms|23": [
      "Yahweh is my shepherd: I shall lack nothing.",
      "He makes me lie down in green pastures. He leads me beside still waters.",
      "He restores my soul. He guides me in the paths of righteousness for his name's sake.",
      "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.",
      "You prepare a table before me in the presence of my enemies. You anoint my head with oil. My cup runs over.",
      "Surely goodness and loving kindness shall follow me all the days of my life, and I will dwell in Yahweh's house forever."
    ],
    "john|1": [
      "In the beginning was the Word, and the Word was with God, and the Word was God.",
      "The same was in the beginning with God.",
      "All things were made through him. Without him, nothing was made that has been made.",
      "In him was life, and the life was the light of men.",
      "The light shines in the darkness, and the darkness hasn't overcome it.",
      "There came a man sent from God, whose name was John.",
      "The same came as a witness, that he might testify about the light, that all might believe through him.",
      "He was not the light, but was sent that he might testify about the light.",
      "The true light that enlightens everyone was coming into the world.",
      "He was in the world, and the world was made through him, and the world didn't recognize him."
    ]
  };

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
