# AniVerse Media Hub

BUILD: AniVerse Library — Legacy iPad Edition

Create a complete, lightweight, responsive media and reading library website called AniVerse Library.

The website contains:

Anime library and video player

Manga library and reader

Bible library with Old Testament and New Testament

Novel/book library and reader

Personal music library and HTML5 music player

Search

Favorites

History

Continue Watching

Continue Reading

Continue Listening

Admin/content management

🚨 CRITICAL REQUIREMENT — iOS 9.3.5

The MOST IMPORTANT requirement is that this website must work on:

iPad running iOS 9.3.5 with Safari

Do NOT optimize only for modern Chrome/Safari.

The website must remain usable on an old iPad with Safari 9.

Target device:

iPad 9.7-inch

1024 × 768 landscape

768 × 1024 portrait

iOS 9.3.5

Safari 9

Also support modern desktop and mobile browsers.

LEGACY BROWSER RULE

Treat iOS 9.3.5 Safari as a first-class supported browser.

DO NOT use browser features that require newer Safari unless a compatible fallback is provided.

Avoid relying on:

ES6-only JavaScript

Arrow functions

async/await

Optional chaining

Nullish coalescing

Web Components

Service Workers

Web Push

WebGL

IndexedDB as the only storage

CSS Grid as a requirement

modern CSS features unsupported by Safari 9

modern browser-only APIs

heavy JavaScript frameworks/features

large animation libraries

Prefer:

ES5-compatible JavaScript

Traditional functions

HTML5

CSS3

Flexbox with Safari-compatible fallbacks

HTML5 <video>

HTML5 <audio>

MP4/H.264

MP3

AAC/M4A where supported

localStorage

simple AJAX/fetch fallback where necessary

lightweight CSS

lightweight JavaScript

If using React or another framework internally, the FINAL BUILD MUST be transpiled/polyfilled so that it can actually run in Safari 9 / iOS 9.3.5.

Do not assume that because the application builds successfully on a modern browser that it will work on iOS 9.

IMPORTANT: KEEP THE APPLICATION LIGHTWEIGHT

This is for an old iPad.

Prioritize:

iOS 9.3.5 compatibility

Fast loading

Low memory usage

Simple navigation

Touch usability

Media playback

Clean UI

Avoid:

heavy animations

animated backgrounds

huge images

video backgrounds

unnecessary JavaScript

large UI libraries

excessive DOM elements

complicated effects

unnecessary API calls

The application should still be usable over slower Wi-Fi.

DESIGN

Create a polished dark media-library interface.

Style inspiration:

streaming service dashboard

digital library

manga reader

music player

But do NOT copy copyrighted branding or exact UI designs.

Use:

dark background

light text

subtle cards

one strong accent color

large touch-friendly controls

readable typography

simple animations only if supported

The interface should look modern while remaining technically simple.

NAVIGATION

Create:

Home

Anime

Manga

Bible

Novels

Music

Favorites

History

Search

Settings

Desktop:

Use a sidebar.

iPad:

Use a compact sidebar or top navigation.

Portrait iPad:

Make sure navigation does not consume too much screen space.

Do not require hover interactions.

Everything must work with touch.

HOME

Create a dashboard containing:

Continue Watching

Show:

anime cover

title

episode

progress bar

Continue button

Continue Reading

Show:

manga

Bible chapter

novel

Continue Listening

Show recently played music.

Recently Added

Show newly added:

anime

manga

novels

music

Favorites

Show favorite items.

ANIME LIBRARY

Create an anime catalog.

Each anime contains:

Cover

Title

Description

Genre

Year

Status

Episodes

Create category filters.

Example:

Action

Adventure

Comedy

Drama

Fantasy

Romance

Sci-Fi

Horror

Create an Anime Details page.

Example:

ANIME TITLE

Description

Episodes:

Episode 1
Episode 2
Episode 3
Episode 4

Click an episode to open the video player.

ANIME VIDEO PLAYER

Use the native HTML5 <video> element.

This is extremely important for iOS 9 compatibility.

Primary video format:

MP4 / H.264 / AAC

Do not require:

WebGL

modern custom video APIs

unsupported video codecs

browser-specific modern features

Provide:

Play

Pause

Seek

Volume

Fullscreen where supported

Progress

Duration

Do not autoplay video.

Allow the administrator to specify the video URL.

Show a friendly error if the video cannot be loaded.

