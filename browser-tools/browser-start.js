#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import puppeteer from "puppeteer-core";

// Browser configurations by platform, preferring Chromium over Chrome
const BROWSER_CONFIGS = {
	darwin: [
		{
			name: "Chromium",
			binary: "/Applications/Chromium.app/Contents/MacOS/Chromium",
			profile: `${process.env.HOME}/Library/Application Support/Chromium/`,
		},
		{
			name: "Chrome",
			binary: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			profile: `${process.env.HOME}/Library/Application Support/Google/Chrome/`,
		},
	],
	linux: [
		{
			name: "Chromium",
			binary: "/usr/bin/chromium",
			profile: `${process.env.HOME}/.config/chromium/`,
		},
		{
			name: "Chromium",
			binary: "/usr/bin/chromium-browser",
			profile: `${process.env.HOME}/.config/chromium/`,
		},
		{
			name: "Chrome",
			binary: "/usr/bin/google-chrome-stable",
			profile: `${process.env.HOME}/.config/google-chrome/`,
		},
		{
			name: "Chrome",
			binary: "/usr/bin/google-chrome",
			profile: `${process.env.HOME}/.config/google-chrome/`,
		},
	],
};

function findBrowser() {
	const os = platform();
	const configs = BROWSER_CONFIGS[os];
	if (!configs) {
		console.error(`✗ Unsupported platform: ${os}`);
		process.exit(1);
	}
	for (const config of configs) {
		if (existsSync(config.binary)) {
			return config;
		}
	}
	console.error(`✗ No Chrome or Chromium found. Searched:`);
	configs.forEach((c) => console.error(`  ${c.binary}`));
	process.exit(1);
}

const useProfile = process.argv[2] === "--profile";

if (process.argv[2] && process.argv[2] !== "--profile") {
	console.log("Usage: browser-start.js [--profile]");
	console.log("\nOptions:");
	console.log("  --profile  Copy your default Chrome/Chromium profile (cookies, logins)");
	process.exit(1);
}

const SCRAPING_DIR = `${process.env.HOME}/.cache/browser-tools`;
const browserConfig = findBrowser();

// Check if already running on :9222
try {
	const browser = await puppeteer.connect({
		browserURL: "http://localhost:9222",
		defaultViewport: null,
	});
	await browser.disconnect();
	console.log(`✓ ${browserConfig.name} already running on :9222`);
	process.exit(0);
} catch {}

// Setup profile directory
execSync(`mkdir -p "${SCRAPING_DIR}"`, { stdio: "ignore" });

// Remove SingletonLock to allow new instance
try {
	execSync(`rm -f "${SCRAPING_DIR}/SingletonLock" "${SCRAPING_DIR}/SingletonSocket" "${SCRAPING_DIR}/SingletonCookie"`, { stdio: "ignore" });
} catch {}

if (useProfile) {
	if (!existsSync(browserConfig.profile)) {
		console.error(`✗ Profile directory not found: ${browserConfig.profile}`);
		process.exit(1);
	}
	console.log(`Syncing ${browserConfig.name} profile...`);
	execSync(
		`rsync -a --delete \
			--exclude='SingletonLock' \
			--exclude='SingletonSocket' \
			--exclude='SingletonCookie' \
			--exclude='*/Sessions/*' \
			--exclude='*/Current Session' \
			--exclude='*/Current Tabs' \
			--exclude='*/Last Session' \
			--exclude='*/Last Tabs' \
			"${browserConfig.profile}" "${SCRAPING_DIR}/"`,
		{ stdio: "pipe" },
	);
}

// Start browser with flags to force new instance
spawn(
	browserConfig.binary,
	[
		"--remote-debugging-port=9222",
		`--user-data-dir=${SCRAPING_DIR}`,
		"--no-first-run",
		"--no-default-browser-check",
	],
	{ detached: true, stdio: "ignore" },
).unref();

// Wait for browser to be ready
let connected = false;
for (let i = 0; i < 30; i++) {
	try {
		const browser = await puppeteer.connect({
			browserURL: "http://localhost:9222",
			defaultViewport: null,
		});
		await browser.disconnect();
		connected = true;
		break;
	} catch {
		await new Promise((r) => setTimeout(r, 500));
	}
}

if (!connected) {
	console.error(`✗ Failed to connect to ${browserConfig.name}`);
	process.exit(1);
}

console.log(`✓ ${browserConfig.name} started on :9222${useProfile ? " with your profile" : ""}`);
