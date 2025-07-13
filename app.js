import express from "express";
import {
  chromium
} from "playwright";
import cors from "cors";
import axios from "axios";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fakeUa from "fake-useragent";
import {
  FormData
} from "formdata-node";
import dotenv from "dotenv";
import os from "os";
import {
  io
} from "socket.io-client";
import ytSearch from "yt-search";
import pkg from "fast-levenshtein";
const {
  get: levenshtein
} = pkg;
import sharp from "sharp";
import {
  spawn
} from "child_process";
import path from "path";
import {
  NodeVM
} from "vm2";
import {
  CompileFile
} from "ve-compiler";
import {
  createRequire
} from "module";
const require = createRequire(import.meta.url);
import EventEmitter from "events";
import WebSocket from "ws";
import crypto from "crypto";
import pkgWrapper from "axios-cookiejar-support";
const {
  wrapper
} = pkgWrapper;
import {
  CookieJar
} from "tough-cookie";
import TurndownService from "turndown";
import {
  Readable
} from "stream";
dotenv.config();
const config = {
  maxTextLength: 100,
  viewport: {
    width: 1920,
    height: 1080
  },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};
let browser, page;
const utils = {
  async initialize() {
    if (!browser) {
      browser = await chromium.launch({
        headless: true
      });
      const context = await browser.newContext({
        viewport: config.viewport,
        userAgent: config.userAgent
      });
      await context.route("**/*", route => {
        const url = route.request().url();
        if (url.endsWith(".png") || url.endsWith(".jpg") || url.includes("google-analytics")) {
          return route.abort();
        }
        route.continue();
      });
      page = await context.newPage();
      await page.goto("https://www.bratgenerator.com/", {
        waitUntil: "domcontentloaded",
        timeout: 1e4
      });
      try {
        await page.click("#onetrust-accept-btn-handler", {
          timeout: 2e3
        });
      } catch {}
    }
  },
  async generateBrat(text) {
    await page.fill("#textInput", text);
    const overlay = page.locator("#textOverlay");
    return overlay.screenshot({
      timeout: 3e3
    });
  },
  async close() {
    if (browser) await browser.close();
  }
};
const app = express();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Web Scraping API</h1>");
});
app.get("/brat", async (req, res) => {
  try {
    const {
      text: q
    } = req.query;
    if (!q) {
      return res.json({
        name: "HD Bart Generator API",
        message: "Parameter text di perlukan",
        version: "2.1.0",
        runtime: {
          os: os.type(),
          platform: os.platform(),
          architecture: os.arch(),
          cpuCount: os.cpus().length,
          uptime: `${os.uptime()} seconds`,
          memoryUsage: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)} MB used of ${Math.round(os.totalmem() / 1024 / 1024)} MB`
        }
      });
    }
    const imageBuffer = await utils.generateBrat(q);
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Error generating image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});
app.get("/screenshot", async (req, res) => {
  const {
    url
  } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const screenshotBuffer = await page.screenshot();
    await browser.close();
    res.type("image/png").send(screenshotBuffer);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
class MicrosoftBingAutoLogin {
  constructor(bing_account, bing_password) {
    console.log("Initializing auto login for Microsoft Bing ...");
    this.bing_account = bing_account;
    this.bing_password = bing_password;
    this.init();
  }
  async init() {
    this.browser = await chromium.launch();
  }
  async login() {
    const sig = generateRandomString(32);
    const CSRFToken = generateRandomString(8) + "-" + generateRandomString(4) + "-" + generateRandomString(4) + "-" + generateRandomString(4) + "-" + generateRandomString(12);
    const loginUrl = `https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=13&id=264960&wreply=https%3a%2f%2fwww.bing.com%2fsecure%2fPassport.aspx%3fedge_suppress_profile_switch%3d1%26requrl%3dhttps%253a%252f%252fwww.bing.com%252fsearch%253ftoWww%253d1%2526redig%253d9220EACAFFCA40508E4E7BD52023921B%2526q%253dBing%252bAI%2526showconv%253d1%2526wlexpsignin%253d1%26sig=${sig}&wp=MBI_SSL&lc=1028&CSRFToken=${CSRFToken}&aadredir=1`;
    const page = await this.browser.newPage();
    await page.goto(loginUrl);
    const accountInput = await page.$('input[name="loginfmt"]');
    await accountInput.type(this.bing_account);
    const passwordInput = await page.$('input[name="passwd"]');
    await passwordInput.type(this.bing_password);
    const submitButton = await page.$('input[type="submit"]');
    await submitButton.click();
    await page.waitForNavigation();
  }
  async getCookies() {
    const page = await this.browser.newPage();
    await page.goto("https://bing.com/chat");
    const cookies = await page.cookies();
    return cookies;
  }
}
app.get("/login", async (req, res) => {
  const {
    user,
    pass
  } = req.query;
  if (!user || !pass) {
    return res.status(400).send("Missing username or password.");
  }
  try {
    const bingLogin = new MicrosoftBingAutoLogin(user, pass);
    await bingLogin.login();
    const cookies = await bingLogin.getCookies();
    res.json(cookies);
  } catch (error) {
    res.status(500).send("Error during login: " + error.message);
  }
});
app.get("/cookie", async (req, res) => {
  const {
    url
  } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const cookies = await page.context().cookies();
    await browser.close();
    res.json(cookies);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
app.get("/cookie/v2", async (req, res) => {
  const {
    url
  } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const cookies = await page.context().cookies();
    const response = await page.waitForResponse(url);
    const headers = response.headers();
    await browser.close();
    res.json({
      cookies: cookies,
      headers: headers
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/welcome", async (req, res) => {
  const {
    name,
    info,
    desc
  } = req.query;
  if (!name || !info) {
    return res.status(400).json({
      error: "Missing required parameters"
    });
  }
  const html = `
        <!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Course Card UI Design - #094 of #100Days100Projects</title>
  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.2/css/all.min.css'>
  <style>
  @import url('https://fonts.googleapis.com/css?family=Muli&display=swap');

* {
	box-sizing: border-box;
}


body {
	background-image: linear-gradient(45deg, #7175da, #9790F2);
	font-family: 'Muli', sans-serif;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	min-height: 100vh;
	margin: 0;
}

.courses-container {
	
}

.course {
	background-color: #fff;
	border-radius: 10px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
	display: flex;
	max-width: 100%;
	margin: 20px;
	overflow: hidden;
	width: 700px;
}

.course h6 {
	opacity: 0.6;
	margin: 0;
	letter-spacing: 1px;
	text-transform: uppercase;
}

.course h2 {
	letter-spacing: 1px;
	margin: 10px 0;
}

.course-preview {
	background-color: #2A265F;
	color: #fff;
	padding: 30px;
	max-width: 250px;
}

.course-preview a {
	color: #fff;
	display: inline-block;
	font-size: 12px;
	opacity: 0.6;
	margin-top: 30px;
	text-decoration: none;
}

.course-info {
	padding: 30px;
	position: relative;
	width: 100%;
}

.progress-container {
	position: absolute;
	top: 30px;
	right: 30px;
	text-align: right;
	width: 150px;
}

.progress {
	background-color: #ddd;
	border-radius: 3px;
	height: 5px;
	width: 100%;
}

.progress::after {
	border-radius: 3px;
	background-color: #2A265F;
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	height: 5px;
	width: 66%;
}

.progress-text {
	font-size: 10px;
	opacity: 0.6;
	letter-spacing: 1px;
}

.btn {
	background-color: #2A265F;
	border: 0;
	border-radius: 50px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
	color: #fff;
	font-size: 16px;
	padding: 12px 25px;
	position: absolute;
	bottom: 30px;
	right: 30px;
	letter-spacing: 1px;
}

/* SOCIAL PANEL CSS */
.social-panel-container {
	position: fixed;
	right: 0;
	bottom: 80px;
	transform: translateX(100%);
	transition: transform 0.4s ease-in-out;
}

.social-panel-container.visible {
	transform: translateX(-10px);
}

.social-panel {	
	background-color: #fff;
	border-radius: 16px;
	box-shadow: 0 16px 31px -17px rgba(0,31,97,0.6);
	border: 5px solid #001F61;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	font-family: 'Muli';
	position: relative;
	height: 169px;	
	width: 370px;
	max-width: calc(100% - 10px);
}

.social-panel button.close-btn {
	border: 0;
	color: #97A5CE;
	cursor: pointer;
	font-size: 20px;
	position: absolute;
	top: 5px;
	right: 5px;
}

.social-panel button.close-btn:focus {
	outline: none;
}

.social-panel p {
	background-color: #001F61;
	border-radius: 0 0 10px 10px;
	color: #fff;
	font-size: 14px;
	line-height: 18px;
	padding: 2px 17px 6px;
	position: absolute;
	top: 0;
	left: 50%;
	margin: 0;
	transform: translateX(-50%);
	text-align: center;
	width: 235px;
}

.social-panel p i {
	margin: 0 5px;
}

.social-panel p a {
	color: #FF7500;
	text-decoration: none;
}

.social-panel h4 {
	margin: 20px 0;
	color: #97A5CE;	
	font-family: 'Muli';	
	font-size: 14px;	
	line-height: 18px;
	text-transform: uppercase;
}

.social-panel ul {
	display: flex;
	list-style-type: none;
	padding: 0;
	margin: 0;
}

.social-panel ul li {
	margin: 0 10px;
}

.social-panel ul li a {
	border: 1px solid #DCE1F2;
	border-radius: 50%;
	color: #001F61;
	font-size: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 50px;
	width: 50px;
	text-decoration: none;
}

.social-panel ul li a:hover {
	border-color: #FF6A00;
	box-shadow: 0 9px 12px -9px #FF6A00;
}

.floating-btn {
	border-radius: 26.5px;
	background-color: #001F61;
	border: 1px solid #001F61;
	box-shadow: 0 16px 22px -17px #03153B;
	color: #fff;
	cursor: pointer;
	font-size: 16px;
	line-height: 20px;
	padding: 12px 20px;
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 999;
}

.floating-btn:hover {
	background-color: #ffffff;
	color: #001F61;
}

.floating-btn:focus {
	outline: none;
}

.floating-text {
	background-color: #001F61;
	border-radius: 10px 10px 0 0;
	color: #fff;
	font-family: 'Muli';
	padding: 7px 15px;
	position: fixed;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	text-align: center;
	z-index: 998;
}

.floating-text a {
	color: #FF7500;
	text-decoration: none;
}

@media screen and (max-width: 480px) {

	.social-panel-container.visible {
		transform: translateX(0px);
	}
	
	.floating-btn {
		right: 10px;
	}
}
  </style>

</head>
<body>
<!-- partial:index.partial.html -->
<div class="courses-container">
	<div class="course">
		<div class="course-preview">
			<h6>Course</h6>
			<h2>${name}</h2>
			<a href="#">View all chapters <i class="fas fa-chevron-right"></i></a>
		</div>
		<div class="course-info">
			<div class="progress-container">
				<div class="progress"></div>
				<span class="progress-text">
					6/9 Challenges
				</span>
			</div>
			<h6>${info}</h6>
			<h2>${desc}</h2>
			<button class="btn">Continue</button>
		</div>
	</div>
</div>

<!-- SOCIAL PANEL HTML -->
<div class="social-panel-container">
	<div class="social-panel">
		<p>Created with <i class="fa fa-heart"></i> by
			<a target="_blank" href="https://florin-pop.com">Florin Pop</a></p>
		<button class="close-btn"><i class="fas fa-times"></i></button>
		<h4>Get in touch on</h4>
		<ul>
			<li>
				<a href="https://www.patreon.com/florinpop17" target="_blank">
					<i class="fab fa-discord"></i>
				</a>
			</li>
			<li>
				<a href="https://twitter.com/florinpop1705" target="_blank">
					<i class="fab fa-twitter"></i>
				</a>
			</li>
			<li>
				<a href="https://linkedin.com/in/florinpop17" target="_blank">
					<i class="fab fa-linkedin"></i>
				</a>
			</li>
			<li>
				<a href="https://facebook.com/florinpop17" target="_blank">
					<i class="fab fa-facebook"></i>
				</a>
			</li>
			<li>
				<a href="https://instagram.com/florinpop17" target="_blank">
					<i class="fab fa-instagram"></i>
				</a>
			</li>
		</ul>
	</div>
</div>
<button class="floating-btn">
	Get in Touch
</button>

<div class="floating-text">
	Part of <a href="https://florin-pop.com/blog/2019/09/100-days-100-projects" target="_blank">#100Days100Projects</a>
</div>
<!-- partial -->
  <script>
  // INSERT JS HERE


// SOCIAL PANEL JS
const floating_btn = document.querySelector('.floating-btn');
const close_btn = document.querySelector('.close-btn');
const social_panel_container = document.querySelector('.social-panel-container');

floating_btn.addEventListener('click', () => {
	social_panel_container.classList.toggle('visible')
});

close_btn.addEventListener('click', () => {
	social_panel_container.classList.remove('visible')
});
  </script>

</body>
</html>`;
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const buffer = await page.screenshot({
      type: "png"
    });
    await browser.close();
    res.set("Content-Type", "image/png");
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    res.status(500).json({
      error: "Failed to convert HTML to PNG"
    });
  }
});
app.get("/youtube-videos", async (req, res) => {
  const channelName = req.query.name || "YasoobKhalid";
  const url = `https://www.youtube.com/@${channelName}/videos`;
  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.goto(url);
  const channelTitle = "Title" || await page.locator('yt-formatted-string[class*="ytd-channel-name"]').textContent();
  const handle = await page.locator("yt-formatted-string#channel-handle").textContent();
  const subscriberCount = await page.locator("yt-formatted-string#subscriber-count").textContent();
  let lastHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  });
  const WAIT_IN_SECONDS = 5;
  while (true) {
    await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
    await page.waitForTimeout(WAIT_IN_SECONDS * 1e3);
    const newHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight;
    });
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
  const videoData = await page.evaluate(() => {
    const thumbnails = Array.from(document.querySelectorAll("a#thumbnail yt-image img"));
    const views = Array.from(document.querySelectorAll("div#metadata-line span:nth-child(1)"));
    const titles = Array.from(document.querySelectorAll("#video-title"));
    const links = Array.from(document.querySelectorAll("#video-title-link"));
    return titles.map((title, index) => ({
      title: title.textContent.trim(),
      views: views[index]?.textContent.trim(),
      thumbnail: thumbnails[index]?.src,
      link: links[index]?.href
    }));
  });
  await browser.close();
  res.json({
    channelTitle: channelTitle,
    handle: handle,
    subscriberCount: subscriberCount,
    videos: videoData
  });
});
const Patterns = {
  channel: {
    name: /channelMetadataRenderer\":{\"title\":\"(.*?)\"/,
    id: /channelId\":\"(.*?)\"/,
    verified: /"label":"Verified"/,
    check_live: /{"text":"LIVE"}/,
    live: /thumbnailOverlays\":\[(.*?)]/,
    video_id: /videoId\":\"(.*?)\"/,
    uploads: /gridVideoRenderer\":{\"videoId\":\"(.*?)\"/,
    subscribers: /\"subscriberCountText\":{\"accessibility\":(.*?),/,
    views: /viewCountText\":{\"simpleText\":\"(.*?)\"}/,
    creation: /{\"text\":\"Joined \"},{\"text\":\"(.*?)\"}/,
    country: /country\":{\"simpleText\":\"(.*?)\"}/,
    custom_url: /canonicalChannelUrl\":\"(.*?)\"/,
    description: /{\"description\":{\"simpleText\":\"(.*?)\"}/,
    avatar: /height\":88},{\"url\":\"(.*?)\"/,
    banner: /width\":1280,\"height\":351},{\"url\":\"(.*?)\"/,
    playlists: /{\"url\":\"\/playlist\?list=(.*?)\"/,
    video_count: /videoCountText\":{\"runs\":\[{\"text\":(.*?)}\]/,
    socials: /q=https%3A%2F%2F(.*?)\"/,
    upload_ids: /videoId\":\"(.*?)\"/,
    stream_ids: /videoId\":\"(.*?)\"/,
    upload_chunk: /gridVideoRenderer\":{(.*?)\"navigationEndpoint/,
    upload_chunk_fl_1: /simpleText\":\"Streamed/,
    upload_chunk_fl_2: /default_live./,
    upcoming_check: /\"title\":\"Upcoming live streams\"/,
    upcoming: /gridVideoRenderer\":{\"videoId\":\"(.*?)\"/
  },
  video: {
    video_id: /videoId\":\"(.*?)\"/,
    title: /title\":\"(.*?)\"/,
    duration: /approxDurationMs\":\"(.*?)\"/,
    upload_date: /uploadDate\":\"(.*?)\"/,
    author_id: /channelIds\":\[\"(.*?)\"/,
    description: /shortDescription\":\"(.*)\",\"isCrawlable/,
    tags: /<meta name=\"keywords\" content=\"(.*?)\">/,
    is_streamed: /simpleText\":\"Streamed live/,
    is_premiered: /dateText\":{\"simpleText\":\"Premiered/,
    views: /videoViewCountRenderer\":{\"viewCount\":{\"simpleText\":\"(.*?)\"/,
    likes: /toggledText\":{\"accessibility\":{\"accessibilityData\":{\"label\":\"(.*?) /,
    thumbnail: /playerMicroformatRenderer\":{\"thumbnail\":{\"thumbnails\":\[{\"url\":\"(.*?)\"/
  },
  playlist: {
    name: /{\"title\":\"(.*?)\"/,
    video_count: /stats\":\[{\"runs\":\[{\"text\":\"(.*?)\"/,
    video_id: /videoId\":\"(.*?)\"/,
    thumbnail: /og:image\" content=\"(.*?)\?"/
  },
  extra: {
    video_id: /videoId\":\"(.*?)\"/
  },
  query: {
    channel_id: /channelId\":\"(.*?)\"/,
    video_id: /videoId\":\"(.*?)\"/,
    playlist_id: /playlistId\":\"(.*?)\"/
  }
};
const matchPattern = (pattern, data) => {
  const matches = [];
  let match;
  while ((match = pattern.exec(data)) !== null) {
    matches.push(match[1] || match[0]);
  }
  return matches;
};
const fetchChannelData = async channelName => {
  try {
    const url = `https://www.youtube.com/@${channelName}/videos`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error("Error fetching YouTube channel data: " + error.message);
  }
};
app.get("/youtube-info", async (req, res) => {
  const {
    name
  } = req.query;
  if (!name) {
    return res.status(400).json({
      error: "Channel name is required"
    });
  }
  try {
    const data = await fetchChannelData(name);
    const results = {};
    Object.keys(Patterns.channel).forEach(key => {
      const pattern = Patterns.channel[key];
      results[key] = matchPattern(pattern, data);
    });
    res.json({
      channelName: name,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
const playwright = {
  avLang: ["javascript", "python", "java", "csharp"],
  request: async function(language = "javascript", code) {
    if (!this.avLang.includes(language.toLowerCase())) {
      throw new Error(`Language "${language}" is not supported. Choose from available languages: ${this.avLang.join(", ")}`);
    }
    const url = "https://try.playwright.tech/service/control/run";
    const headers = {
      authority: "try.playwright.tech",
      accept: "*/*",
      "content-type": "application/json",
      origin: "https://try.playwright.tech",
      referer: "https://try.playwright.tech/?l=playwright-test",
      "user-agent": "Postify/1.0.0"
    };
    const data = {
      code: code,
      language: language
    };
    try {
      const response = await axios.post(url, data, {
        headers: headers
      });
      const {
        success,
        error,
        version,
        duration,
        output,
        files
      } = response.data;
      return {
        success: success,
        error: error,
        version: version,
        duration: duration,
        output: output,
        files: files
      };
    } catch (error) {
      if (error.response) {
        const {
          success,
          error: errMsg,
          version,
          duration,
          output,
          files
        } = error.response.data;
        return {
          success: success,
          error: errMsg,
          version: version,
          duration: duration,
          output: output,
          files: files
        };
      } else {
        throw new Error(error.message);
      }
    }
  }
};
app.get("/view", async (req, res) => {
  const {
    url,
    count
  } = req.query;
  if (!url || !count) {
    return res.status(400).json({
      error: "Missing required parameters: url and count"
    });
  }
  const language = "javascript";
  const code = `
    const { chromium } = require('playwright');
    (async () => {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const targetUrl = '${url}';

        for (let i = 0; i < ${count}; i++) {
            await page.goto(targetUrl);
            console.log(\`View \${i + 1}: \${targetUrl}\`);
            await page.waitForTimeout(3000);  // Delay for 3 seconds before next view
        }

        await browser.close();
    })();
  `;
  try {
    const data = await playwright.request(language, code);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: error.message
    });
  }
});
const font = "BlueArchive";
const crossBuffer = Buffer.from('<svg width="480" height="200" version="1.1"><polygon points="252,0 159,190 165,190 287,0" style="fill:#fff" /></svg>');
const haloBuffer = Buffer.from('<svg width="480" height="200" version="1.1"><polygon points="252,0 159,190 165,190 287,0" style="fill:#fff" /></svg>');
const splitText = text => {
  if (Array.isArray(text)) return text;
  if (text.includes(" ")) {
    return text.split(" ").filter(i => i.trim());
  } else if (text.match(/^[A-Z][a-z]*[A-Z][a-z]*$/)) {
    return text.replace(/[A-Z]/g, t => " " + t).trim().split(" ");
  } else {
    const h = Math.floor(text.length / 2);
    return [text.substring(0, h), text.substring(h)];
  }
};
const baLogo = async (text, left = 0) => {
  const [head, tail] = splitText(text);
  if (!head || !tail) throw new Error("Invalid input text");
  let width = 32,
    height = 260;
  const top = 208;
  const matrix = [
    [1, -.35],
    [0, 1]
  ];
  const comps = [];
  const headPart = sharp({
    text: {
      font: font,
      text: `<span color="#208ef7" size="144pt">${head}</span>`,
      dpi: 72,
      rgba: true
    }
  }).affine(matrix, {
    background: "#fff0",
    interpolator: sharp.interpolators.nohalo
  }).png();
  const headMeta = await headPart.metadata();
  const w = width + headMeta.width - 162;
  const dl = w < 0 ? 0 : w + left;
  const tailPart = sharp({
    text: {
      font: font,
      text: `<span color="#208ef7" size="144pt">${head}<span color="#2b2b2b" size="144pt">${tail}</span></span>`,
      dpi: 72,
      rgba: true
    }
  }).affine(matrix, {
    background: "#fff0",
    interpolator: sharp.interpolators.nohalo
  }).png();
  const tailMeta = await tailPart.metadata();
  comps.push({
    input: await tailPart.toBuffer(),
    left: width,
    top: top
  });
  comps.push({
    input: crossBuffer,
    left: dl + 4,
    top: 4
  });
  width += (tailMeta.width < 256 ? 256 : tailMeta.width) + 64;
  height += 144;
  if (width < 500) width = 500;
  return sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: "#fff"
    }
  }).composite(comps).png();
};
app.get("/balogo", async (req, res) => {
  try {
    const {
      text,
      text2
    } = req.query;
    if (!text) return res.status(400).send("Text is required");
    const logoImage = await baLogo(text);
    res.set("Content-Type", "image/png");
    res.send(await logoImage.toBuffer());
  } catch (error) {
    res.status(500).send("Error generating logo: " + error.message);
  }
});
async function baLogov2(textL = "蔚蓝", textR = "档案", x = "-15", y = "0", tp = false) {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  await page.goto("https://symbolon.pages.dev/");
  await page.waitForSelector("#canvas");
  await page.fill("#textL", textL);
  await page.fill("#textR", textR);
  await page.fill("#graphX", x);
  await page.fill("#graphY", y);
  await page.waitForTimeout(500);
  const imageBuffer = await page.$eval("#canvas", canvas => {
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const buffer = Buffer.from(imageBuffer, "base64");
  await browser.close();
  return buffer;
}
app.get("/balogo/v2", async (req, res) => {
  try {
    const {
      textL = "蔚蓝",
        textR = "档案",
        x = "-15",
        y = "0",
        tp = "false"
    } = req.query;
    const tpBool = tp === "true";
    const imageBuffer = await baLogov2(textL, textR, x, y, tpBool);
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error generating logo"
    });
  }
});
async function baLogov3(textL = "蔚蓝", textR = "档案") {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  await page.goto("https://appleneko2001-bluearchive-logo.vercel.app/");
  try {
    await page.waitForSelector("#canvas", {
      timeout: 3e4
    });
  } catch (err) {
    console.error("Canvas tidak ditemukan:", err);
  }
  try {
    await page.waitForSelector("#textL", {
      state: "visible",
      timeout: 1e4
    });
    await page.fill("#textL", textL);
  } catch (err) {
    console.error("Elemen #textL gagal diisi:", err);
  }
  try {
    await page.waitForSelector("#textR", {
      state: "visible",
      timeout: 1e4
    });
    await page.fill("#textR", textR);
  } catch (err) {
    console.error("Elemen #textR gagal diisi:", err);
  }
  await page.waitForTimeout(2e3);
  const imageBuffer = await page.$eval("#canvas", canvas => {
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const buffer = Buffer.from(imageBuffer, "base64");
  await browser.close();
  return buffer;
}
app.get("/balogo/v3", async (req, res) => {
  try {
    const {
      textL = "蔚蓝",
        textR = "档案"
    } = req.query;
    const imageBuffer = await baLogov3(textL, textR);
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error generating logo"
    });
  }
});
async function baLogov4(textL = "蔚蓝", textR = "档案") {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  await page.goto("https://ba.api.hli.icu/");
  try {
    await page.waitForSelector("#canvas", {
      timeout: 3e4
    });
  } catch (err) {
    console.error("Canvas tidak ditemukan:", err);
  }
  try {
    await page.waitForSelector("#textL", {
      state: "visible",
      timeout: 1e4
    });
    await page.fill("#textL", textL);
  } catch (err) {
    console.error("Elemen #textL gagal diisi:", err);
  }
  try {
    await page.waitForSelector("#textR", {
      state: "visible",
      timeout: 1e4
    });
    await page.fill("#textR", textR);
  } catch (err) {
    console.error("Elemen #textR gagal diisi:", err);
  }
  await page.waitForTimeout(500);
  const imageBuffer = await page.$eval("#canvas", canvas => {
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const buffer = Buffer.from(imageBuffer, "base64");
  await browser.close();
  return buffer;
}
app.get("/balogo/v4", async (req, res) => {
  try {
    const {
      textL = "蔚蓝",
        textR = "档案"
    } = req.query;
    const imageBuffer = await baLogov4(textL, textR);
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error generating logo"
    });
  }
});
app.get("/rayso", async (req, res) => {
  const {
    code,
    title = "app.js",
    theme = "supabase",
    language = "",
    darkMode = "true",
    background = "false"
  } = req.query;
  if (!code) return res.status(400).json({
    error: 'Parameter "code" (Base64 encoded) diperlukan'
  });
  try {
    const encodedCode = code.toString("base64");
    const url = `https://www.ray.so/#code=${encodedCode}&title=${title}&theme=${theme}&language=${language}&background=${background}&darkMode=${darkMode}`;
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForSelector(".Frame_frame__rcr69");
    const elementHandle = await page.$(".Frame_frame__rcr69");
    const screenshotBuffer = await elementHandle.screenshot({
      fullPage: true
    });
    await browser.close();
    res.setHeader("Content-Type", "image/png");
    return res.status(200).end(screenshotBuffer);
  } catch (error) {
    return res.status(500).json({
      error: "Gagal mengambil screenshot",
      details: error.message
    });
  }
});
app.get("/carbon", async (req, res) => {
  const {
    code,
    theme
  } = req.query;
  if (!code) return res.status(400).json({
    error: 'Parameter "code" diperlukan.'
  });
  if (!theme) return res.status(400).json({
    error: 'Parameter "theme" diperlukan.'
  });
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      acceptDownloads: true
    });
    const page = await context.newPage();
    await page.goto("https://carbon.now.sh/");
    await page.click('input[aria-labelledby="theme-dropdown"]');
    await page.keyboard.type(theme);
    await page.keyboard.press("Enter");
    await page.click('pre.CodeMirror-line span[role="presentation"]');
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(code);
    await page.waitForSelector('button[data-cy="quick-export-button"]');
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('button[data-cy="quick-export-button"]')]);
    const downloadPath = await download.path();
    res.setHeader("Content-Type", "application/octet-stream");
    return res.status(200).sendFile(downloadPath);
  } catch (error) {
    return res.status(500).json({
      error: "Gagal memproses permintaan.",
      details: error.message
    });
  } finally {
    await browser.close();
  }
});
app.get("/recoded", async (req, res) => {
  const {
    code,
    colors,
    font,
    lang,
    bg
  } = req.query;
  if (!code) return res.status(400).json({
    error: 'Parameter "code" diperlukan.'
  });
  if (!colors) return res.status(400).json({
    error: 'Parameter "colors" diperlukan.'
  });
  if (!font) return res.status(400).json({
    error: 'Parameter "font" diperlukan.'
  });
  if (!lang) return res.status(400).json({
    error: 'Parameter "lang" diperlukan.'
  });
  if (!bg) return res.status(400).json({
    error: 'Parameter "bg" diperlukan.'
  });
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      acceptDownloads: true
    });
    const page = await context.newPage();
    await page.goto("https://recoded.netlify.app/");
    await page.fill("textarea.npm__react-simple-code-editor__textarea", code);
    await page.click('div.input-box[style*="120px"]:has-text("VS Code Dark")');
    await page.keyboard.type(colors);
    await page.keyboard.press("Enter");
    await page.click('div[data-testid="font-select"]');
    await page.keyboard.type(font);
    await page.keyboard.press("Enter");
    await page.click('div[data-testid="language-select"]');
    await page.keyboard.type(lang);
    await page.keyboard.press("Enter");
    await page.click('div[data-testid="background-color-select"]');
    await page.keyboard.type(bg);
    await page.keyboard.press("Enter");
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("button.button.export")]);
    const downloadPath = await download.path();
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(downloadPath);
  } catch (error) {
    return res.status(500).json({
      error: "Gagal memproses permintaan.",
      details: error.message
    });
  } finally {
    await browser.close();
  }
});
app.get("/chalkist", async (req, res) => {
  const {
    code,
    title
  } = req.query;
  if (!code) return res.status(400).json({
    error: 'Parameter "code" diperlukan.'
  });
  if (!title) return res.status(400).json({
    error: 'Parameter "title" diperlukan.'
  });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    await page.goto("https://chalk.ist/");
    const titleSelector = 'div[data-placeholder="Untitled..."]';
    await page.focus(titleSelector);
    await page.keyboard.type(title);
    const codeSelector = "textarea.editor.font-config";
    await page.fill(codeSelector, code);
    const screenshotSelector = "div[data-editor-frame]";
    await page.waitForSelector(screenshotSelector);
    const element = await page.$(screenshotSelector);
    const screenshotBuffer = await element.screenshot();
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(screenshotBuffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Gagal memproses permintaan.",
      details: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});
app.get("/brat/v2", async (req, res) => {
  const {
    text
  } = req.query;
  if (!text) return res.status(400).json({
    error: 'Parameter "text" diperlukan.'
  });
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      acceptDownloads: true
    });
    const page = await context.newPage();
    await page.goto("https://brat-generator.net/");
    await page.fill('input[class="w-full p-3 text-base border border-gray-200 rounded-lg mb-5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"]', text);
    try {
      await page.waitForSelector('button[class="px-5 py-3 text-sm font-medium rounded-lg flex items-center justify-between flex-1 transition-all bg-white border-2 border-blue-500 text-blue-600"]', {
        visible: true
      });
      await page.click('button[class="px-5 py-3 text-sm font-medium rounded-lg flex items-center justify-between flex-1 transition-all bg-white border-2 border-blue-500 text-blue-600"]');
    } catch (error) {
      console.log("Tombol 'White Background' tidak ditemukan atau tidak terlihat, melewati langkah ini.");
    }
    try {
      await page.waitForSelector('button[class="w-full mt-5 px-5 py-3 text-sm font-medium rounded-lg transition-all bg-blue-500 text-white hover:bg-blue-600"]', {
        visible: true
      });
      await page.click('button[class="w-full mt-5 px-5 py-3 text-sm font-medium rounded-lg transition-all bg-blue-500 text-white hover:bg-blue-600"]');
    } catch (error) {
      console.log("Tombol 'Download Image' tidak ditemukan atau tidak terlihat, melewati langkah ini.");
    }
    await page.waitForSelector('canvas[class="absolute top-0 left-0 w-full h-full bg-white shadow-inner"]', {
      visible: true
    });
    await page.waitForTimeout(800);
    const canvas = await page.$('canvas[class="absolute top-0 left-0 w-full h-full bg-white shadow-inner"]');
    const screenshot = await canvas.screenshot();
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(screenshot);
  } catch (error) {
    return res.status(500).json({
      error: "Gagal memproses permintaan.",
      details: error.message
    });
  } finally {
    await browser.close();
  }
});
const getRandomName = () => {
  const names = ["wudy", "andi", "budi", "citra", "dina"];
  return names[Math.floor(Math.random() * names.length)];
};
const getRandomClass = () => {
  const classes = ["A", "B", "C", "D"];
  return classes[Math.floor(Math.random() * classes.length)];
};
const getRandomText = () => {
  const texts = ["halo", "selamat pagi", "apa kabar?", "siang", "malam"];
  return texts[Math.floor(Math.random() * texts.length)];
};
const getRandomType = () => {
  return Math.floor(Math.random() * 14) + 1;
};
const getRandomDay = () => {
  const days = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
  return days[Math.floor(Math.random() * days.length)];
};
const getRandomYear = () => {
  const currentYear = new Date().getFullYear();
  return Math.floor(Math.random() * (currentYear - 2e3 + 1)) + 2e3;
};
app.get("/nulis", async (req, res) => {
  try {
    const {
      waktu = getRandomYear().toString(),
        hari = getRandomDay().toString(),
        nama = getRandomName().toString(),
        kelas = getRandomClass().toString(),
        text = getRandomText().toString(),
        type = getRandomType().toString()
    } = req.query;
    const diNama3 = nama;
    const diKelas3 = kelas;
    const diTulis9 = text;
    const panjangKalimat9 = diTulis9.replace(/(\S+\s*){1,10}/g, "$&\n");
    const panjangNama3 = diNama3.replace(/(\S+\s*){1,10}/g, "$&\n");
    const panjangKelas3 = diKelas3.replace(/(\S+\s*){1,10}/g, "$&\n");
    const panjangBaris9 = panjangKalimat9.split("\n").slice(0, 30).join("\n");
    const panjangBarisNama3 = panjangNama3.split("\n").slice(0, 30).join("\n");
    const panjangBarisKelas3 = panjangKelas3.split("\n").slice(0, 30).join("\n");
    const months = ["- 1 -", "- 2 -", "- 3 -", "- 4 -", "- 5 -", "- 6 -", "- 7 -", "- 8 -", "- 9 -", "- 10 -", "- 11 -", "- 12 -"];
    const myDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const thisDay = myDays[date.getDay()];
    const year = date.getFullYear();
    const waktu6 = `${day} ${months[month]} ${year}`;
    const hari6 = thisDay;
    const inputImagePath = path.join(process.cwd(), "magernulis1.jpg");
    const fontPath = path.join(process.cwd(), "Zahraaa.ttf");
    let theme = null;
    if (type === "1") {
      theme = [inputImagePath, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari6, "-annotate", "+806+102", waktu6, "-annotate", "+360+100", panjangBarisNama3, "-annotate", "+360+120", panjangBarisKelas3, "-annotate", "+344+142", panjangBaris9, "png:-"];
    }
    if (type === "2") {
      theme = [inputImagePath, "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangBaris9, "png:-"];
    }
    if (type === "3") {
      theme = [inputImagePath, "-fill", "#001675", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "4") {
      theme = [inputImagePath, "-fill", "#8c1a00", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "5") {
      theme = [inputImagePath, "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "6") {
      theme = [inputImagePath, "-fill", "#001675", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-fill", "#001675", "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-fill", "#001675", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "7") {
      theme = [inputImagePath, "-fill", "#8c1a00", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-fill", "#8c1a00", "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-fill", "#8c1a00", "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "8") {
      theme = [inputImagePath, "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+100", nama, "-font", fontPath, "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+120", kelas, "-font", fontPath, "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "9") {
      theme = [inputImagePath, "-font", fontPath, "-fill", "#001675", "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-font", fontPath, "-fill", "#001675", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-font", fontPath, "-fill", "#001675", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+100", nama, "-font", fontPath, "-fill", "#001675", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+120", kelas, "-font", fontPath, "-fill", "#001675", "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    if (type === "10") {
      theme = [inputImagePath, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "1", "-annotate", "+806+78", hari, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+806+102", waktu, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+100", nama, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "18", "-interline-spacing", "1", "-annotate", "+360+120", kelas, "-font", fontPath, "-fill", "#8c1a00", "-size", "1024x784", "-pointsize", "20", "-interline-spacing", "-7.5", "-annotate", "+344+142", panjangKalimat9, "png:-"];
    }
    const splitText = text.replace(/(\S+\s*){1,9}/g, "$&\n");
    const fixHeight = splitText.split("\n").slice(0, 31).join("\n");
    const sebelumkiri = path.join(process.cwd(), "sebelumkiri.jpg");
    const sebelumkanan = path.join(process.cwd(), "sebelumkanan.jpg");
    const foliokanan = path.join(process.cwd(), "foliokanan.jpg");
    const foliokiri = path.join(process.cwd(), "foliokiri.jpg");
    const fontPathB = path.join(process.cwd(), "Indie-Flower.ttf");
    if (type === "11") {
      theme = [sebelumkiri, "-font", fontPathB, "-size", "960x1280", "-pointsize", "22", "-interline-spacing", "2", "-annotate", "+140+153", fixHeight, "png:-"];
    }
    if (type === "12") {
      theme = [sebelumkanan, "-font", fontPathB, "-size", "960x1280", "-pointsize", "23", "-interline-spacing", "2", "-annotate", "+128+129", fixHeight, "png:-"];
    }
    if (type === "13") {
      theme = [foliokanan, "-font", fontPathB, "-size", "960x1280", "-pointsize", "23", "-interline-spacing", "3", "-annotate", "+89+190", fixHeight, "png:-"];
    }
    if (type === "14") {
      theme = [foliokiri, "-font", fontPathB, "-size", "1720x1280", "-pointsize", "23", "-interline-spacing", "4", "-annotate", "+48+185", fixHeight, "png:-"];
    }
    const convert = spawn("convert", theme);
    const collectImageData = () => {
      return new Promise((resolve, reject) => {
        let imageData = Buffer.alloc(0);
        convert.stdout.on("data", data => {
          imageData = Buffer.concat([imageData, data]);
        });
        convert.on("close", code => {
          if (code !== 0) {
            return reject(new Error(`ImageMagick exited with code ${code}`));
          }
          resolve(imageData);
        });
        convert.on("error", err => {
          reject(err);
        });
      });
    };
    const imageData = await collectImageData();
    res.set("Content-Type", "image/png");
    res.send(imageData);
    convert.kill("SIGTERM");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Terjadi kesalahan server."
    });
  }
});
Readable.fromEventEmitter = function(emitter, events) {
  const readable = new Readable({
    read() {}
  });
  const onData = data => {
    readable.push(data);
  };
  const onEnd = () => {
    readable.push(null);
  };
  const onError = err => {
    readable.emit("error", err);
  };
  emitter.on(events[0], onData);
  emitter.on(events[1], onEnd);
  emitter.on(events[2], onError);
  return readable;
};
const iask = {
  turndownService: new TurndownService(),
  request(query, mode, options) {
    if (typeof query === "object") {
      return query;
    }
    return {
      q: query,
      mode: mode,
      ...options
    };
  },
  eventx(query) {
    const pipe = new EventEmitter();
    const getQueryString = () => {
      const params = new URLSearchParams(query);
      return params.toString();
    };
    return {
      query: query,
      pipe: pipe,
      getQueryString: getQueryString
    };
  },
  parseChunk(message) {
    try {
      const data = JSON.parse(message);
      const diff = data.pop();
      let content = "";
      let stop = false;
      if (diff?.e?.[0]?.[1]?.data) {
        content = diff.e[0][1].data.replace(/<br\/>/g, "\n");
        console.log(content);
      }
      if (diff?.response?.rendered?.[2]?.[1]?.[4]?.[4]) {
        content = this.turndownService.turndown(diff.response.rendered[2][1][4][4]);
        stop = true;
        console.log(content);
      }
      return {
        content: content,
        stop: stop
      };
    } catch (error) {
      console.error(error);
      return {
        content: "",
        stop: true
      };
    }
  },
  inspect(response) {
    const $ = cheerio.load(response.data);
    const phxElement = $('[id^="phx-"]').first();
    const joinMessage = JSON.stringify([null, null, `lv:${phxElement.attr("id")}`, "phx_join", {
      url: response.request.res.responseUrl,
      session: phxElement.attr("data-phx-session")
    }]);
    const csrfToken = $('meta[name="csrf-token"]').attr("content");
    return {
      joinMessage: joinMessage,
      csrfToken: csrfToken
    };
  },
  async cws(queryString, jar) {
    const client = wrapper(axios.create({
      jar: jar
    }));
    try {
      const response = await client.get(`https://iask.ai?${queryString}`);
      const {
        joinMessage,
        csrfToken
      } = this.inspect(response);
      const cookies = await jar.getCookieString("https://iask.ai");
      console.log(cookies);
      const ws = new WebSocket(`wss://iask.ai/live/websocket?_csrf_token=${csrfToken}&vsn=2.0.0`, {
        headers: {
          Cookie: cookies
        }
      });
      await new Promise((resolve, reject) => {
        ws.on("open", () => {
          console.log("Websocket berhasil terhubung...");
          ws.send(joinMessage);
          resolve();
        });
        ws.on("error", err => {
          console.error("Tidak dapat terhubung ke WebSocket:", err);
          reject(err);
        });
      });
      return ws;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  async handleJoin(event) {
    try {
      const jar = new CookieJar();
      const ws = await this.cws(event.getQueryString(), jar);
      const pipe = event.pipe;
      ws.on("message", message => {
        console.log(message.toString());
        const {
          content,
          stop
        } = this.parseChunk(message.toString());
        if (content !== "") {
          pipe.emit("data", content);
        }
        if (stop) {
          pipe.emit("end");
          ws.close();
        }
      });
      ws.on("close", () => {
        console.log("Websocket terputus...");
        pipe.emit("end");
      });
      ws.on("error", err => {
        console.error(err);
        pipe.emit("error", err);
      });
    } catch (error) {
      console.error(error);
      event.pipe.emit("error", error);
    }
  },
  dispatcher: new EventEmitter(),
  setupDispatcher() {
    this.dispatcher.on("JoinEvent", event => this.handleJoin(event));
  },
  ask: async (query, mode = "question", options = {}) => {
    const summon = iask.request(query, mode, options);
    const event = iask.eventx(summon);
    iask.dispatcher.emit("JoinEvent", event);
    return Readable.fromEventEmitter(event.pipe, ["data", "end", "error"]);
  },
  init() {
    this.setupDispatcher();
  }
};
async function Ask(query, mode = "question", options = {
  detail_level: "detailed"
}) {
  try {
    iask.init();
    const stream = await iask.ask(query, mode, options);
    return new Promise((resolve, reject) => {
      let result = "";
      stream.on("data", chunk => {
        result += chunk;
      });
      stream.on("end", () => {
        console.log("Permintaan ke Websocket iASK berhasil..");
        console.log("Result:", result);
        resolve({
          result: result
        });
      });
      stream.on("error", err => {
        console.error(err);
        reject({
          err: err
        });
      });
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
app.post("/ask", async (req, res) => {
  const {
    query,
    mode = "question",
    ...options
  } = req.body;
  if (!query) {
    return res.status(400).json({
      error: "Query parameter is required"
    });
  }
  try {
    const result = await Ask(query, mode, options);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to handle the query"
    });
  }
});
app.get("/ask", async (req, res) => {
  const {
    query,
    mode = "question",
    ...options
  } = req.query;
  if (!query) {
    return res.status(400).json({
      error: "Query parameter is required"
    });
  }
  try {
    const result = await Ask(query, mode, options);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to handle the query"
    });
  }
});
app.post("/playwright", async (req, res) => {
  const {
    code,
    timeout = 3e5
  } = req.body;
  if (!code) return res.status(400).json({
    error: "Kode tidak boleh kosong"
  });
  let output = [];
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ");
    output.push(message);
    originalLog.apply(console, args);
  };
  const vm = new NodeVM({
    console: "inherit",
    sandbox: {},
    require: {
      external: true,
      builtin: ["fs", "path"],
      root: "./",
      mock: {
        playwright: {
          chromium: chromium
        }
      }
    }
  });
  const script = `
    module.exports = async () => {
      ${code}
    };
  `;
  let runCode;
  try {
    runCode = vm.run(script, "sandbox.js");
  } catch (error) {
    console.log = originalLog;
    return res.status(500).json({
      error: "Gagal menjalankan kode",
      details: error.message
    });
  }
  try {
    await runCode();
    const startTime = Date.now();
    while (output.length === 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1e3));
    }
    const result = output.length > 0 ? output.pop() : "Tidak ada hasil yang ditemukan.";
    console.log = originalLog;
    res.json({
      output: result
    });
  } catch (err) {
    console.log = originalLog;
    res.status(500).json({
      error: "Kesalahan saat menjalankan kode",
      details: err.message
    });
  }
});
app.post("/playwright/v2", async (req, res) => {
  const {
    code,
    timeout = 3e5
  } = req.body;
  if (!code) return res.status(400).json({
    error: "Kode tidak boleh kosong"
  });
  let output = [];
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ");
    output.push(message);
    originalLog.apply(console, args);
  };
  let runCode;
  try {
    runCode = eval(`
      (async () => {
        ${code}
      })();
    `);
  } catch (error) {
    console.log = originalLog;
    return res.status(500).json({
      error: "Gagal menjalankan kode",
      details: error.message
    });
  }
  try {
    await runCode;
    const startTime = Date.now();
    while (output.length === 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1e3));
    }
    const result = output.length > 0 ? output.pop() : "Tidak ada hasil yang ditemukan.";
    console.log = originalLog;
    res.json({
      output: result
    });
  } catch (err) {
    console.log = originalLog;
    res.status(500).json({
      error: "Kesalahan saat menjalankan kode",
      details: err.message
    });
  }
});
app.post("/compile", async (req, res) => {
  const {
    code,
    language
  } = req.body;
  try {
    const output = await CompileFile(language, code);
    const stdout = output.stdout || "";
    res.json({
      output: stdout
    });
  } catch (error) {
    res.status(500).json({
      error: error.toString()
    });
  }
});
class ColorifyAI {
  constructor() {
    this.ws = null;
    this.sessionHash = this.generateHash();
  }
  generateHash() {
    return crypto.randomBytes(8).toString("hex");
  }
  async imageToBase64(imageUrl = "https://i.pinimg.com/236x/21/81/c4/2181c4e2d51db79bb2ac000dcac2df90.jpg") {
    try {
      const res = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });
      return `data:image/webp;base64,${Buffer.from(res.data).toString("base64")}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  }
  async start(options) {
    return new Promise((resolve, reject) => {
      let wsUrl = "";
      if (options.type === "img2color") {
        wsUrl = "wss://colorifyai.art/demo-auto-coloring/queue/join";
      } else if (options.type === "txt2img") {
        wsUrl = "wss://colorifyai.art/demo-colorify-text2img/queue/join";
      } else if (options.type === "img2img") {
        wsUrl = "wss://colorifyai.art/demo-colorify-img2img/queue/join";
      } else {
        return reject(new Error("Invalid type. Use 'img2color', 'txt2img', or 'img2img'."));
      }
      this.ws = new WebSocket(wsUrl, {
        headers: {
          Upgrade: "websocket",
          Origin: "https://colorifyai.art",
          "Cache-Control": "no-cache",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          Pragma: "no-cache",
          Connection: "Upgrade",
          "Sec-WebSocket-Key": crypto.randomBytes(16).toString("base64"),
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          "Sec-WebSocket-Version": "13",
          "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
          Accept: "application/json, text/plain, */*",
          Referer: "https://colorifyai.art"
        }
      });
      this.ws.on("open", () => {
        console.log("Connected to WebSocket, waiting for send_hash...");
      });
      this.ws.on("message", async data => {
        const response = JSON.parse(data.toString());
        if (response.msg === "send_hash") {
          console.log("Sending session_hash...");
          this.ws.send(JSON.stringify({
            session_hash: this.sessionHash
          }));
        }
        if (response.msg === "send_data") {
          console.log("Sending data...");
          try {
            let requestData = {};
            if (options.type === "img2color" || options.type === "img2img") {
              const base64Image = await this.imageToBase64(options.imageUrl);
              requestData = {
                data: {
                  source_image: base64Image,
                  prompt: options.prompt || "(masterpiece), best quality",
                  request_from: 10
                }
              };
            } else {
              requestData = {
                data: {
                  prompt: options.prompt,
                  style: options.style || "default",
                  aspect_ratio: options.aspectRatio || "9:16",
                  request_from: 10
                }
              };
            }
            this.ws.send(JSON.stringify(requestData));
          } catch (err) {
            reject(err);
          }
        }
        if (response.msg === "process_completed") {
          console.log("Process completed:", response);
          resolve({
            baseUrl: "https://temp.colorifyai.art",
            ...typeof response.output === "object" && response.output !== null ? response.output : {}
          });
          this.ws.close();
        }
      });
      this.ws.on("error", error => {
        console.error("WebSocket Error:", error);
        reject(error);
      });
      this.ws.on("close", () => {
        console.log("WebSocket closed");
      });
    });
  }
}
app.post("/colorifyai", async (req, res) => {
  const params = req.body;
  const validTypes = ["img2color", "txt2img", "img2img"];
  if (!params.type || !validTypes.includes(params.type.toLowerCase())) {
    return res.status(400).json({
      error: "Invalid type. Allowed types: img2color, txt2img, img2img"
    });
  }
  const ai = new ColorifyAI();
  try {
    const data = await ai.start(params);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error during WebSocket request",
      details: error.message
    });
  }
});
app.get("/colorifyai", async (req, res) => {
  const params = req.query;
  const validTypes = ["img2color", "txt2img", "img2img"];
  if (!params.type || !validTypes.includes(params.type.toLowerCase())) {
    return res.status(400).json({
      error: "Invalid type. Allowed types: img2color, txt2img, img2img"
    });
  }
  const ai = new ColorifyAI();
  try {
    const data = await ai.start(params);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error during WebSocket request",
      details: error.message
    });
  }
});
app.get("/mediafire", async (req, res) => {
  const {
    url
  } = req.query;
  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required"
    });
  }
  try {
    const downloadInfo = await mediafire(url);
    return res.json(downloadInfo);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
async function mediafire(url) {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Linux; Android 6.0; iris50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36"
  });
  const page = await context.newPage();
  try {
    await page.goto(url);
    let downloadInfo = await page.evaluate(() => {
      const fileNameElement = document.querySelector(".dl-btn-label");
      const fileName = fileNameElement ? fileNameElement.textContent.trim() : "";
      const downloadLinkElement = document.querySelector("#downloadButton");
      const downloadLink = downloadLinkElement ? downloadLinkElement.href : "";
      const fileSizeText = downloadLinkElement ? downloadLinkElement.textContent : "";
      const sizeMatch = fileSizeText.match(/\(([^)]+)\)/);
      const fileSize = sizeMatch ? sizeMatch[1] : "";
      const metaTags = Array.from(document.querySelectorAll("meta")).reduce((acc, meta) => {
        const name = meta.getAttribute("name") || meta.getAttribute("property");
        const content = meta.getAttribute("content");
        if (name && content) acc[name.split(":")[1]] = content;
        return acc;
      }, {});
      return {
        fileName: fileName,
        downloadLink: downloadLink,
        fileSize: fileSize,
        meta: metaTags
      };
    });
    if (!downloadInfo.downloadLink.startsWith("https://down")) {
      await browser.close();
      const newBrowser = await chromium.launch({
        headless: true
      });
      const newContext = await newBrowser.newContext({
        userAgent: "Mozilla/5.0 (Linux; Android 6.0; iris50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36"
      });
      const newPage = await newContext.newPage();
      await newPage.goto(downloadInfo.downloadLink);
      const updatedInfo = await newPage.evaluate(() => {
        const downloadLink = document.querySelector("#downloadButton")?.href || "";
        return {
          downloadLink: downloadLink
        };
      });
      downloadInfo.downloadLink = updatedInfo.downloadLink;
      await newBrowser.close();
    }
    return downloadInfo;
  } catch (error) {
    console.error("Error:", error.message);
    return {
      success: false,
      message: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
app.get("/ytdl", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Parameter "id" is required.');
  }
  try {
    const response = await fetch(`https://api.allorigins.win/raw?url=https://ytdlp.online/stream?command=https://www.youtube.com/watch?v=${id} --get-url`, {
      timeout: 1e3,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const responseText = await response.text();
    const urls = responseText.split("\n").filter(line => line.trim().startsWith("data:")).map(line => line.substring(5).trim()).filter(url => url.startsWith("http"));
    res.json({
      data: urls
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong while processing the request.");
  }
});
app.get("/ytdl/v1", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({
      error: 'Parameter "id" is required.'
    });
  }
  try {
    const response = await fetch(`https://api.allorigins.win/raw?url=https://ytdlp.online/stream?command=https://www.youtube.com/watch?v=${id} -j`, {
      timeout: 1e3,
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const responseText = await response.text();
    const parsedData = responseText.split("\n").map(line => line.trim().substring(5).trim()).filter(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    }).map(line => JSON.parse(line));
    if (parsedData.length === 0) {
      return res.status(404).json({
        error: "No valid data found."
      });
    }
    res.json({
      data: parsedData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong while processing the request."
    });
  }
});
app.get("/ytdl/v2", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({
      error: 'Parameter "id" is required.'
    });
  }
  try {
    const response = await fetch(`https://api.allorigins.win/raw?url=https://ytdlp.online/stream?command=https://www.youtube.com/watch?v=${id}`, {
      timeout: 1e3,
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const responseText = await response.text();
    const lastLine = responseText.split("\n").map(line => line.trim().substring(5).trim()).filter(Boolean);
    const extractDownloadLinks = data => {
      return [...new Set(data.flatMap(item => {
        const $ = cheerio.load(item);
        return $("a[href^='/download/']").map((_, el) => "https://ytdlp.online" + $(el).attr("href")).get();
      }))];
    };
    if (!lastLine) return res.status(404).json({
      error: "No valid data found."
    });
    res.json({
      data: extractDownloadLinks(lastLine)[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong while processing the request."
    });
  }
});
app.get("/ytdl/search", async (req, res) => {
  const {
    query,
    limit = 5
  } = req.query;
  if (!query) return res.status(400).json({
    error: 'Parameter "query" is required.'
  });
  try {
    const result = await ytSearch(query);
    if (!result.videos || result.videos.length === 0) {
      return res.status(404).json({
        error: "No results found."
      });
    }
    const cos = levenshtein;
    const videosWithSimilarity = result.videos.map(video => {
      const videoId = video.url.split("v=")[1];
      return {
        id: videoId,
        title: video.title,
        url: video.url,
        duration: video.timestamp,
        views: video.views,
        uploaded: video.ago,
        author: video.author.name,
        similarity: 1 - cos(query, video.title) / Math.max(query.length, video.title.length)
      };
    });
    const sortedVideos = videosWithSimilarity.sort((a, b) => b.similarity - a.similarity).sort((a, b) => b.views - a.views);
    const topVideos = sortedVideos.slice(0, parseInt(limit));
    res.json({
      query: query,
      limit: parseInt(limit),
      videos: topVideos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch YouTube search results."
    });
  }
});
app.get("/ace", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Parameter "id" is required.');
  }
  try {
    const apiUrl = `https://www.acethinker.com/downloader/api/video_info.php?url=https://www.youtube.com/watch?v=${id}&israpid=1&ismp3=0`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("AceThinker API request failed");
    const processedData = await response.json();
    res.json(processedData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong while processing the request.");
  }
});
const genSpinner = () => Math.random().toString(36).substring(2, 10);
app.get("/y232", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send('Parameter "id" is required.');
  }
  try {
    const spinnerid = genSpinner();
    const socket = io("https://api.y232.live");
    const data = {
      url: `https://www.youtube.com/watch?v=${id}`,
      spinnerid: spinnerid,
      method: "streams"
    };
    socket.emit("getInfoEvent", data);
    socket.on("done", response => {
      res.status(200).send(response);
      socket.close();
    });
    socket.on("error", err => {
      res.status(500).send({
        success: false,
        error: err.message
      });
      socket.close();
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong while processing the request.");
  }
});
class Luluvdo {
  async download(url, output = "json") {
    try {
      console.log(`[LOG] Memulai proses untuk URL: ${url}`);
      const idMatch = url.match(/(?:\/[de])\/([a-zA-Z0-9_-]+)/);
      const id = idMatch?.[1];
      if (!id) throw new Error("Invalid URL: ID not found");
      const client = axios.create({
        headers: {
          "User-Agent": fakeUa()
        },
        withCredentials: true
      });
      console.log(`[LOG] Mengambil form dari halaman: https://luluvdo.com/d/${id}_h`);
      let formResult;
      do {
        const {
          data: pageData
        } = await client.get(`https://luluvdo.com/d/${id}_h`);
        const $ = cheerio.load(pageData);
        formResult = new FormData();
        $("form#F1 input").each((_, el) => {
          const name = $(el).attr("name");
          const value = $(el).val();
          if (name && value) formResult.append(name, value);
        });
        console.log(`[LOG] Form yang diambil: ${JSON.stringify(formResult, null, 2)}`);
        if (!formResult.has("hash")) {
          console.log("[LOG] Form tidak valid, mencoba lagi...");
          await new Promise(resolve => setTimeout(resolve, 2e3));
        }
      } while (!formResult.has("hash"));
      console.log("[LOG] Form berhasil diambil, mengirimkan permintaan untuk mendapatkan link unduhan");
      let result;
      do {
        const {
          data: postData
        } = await client.post(`https://luluvdo.com/d/${id}_h`, formResult);
        const $$ = cheerio.load(postData);
        result = {
          size: $$("table tr:nth-child(1) td:nth-child(2)").text().trim() || "N/A",
          bytes: $$("table tr:nth-child(2) td:nth-child(2)").text().trim() || "N/A",
          ip: $$("table tr:nth-child(3) td:nth-child(2)").text().trim() || "N/A",
          link: $$("a.btn.btn-gradient.submit-btn").attr("href") || "N/A",
          expired: $$("div.text-center.text-danger").text().trim() || "N/A"
        };
        console.log(`[LOG] Hasil: ${JSON.stringify(result, null, 2)}`);
        if (result.link === "N/A") {
          console.log("[LOG] Link unduhan belum tersedia, mencoba lagi...");
          await new Promise(resolve => setTimeout(resolve, 2e3));
        }
      } while (result.link === "N/A");
      console.log(`[LOG] Link unduhan berhasil ditemukan: ${result.link}`);
      let media = null;
      if (output === "file") {
        console.log("[LOG] Mengunduh file...");
        const {
          data: buffer,
          headers
        } = await client.get(result.link, {
          headers: {
            Referer: `https://luluvdo.com/d/${id}_h`,
            "X-Forwarded-For": result.ip
          },
          responseType: "arraybuffer"
        });
        media = {
          buffer: Buffer.from(buffer),
          contentType: headers["content-type"] || "application/octet-stream",
          fileName: result.link.split("/").pop() || "downloaded_file"
        };
        console.log("[LOG] File berhasil diunduh");
      }
      return media ? {
        ...result,
        ...media
      } : result;
    } catch (error) {
      console.error(`[ERROR] Proses gagal: ${error.message}`);
      throw new Error(`Download failed: ${error.message}`);
    }
  }
}
app.get("/luluvdo", async (req, res) => {
  const {
    url,
    output
  } = req.query;
  const luluvdo = new Luluvdo();
  if (!url) {
    return res.status(400).json({
      error: "URL is required"
    });
  }
  try {
    const result = await luluvdo.download(url, output || "json");
    res.status(200).json(result);
  } catch (error) {
    console.error(`[ERROR] Download failed: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});
app.get("/discord", async (req, res) => {
  const {
    logo,
    text,
    text1,
    text2,
    text3,
    text4,
    text5,
    text6,
    text7,
    text8,
    text9
  } = req.query;
  if (!logo) {
    return res.status(400).json({
      error: "Missing logo parameters"
    });
  }
  const html = `<!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Discord Profile Card With Webhook</title>
  <style>
@import url("https://fonts.googleapis.com/css?family=Roboto:400,400i,700");

* {
  margin: 0;
  padding: 0;
  font-family: Roboto, sans-serif;
  box-sizing: border-box;
}

body,
html {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0b0b;
}

.tooltip {
  display: block;
  position: absolute;
  color: #b6b7b7;
  background: #18191c;
  padding: 0.4rem;
  border-radius: 3px;
  max-width: 150px;
  width: max-content;
  font-size: 0.8rem;
  transform: scale(0);
  transition: 0.055s ease-in-out transform;
  z-index: 10;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.35);
  -webkit-box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.35);
}

.tooltip-up {
  bottom: 30px;
}

.tooltip-up::before {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #18191c;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background-color: #535353;
  padding: 10px;
  border-radius: 3px;
  color: #fff;
  font-size: 0.85rem;
  transition: 0.2s ease-in-out;
  margin-top: 12px;
}

.btn:hover {
  background-color: #747474;
}

/* Card */
.card-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 1450px;
  z-index: 0;
}

.card {
  background: #292b2f;
  width: 345px;
  max-height: 95%;
  height: max-content;
  border-radius: 9px;
  box-shadow: 0px 0px 16px 3px rgba(0, 0, 0, 0.2);
  -webkit-box-shadow: 0px 0px 16px 3px rgba(0, 0, 0, 0.2);
  scrollbar-width: none;
}

.card::-webkit-scrollbar {
  display: none;
}

.card-header .banner {
  width: 100%;
  height: 60px;
  background: #ef5b0d;
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.card-header .banner-img {
  width: 100%;
  height: 120px;
  background-position: center !important;
  background-size: 100% auto !important;
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.card-body {
  padding: 15px;
  position: relative;
}

.card-body .profile-header {
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: calc(100% - 30px);
  top: -50px;
}

.card-body .profile-header .profil-logo {
  position: relative;
  border: 6px solid #292b2f;
  border-radius: 50%;
}

.card-body .profile-header .profil-logo img {
  display: block;
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.card-body .profile-header .profil-logo::before {
  content: "VIEW PRPFILE";
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  opacity: 0;
  width: 100%;
  height: 100%;
  color: #eeeeee;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  transition-duration: 0.15s;
}

.card-body .profile-header .profil-logo:hover::before {
  opacity: 1;
}

.card-body .profile-header .badges-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 220px;
  background: #18191c;
  border-radius: 7px;
  padding: 3px;
}

.card-body .profile-header .badges-container .badge-item {
  position: relative;
  margin: 5px;
  width: 15px;
  height: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.card-body .profile-header .badges-container .badge-item img {
  height: 110%;
}

.card-body .profile-header .badges-container .badge-item:hover > .tooltip {
  transform: scale(1);
}

.card-body .profile-body {
  background: #18191c;
  border-radius: 7px;
  padding: 13px;
  margin-top: 40px;
}

.card-body .profile-body .username {
  color: #eeeeee;
  font-weight: 600;
  font-size: 1.3rem;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.card-body .profile-body .username span {
  color: #b9bbbe;
}

.card-body .profile-body .username .badge {
  font-size: 0.65rem;
  background-color: #5865f2;
  text-transform: uppercase;
  font-weight: 300;
  width: max-content;
  padding: 2px 5px;
  margin-left: 5px;
  border-radius: 3px;
}

.card-body .profile-body hr {
  border: none;
  border-top: 0.5px solid #33353b;
}

.card-body .profile-body .category-title {
  color: #d6d6d6;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.card-body .profile-body .basic-infos {
  margin-bottom: 14px;
  margin-top: 12px;
}

.card-body .profile-body .basic-infos p {
  color: #bdbebf;
  font-size: 0.9rem;
}

.card-body .profile-body .basic-infos p a {
  color: #02a5e6;
  text-decoration: none;
}

.card-body .profile-body .basic-infos p a:hover {
  text-decoration: underline;
}

.card-body .profile-body .basic-infos p b {
  color: #ddd;
}

.card-body .profile-body .roles {
  margin-bottom: 14px;
}

.card-body .profile-body .roles .roles-list {
  display: flex;
  flex-wrap: wrap;
}

.card-body .profile-body .roles .roles-list .role {
  background: #292b2f;
  color: #c4c4c4;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 300;
  padding: 3px 6px;
  margin-right: 4px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  flex-direction: row;
}

.card-body .profile-body .roles .roles-list .role .role-color {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}

.card-body .profile-body .roles .roles-list .role .role-color:hover::before {
  content: "✕";
  position: relative;
  top: -2px;
  right: 1px;
  font-size: 0.65rem;
  color: #f5f5f5;
  background: rgba(41, 43, 47, 0);
  border-radius: 50%;
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.card-body .profile-body .roles .roles-list .role-add {
  cursor: pointer;
}

.card-body .profile-body .note textarea {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  min-height: 30px;
  color: #e0e0e0;
  resize: none;
  font-size: 0.8rem;
  border-radius: 3px;
  padding: 5px;
  box-sizing: border-box;
  scrollbar-width: none;
}

.card-body .profile-body .note textarea::-webkit-scrollbar {
  display: none;
}

.card-body .profile-body .note textarea::placeholder {
  font-size: 0.8rem;
}

.card-body .profile-body .note textarea:focus::placeholder {
  opacity: 0;
}

.card-body .profile-body .message input {
  background: transparent;
  outline: none;
  border: 1.2px solid #272727;
  padding: 13px;
  width: 100%;
  border-radius: 4px;
  color: #eeeeee;
  margin-top: 14px;
}
.nitro-card {
  position: relative;
  background-image: linear-gradient(0, #000000, #a77311);
  background-blend-mode: multiply;
  background-color: #0000006c;
}

.nitro-card:before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  margin: -5px;
  border-radius: 12px;
  background: linear-gradient(0, #000000, #e09200);
}

.nitro-card .card-body .profile-body {
background: linear-gradient(0, #000000, #18191c91);
}

.nitro-card .card-body .profile-header .profil-logo {
  position: relative;
  border-color: transparent;
  z-index: 0;
}

.nitro-card .card-body .profile-header .profil-logo:after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  margin: -6px;
  border-radius: 50%;
  background-color: rgb(74, 50, 7);
}

.nitro-card .card-body .profile-header .badges-container {
  background: #18191c77;
}

.nitro-card .card-body .profile-body .roles .roles-list .role {
  background: #18191c4d;
  border: 1px solid #3f4149;
}

/* Media Queries */
@media screen and (max-width: 1470px) {
  .card-container {
    width: 1100px;
  }
  .card:last-child {
    display: none;
  }
}

@media screen and (max-width: 1150px) {
  .card-container {
    width: 720px;
  }
  .card:nth-child(3) {
    display: none;
  }
}

@media screen and (max-width: 770px) {
  .card-container {
    width: max-content;
  }
  .card:nth-child(2) {
    display: none;
  }
}
</style>
</head>
<body>
<!-- partial:index.partial.html -->
<div class="card-container">
        
      <!-- nitro card -->
        
      <div class="card nitro-card">
        <div class="card-header">
          <div
            style="background: url('https://i.ibb.co/wyZxFzw/banner.gif')"
            class="banner-img">
        </div>
        </div>
        <div class="card-body">
          <div class="profile-header">
            <div class="profil-logo">
              <img src=${logo} />
            </div>
            <div class="badges-container">
                <div class="badge-item">
                <img src="https://svgur.com/i/xLC.svg" alt="" />
                <div class="tooltip tooltip-up">${text}</div>
              </div>
                <div class="badge-item">
                <img src="https://svgur.com/i/xN3.svg" alt="" />
                <div class="tooltip tooltip-up">${text1}</div>
              </div>
              <div class="badge-item">
                <img src="https://svgur.com/i/xMp.svg" alt="" />
                <div class="tooltip tooltip-up">${text2}</div>
              </div>
                <div class="badge-item">
                <img src="https://svgur.com/i/xNq.svg" alt="" />
                <div class="tooltip tooltip-up">${text3}</div>
              </div>
                <div class="badge-item">
                <img src="https://svgur.com/i/xNK.svg" alt="" />
                <div class="tooltip tooltip-up">${text4}</div>
              </div>
              <div class="badge-item">
                <img src="https://svgur.com/i/xLD.svg" alt="" />
                <div class="tooltip tooltip-up">${text5}</div>
              </div>
                <div class="badge-item">
                <img src="https://svgur.com/i/xNF.svg" alt="" />
                <div class="tooltip tooltip-up">${text6}</div>
              </div>
              <div class="badge-item">
                <img src="https://svgur.com/i/xNe.svg" alt="" />
                <div class="tooltip tooltip-up">
                  ${text7}
                </div>
              </div>
            </div>
          </div>
          <div class="profile-body">
            <div class="username">
              <a> ${text8} </a>
            </div>
            <p style="color: white;">d11b</p>
            <hr/>
            <div class="basic-infos">
              <div class="category-title">${text9}</div>
              <p>
                 <b>Discord</b> Verified Account User <br>Joined since &rarr; 2016<br>
                 <b>Discord</b> Verified Active Developer<br> since &rarr; Oct 1, 2022 
              </p>
            </div>
            <div class="basic-infos">
              <div class="category-title">Member Since</div>
              <div style="display: flex; align-items: center;">
              <img src="https://i.ibb.co/HpbSK8B/icons8-discord-16.png" style="margin-right: 10px;">
                  <p style="margin: 0;">Jan 8, 2016</p>
            </div>
            </div>
             <div class="roles">
              <div class="category-title">Roles</div>
              <div class="roles-list">
                <div class="role">
                  <div class="role-color" style="background: lightyellow"></div>
                  <p>JavaScript</p>
                </div>
                <div class="role">
                  <div class="role-color" style="background: darkred"></div>
                  <p>HTML</p>
                </div>
                <div class="role">
                  <div class="role-color" style="background: darkgreen"></div>
                  <p>C++</p>
                </div>
                <div class="role">
                  <div class="role-color" style="background: yellow"></div>
                  <p>Python</p>
                </div>
                <div class="role">
                  <div class="role-color" style="background: darkblue"></div>
                  <p>C#</p>
                </div>
                <div class="role">
                  <div class="role-color" style="background: orange"></div>
                  <p>IT</p>
                </div>
                <div class="role role-add">
                  <div class="role-add-text">+</div>
                </div>
              </div>
            </div>
            <div class="note">
              <div class="category-title">Note</div>
               <textarea placeholder="Click to add a note"></textarea>
            </div>
            <div class="message">
              <input id="content" type="text" placeholder=${text9}/>
            </div>
              <div id="message-status" style="display: none;"><b>Message Sent!</b></div>
          </div>
        </div>
      </div>
        
    </div>
<!-- partial -->
  <script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js'></script><script  src="./script.js"></script>

</body>
</html>
`;
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: config.viewport,
      userAgent: config.userAgent
    });
    await context.route("**/*", route => {
      const url = route.request().url();
      if (url.endsWith(".png") || url.endsWith(".jpg") || url.includes("google-analytics")) {
        return route.abort();
      }
      route.continue();
    });
    const page = await context.newPage();
    await page.setContent(html);
    const buffer = await page.screenshot({
      type: "png"
    });
    await browser.close();
    res.set("Content-Type", "image/png");
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    res.status(500).json({
      error: "Failed to convert HTML to PNG"
    });
  }
});
app.get("/darkcard", async (req, res) => {
  const {
    avatar,
    name,
    job,
    button,
    desc
  } = req.query;
  if (!(avatar || name || job || button || desc)) {
    return res.status(400).json({
      error: "Missing avatar, name, job, button, desc parameters"
    });
  }
  const html = `<!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Glassmorph dark card</title>
  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.0.2/css/bootstrap.min.css'><style>
body {
  background-color: #001320;
  background: -webkit-linear-gradient(90deg, 0, #1b121d 50%, #1b121d 100%);
  min-height: 100vh;
  font-size: 1.2rem;
  letter-spacing: 1px;
}

.container {
  min-height: 100vh;
}

.card-container {
  position: relative;
}
.card-container::before, .card-container::after {
  width: 200px;
  height: 200px;
  border-radius: 100%;
  position: absolute;
  filter: blur(20px);
  z-index: 0;
}
.card-container::before {
  content: "";
  left: -80px;
  top: -80px;
  background: linear-gradient(#1845ad, #23a2f6);
}
.card-container::after {
  content: "";
  right: -30px;
  bottom: -80px;
  background: linear-gradient(to right, #ff512f, #f09819);
}

.card {
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  background-color: rgba(17, 25, 40, 0.75);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.125);
  text-align: center;
  z-index: 2;
}
.card .card-body {
  padding: 1.5rem;
}
.card .card-title {
  color: white;
}
.card .card-subtitle {
  color: #c0f;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
  opacity: 0.7;
}
.card .card-description {
  color: #9ca3af;
}
.card .card-img img {
  height: 9rem;
  width: 9rem;
  border: 1px solid rgba(209, 213, 219, 0.3);
  padding: 1rem;
}
</style>
</head>
<body>
<!-- partial:index.partial.html -->
<body>
  <div class="container d-flex flex-column justify-content-center align-items center h-100">
    <div class="row">
      <div class="col-md-4 mx-auto">
        <div class="card-container">
          <div class="card">
            <div class="card-body">
              <div class="card-img mb-4"><img class="rounded-circle" src=${avatar}/></div>
              <h2 class="card-title">${name}</h2>
              <h3 class="card-subtitle">${job}</h3>
              <div class="btn btn-primary mt-4">${button}</div>
              <p class="card-description mb-0 mt-4">${desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
<!-- partial -->
  
</body>
</html>
`;
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: config.viewport,
      userAgent: config.userAgent
    });
    await context.route("**/*", route => {
      const url = route.request().url();
      if (url.endsWith(".png") || url.endsWith(".jpg") || url.includes("google-analytics")) {
        return route.abort();
      }
      route.continue();
    });
    const page = await context.newPage();
    await page.setContent(html);
    const buffer = await page.screenshot({
      type: "png"
    });
    await browser.close();
    res.set("Content-Type", "image/png");
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    res.status(500).json({
      error: "Failed to convert HTML to PNG"
    });
  }
});
app.get("/welcome", async (req, res) => {
  const {
    name,
    info,
    desc
  } = req.query;
  if (!name || !info) {
    return res.status(400).json({
      error: "Missing required parameters"
    });
  }
  const html = `
        <!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Course Card UI Design - #094 of #100Days100Projects</title>
  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.2/css/all.min.css'>
  <style>
  @import url('https://fonts.googleapis.com/css?family=Muli&display=swap');

* {
	box-sizing: border-box;
}


body {
	background-image: linear-gradient(45deg, #7175da, #9790F2);
	font-family: 'Muli', sans-serif;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	min-height: 100vh;
	margin: 0;
}

.courses-container {
	
}

.course {
	background-color: #fff;
	border-radius: 10px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
	display: flex;
	max-width: 100%;
	margin: 20px;
	overflow: hidden;
	width: 700px;
}

.course h6 {
	opacity: 0.6;
	margin: 0;
	letter-spacing: 1px;
	text-transform: uppercase;
}

.course h2 {
	letter-spacing: 1px;
	margin: 10px 0;
}

.course-preview {
	background-color: #2A265F;
	color: #fff;
	padding: 30px;
	max-width: 250px;
}

.course-preview a {
	color: #fff;
	display: inline-block;
	font-size: 12px;
	opacity: 0.6;
	margin-top: 30px;
	text-decoration: none;
}

.course-info {
	padding: 30px;
	position: relative;
	width: 100%;
}

.progress-container {
	position: absolute;
	top: 30px;
	right: 30px;
	text-align: right;
	width: 150px;
}

.progress {
	background-color: #ddd;
	border-radius: 3px;
	height: 5px;
	width: 100%;
}

.progress::after {
	border-radius: 3px;
	background-color: #2A265F;
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	height: 5px;
	width: 66%;
}

.progress-text {
	font-size: 10px;
	opacity: 0.6;
	letter-spacing: 1px;
}

.btn {
	background-color: #2A265F;
	border: 0;
	border-radius: 50px;
	box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
	color: #fff;
	font-size: 16px;
	padding: 12px 25px;
	position: absolute;
	bottom: 30px;
	right: 30px;
	letter-spacing: 1px;
}

/* SOCIAL PANEL CSS */
.social-panel-container {
	position: fixed;
	right: 0;
	bottom: 80px;
	transform: translateX(100%);
	transition: transform 0.4s ease-in-out;
}

.social-panel-container.visible {
	transform: translateX(-10px);
}

.social-panel {	
	background-color: #fff;
	border-radius: 16px;
	box-shadow: 0 16px 31px -17px rgba(0,31,97,0.6);
	border: 5px solid #001F61;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	font-family: 'Muli';
	position: relative;
	height: 169px;	
	width: 370px;
	max-width: calc(100% - 10px);
}

.social-panel button.close-btn {
	border: 0;
	color: #97A5CE;
	cursor: pointer;
	font-size: 20px;
	position: absolute;
	top: 5px;
	right: 5px;
}

.social-panel button.close-btn:focus {
	outline: none;
}

.social-panel p {
	background-color: #001F61;
	border-radius: 0 0 10px 10px;
	color: #fff;
	font-size: 14px;
	line-height: 18px;
	padding: 2px 17px 6px;
	position: absolute;
	top: 0;
	left: 50%;
	margin: 0;
	transform: translateX(-50%);
	text-align: center;
	width: 235px;
}

.social-panel p i {
	margin: 0 5px;
}

.social-panel p a {
	color: #FF7500;
	text-decoration: none;
}

.social-panel h4 {
	margin: 20px 0;
	color: #97A5CE;	
	font-family: 'Muli';	
	font-size: 14px;	
	line-height: 18px;
	text-transform: uppercase;
}

.social-panel ul {
	display: flex;
	list-style-type: none;
	padding: 0;
	margin: 0;
}

.social-panel ul li {
	margin: 0 10px;
}

.social-panel ul li a {
	border: 1px solid #DCE1F2;
	border-radius: 50%;
	color: #001F61;
	font-size: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 50px;
	width: 50px;
	text-decoration: none;
}

.social-panel ul li a:hover {
	border-color: #FF6A00;
	box-shadow: 0 9px 12px -9px #FF6A00;
}

.floating-btn {
	border-radius: 26.5px;
	background-color: #001F61;
	border: 1px solid #001F61;
	box-shadow: 0 16px 22px -17px #03153B;
	color: #fff;
	cursor: pointer;
	font-size: 16px;
	line-height: 20px;
	padding: 12px 20px;
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 999;
}

.floating-btn:hover {
	background-color: #ffffff;
	color: #001F61;
}

.floating-btn:focus {
	outline: none;
}

.floating-text {
	background-color: #001F61;
	border-radius: 10px 10px 0 0;
	color: #fff;
	font-family: 'Muli';
	padding: 7px 15px;
	position: fixed;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	text-align: center;
	z-index: 998;
}

.floating-text a {
	color: #FF7500;
	text-decoration: none;
}

@media screen and (max-width: 480px) {

	.social-panel-container.visible {
		transform: translateX(0px);
	}
	
	.floating-btn {
		right: 10px;
	}
}
  </style>

</head>
<body>
<!-- partial:index.partial.html -->
<div class="courses-container">
	<div class="course">
		<div class="course-preview">
			<h6>Course</h6>
			<h2>${name}</h2>
			<a href="#">View all chapters <i class="fas fa-chevron-right"></i></a>
		</div>
		<div class="course-info">
			<div class="progress-container">
				<div class="progress"></div>
				<span class="progress-text">
					6/9 Challenges
				</span>
			</div>
			<h6>${info}</h6>
			<h2>${desc}</h2>
			<button class="btn">Continue</button>
		</div>
	</div>
</div>

<!-- SOCIAL PANEL HTML -->
<div class="social-panel-container">
	<div class="social-panel">
		<p>Created with <i class="fa fa-heart"></i> by
			<a target="_blank" href="https://florin-pop.com">Florin Pop</a></p>
		<button class="close-btn"><i class="fas fa-times"></i></button>
		<h4>Get in touch on</h4>
		<ul>
			<li>
				<a href="https://www.patreon.com/florinpop17" target="_blank">
					<i class="fab fa-discord"></i>
				</a>
			</li>
			<li>
				<a href="https://twitter.com/florinpop1705" target="_blank">
					<i class="fab fa-twitter"></i>
				</a>
			</li>
			<li>
				<a href="https://linkedin.com/in/florinpop17" target="_blank">
					<i class="fab fa-linkedin"></i>
				</a>
			</li>
			<li>
				<a href="https://facebook.com/florinpop17" target="_blank">
					<i class="fab fa-facebook"></i>
				</a>
			</li>
			<li>
				<a href="https://instagram.com/florinpop17" target="_blank">
					<i class="fab fa-instagram"></i>
				</a>
			</li>
		</ul>
	</div>
</div>
<button class="floating-btn">
	Get in Touch
</button>

<div class="floating-text">
	Part of <a href="https://florin-pop.com/blog/2019/09/100-days-100-projects" target="_blank">#100Days100Projects</a>
</div>
<!-- partial -->
  <script>
  // INSERT JS HERE


// SOCIAL PANEL JS
const floating_btn = document.querySelector('.floating-btn');
const close_btn = document.querySelector('.close-btn');
const social_panel_container = document.querySelector('.social-panel-container');

floating_btn.addEventListener('click', () => {
	social_panel_container.classList.toggle('visible')
});

close_btn.addEventListener('click', () => {
	social_panel_container.classList.remove('visible')
});
  </script>

</body>
</html>`;
  try {
    const browser = await chromium.launch({
      headless: true
    });
    const context = await browser.newContext({
      viewport: config.viewport,
      userAgent: config.userAgent
    });
    await context.route("**/*", route => {
      const url = route.request().url();
      if (url.endsWith(".png") || url.endsWith(".jpg") || url.includes("google-analytics")) {
        return route.abort();
      }
      route.continue();
    });
    const page = await context.newPage();
    await page.setContent(html);
    const buffer = await page.screenshot({
      type: "png"
    });
    await browser.close();
    res.set("Content-Type", "image/png");
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    res.status(500).json({
      error: "Failed to convert HTML to PNG"
    });
  }
});
const PORT = process.env.PORT || 7860;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await utils.initialize();
});
process.on("SIGINT", async () => {
  await utils.close();
  process.exit(0);
});