🎵 PERSONAL MUSIC LIBRARY

Create a completely independent music library.

DO NOT connect the music player to Spotify.

DO NOT depend on Spotify APIs.

DO NOT depend on streaming services.

The website must play music from our own legally owned/licensed music files.

Supported primary format:

MP3

Optional:

AAC / M4A

Use native HTML5:

<audio>

The music player must be compatible with Safari 9 / iOS 9.3.5.

MUSIC LIBRARY

Create:

Albums

Artists

Songs

Genres

Playlists

Favorites

Each song should contain:

Song title

Artist

Album

Album artwork

Genre

Duration

Audio URL

Each album should contain:

Album artwork

Album name

Artist

Track list

MUSIC PLAYER

Create a persistent music player.

Controls:

Play

Pause

Previous

Next

Seek

Volume

Repeat

Shuffle

Track title

Artist

Album artwork

Progress

Duration

Use the native HTML5 audio element internally.

Example supported source:

/music/song.mp3

The administrator should be able to enter an audio URL.

The player should continue playing when the user navigates between:

Home

Anime

Manga

Bible

Novels

Music

Do NOT reload the entire page during normal navigation if doing so would interrupt audio.

If a single-page architecture makes iOS 9 compatibility unreliable, use a simpler architecture instead.

Compatibility is more important than SPA complexity.

MUSIC PLAYLISTS

Allow users to create playlists.

Features:

Create playlist

Rename playlist

Delete playlist

Add song

Remove song

Play playlist

Shuffle playlist

Store basic playlist information using compatible browser storage.

Use:

localStorage

as the first-choice local storage mechanism.

Do not require IndexedDB.

MUSIC SEARCH

Allow searching:

Songs

Artists

Albums

Playlists

Search must work on iOS 9.

Keep it lightweight.

Do not require a modern search engine or heavy client-side library.

BIBLE LIBRARY

Create a complete Bible library structure.

OLD TESTAMENT

Genesis
Exodus
Leviticus
Numbers
Deuteronomy
Joshua
Judges
Ruth
1 Samuel
2 Samuel
1 Kings
2 Kings
1 Chronicles
2 Chronicles
Ezra
Nehemiah
Esther
Job
Psalms
Proverbs
Ecclesiastes
Song of Solomon
Isaiah
Jeremiah
Lamentations
Ezekiel
Daniel
Hosea
Joel
Amos
Obadiah
Jonah
Micah
Nahum
Habakkuk
Zephaniah
Haggai
Zechariah
Malachi

NEW TESTAMENT

Matthew
Mark
Luke
John
Acts
Romans
1 Corinthians
2 Corinthians
Galatians
Ephesians
Philippians
Colossians
1 Thessalonians
2 Thessalonians
1 Timothy
2 Timothy
Titus
Philemon
Hebrews
James
1 Peter
2 Peter
1 John
2 John
3 John
Jude
Revelation

Create:

Book list

Chapter list

Previous chapter

Next chapter

Verse display

Search

Bookmark

Favorites

Reading history

Adjustable text size

The Bible reader should be extremely lightweight.

BIBLE READER

Design the Bible reader specifically for an iPad.

Requirements:

Large readable text

Comfortable line spacing

Previous chapter

Next chapter

Book selector

Chapter selector

Text size controls

Bookmark

Favorite verse

Search

Avoid unnecessary animations.

MANGA LIBRARY

Create a manga catalog.

Each manga contains:

Cover

Title

Author

Artist

Description

Genre

Status

Chapters

Create a touch-friendly Manga Reader.

Features:

Previous page

Next page

Page number

Zoom

Fit screen

Vertical mode

Horizontal navigation

Fullscreen when supported

Use:

JPG

PNG

Do not depend on WebGL.

Optimize images for old iPad hardware.

NOVEL LIBRARY

Create a novel/book section.

Each novel contains:

Cover

Title

Author

Description

Genre

Chapters

Reader features:

Previous chapter

Next chapter

Font size

Reading progress

Bookmark

Favorites

Light/dark reading mode

Make the reading interface extremely lightweight.

SEARCH

Create one global search interface.

Search:

Anime

Manga

Bible

Novels

Music

Show categorized results.

FAVORITES

Users can favorite:

Anime

Manga

Bible verses

Novels

Songs

Albums

Create category filters.

HISTORY

Track:

Watched anime

Read manga

Read Bible chapters

Read novels

Played songs

