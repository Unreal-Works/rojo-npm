import AdmZip from 'adm-zip';
import fs, { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const destPath = "bin";

function getLatestReleaseUrl() {
    return 'https://api.github.com/repos/rojo-rbx/rojo/releases/latest';
}

// Fetch latest release data
const response = await fetch(getLatestReleaseUrl());
const data = await response.json();
const version = data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
console.log(`Downloading version: ${version}`);

const assets = new Map();

for (const asset of data.assets) {
    const name = asset.name.toLowerCase();
    if (name.includes('win32') || name.includes('windows')) {
        assets.set('win32', asset);
    } else if (name.includes('linux') || name.includes('ubuntu')) {
        assets.set('linux', asset);
    } else if (name.includes('arm') || name.includes('aarch')) {
        assets.set('arm64', asset);
    } else if (name.includes('macos') || name.includes('darwin')) {
        assets.set('darwin', asset);
    }
}

const streamPipeline = promisify(pipeline);
for (const [platform, asset] of assets) {
    const downloadResponse = await fetch(asset.browser_download_url);
    if (!downloadResponse.ok) {
        throw new Error(`Failed to download: ${downloadResponse.statusText}`);
    }

    const binPath = path.join(destPath, platform) + ".zip";
    await streamPipeline(downloadResponse.body, createWriteStream(binPath));

    const zip = new AdmZip(binPath);
    const outputDir = path.join(destPath, platform);
    zip.extractAllTo(outputDir, true);

    fs.unlinkSync(binPath); // delete the zip file
}

// Write version info to a file for reference
const versionInfo = {
    version,
    downloadedAt: new Date().toISOString()
};
fs.writeFileSync(
    path.join(destPath, 'version.json'), 
    JSON.stringify(versionInfo, null, 2)
);