Use localStorage where appropriate.

Do not require server-side tracking for basic functionality.

CONTINUE PLAYING / READING

Create progress tracking.

Anime:

Save:

anime

episode

approximate playback position

Manga:

Save:

manga

chapter

page

Bible:

Save:

book

chapter

Novel:

Save:

book

chapter

Music:

Save:

last played song

Use localStorage for basic client-side progress.

ADMIN DASHBOARD

Create an administrator dashboard.

Admin can manage:

Anime

Add

Edit

Delete

Add episodes

Add video URL

Add cover

Add description

Add genre

Manga

Add

Edit

Delete

Add chapters

Add pages

Bible

Add/edit books

Add chapters

Add verses

Novels

Add

Edit

Delete

Add chapters

Edit text

Music

Add songs

Edit songs

Delete songs

Add album

Add artist

Add album artwork

Add MP3 URL

DATABASE

Structure the application so that content can later be connected to a backend/database.

Models:

Users

Anime

Episodes

Manga

Manga Chapters

Manga Pages

Bible Books

Bible Chapters

Bible Verses

Novels

Novel Chapters

Songs

Albums

Artists

Playlists

Favorites

Watch History

Reading History

Listening History

Do not hardcode the entire application.

Use sample/demo data so the application can be tested immediately.

MEDIA URL ARCHITECTURE

For the first version, allow media to be referenced using URLs.

Examples:

Anime:

/media/anime/example/episode-01.mp4

Music:

/media/music/example-song.mp3

Manga:

/media/manga/example/chapter-01/page-001.jpg

Album artwork:

/media/music/example/cover.jpg

This should make it easy to later connect the site to a storage service.

OFFLINE / STORAGE

Do NOT build a Service Worker-based offline application.

iOS 9 compatibility is more important.

For simple user preferences and progress, use:

localStorage

Examples:

Favorites

Last song

Last anime episode

Reading progress

Theme preference

Font size

Playlists

RESPONSIVE IPAD SUPPORT

Specifically test these layouts:

iPad Landscape

1024 × 768

iPad Portrait

768 × 1024

Make sure:

No horizontal scrolling

Cards fit correctly

Text does not overflow

Buttons are touch-friendly

Player controls fit

Manga pages fit

Bible text is readable

Music player is accessible

Navigation is usable

TOUCH SUPPORT

Do not rely on:

:hover

for important functionality.

Use touch-friendly controls.

Minimum comfortable tap target:

approximately 44px where practical.

Support:

tap

scrolling

swipe where technically safe

Do not make swipe gestures mandatory.

PERFORMANCE

The old iPad has limited memory and processing power.

Therefore:

Compress images

Keep image dimensions reasonable

Avoid loading every image at once

Use pagination or Load More

Avoid giant JavaScript bundles

Avoid unnecessary dependencies

Avoid heavy CSS effects

Avoid complex animations

Avoid background video

Avoid automatic media playback

Do not load all anime, manga, novels, and music data simultaneously if the library becomes large.

BROWSER COMPATIBILITY CHECK

Before considering the application finished, specifically inspect the generated code for modern JavaScript syntax that Safari 9 cannot parse.

Do not leave unsupported syntax in the production bundle.

Verify compatibility for:

iOS 9.3.5 Safari

Safari 9

Modern Safari

Chrome

Firefox

Edge

If a feature cannot work on iOS 9.3.5, create a simpler fallback.

IMPORTANT DEVELOPMENT RULE

Do NOT say:

"Works on iPad"

unless it has specifically been designed for Safari 9 / iOS 9.3.5.

The target is NOT merely a modern iPad.

The target is specifically:

iPad + iOS 9.3.5 + Safari 9

LEGAL CONTENT

The website must be a library/player framework.

Do not include unauthorized copyrighted anime, manga, novels, or music.

Use:

Public-domain material

User-owned content

Licensed content

Administrator-provided content

Legal media URLs

For Bible translations, use a translation whose license permits the intended use.

FINAL UI

Application name:

AniVerse Library

Subtitle:

Anime • Manga • Bible • Novels • Music

The final interface should feel like a polished personal media library.

It should NOT look like a generic dashboard template.

Prioritize:

iOS 9.3.5 compatibility > performance > functionality > visual effects

The final result must be usable on an old iPad, including its native Safari browser.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aniverse-jym.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5076d876-ac9a-4819-b7f3-193a95e689e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
