#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class ProcessError extends Error {
    constructor(message: string, public code: number) {
        super(message);
    }
}

export async function getBinaryPath() {
    const folderPath = path.join(__dirname, "..", "bin", process.platform);
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    let binaryName: string;
    switch (process.platform) {
        case 'win32':
            binaryName = "rojo.exe";
            break;
        default:
            binaryName = "rojo";
            break;
    }
    const binary = files.find(file => file.isFile() && file.name.includes(binaryName));
    return binary ? path.join(folderPath, binary.name) : null;
}

export async function main() {
    const binaryPath = await getBinaryPath();
    const args = process.argv.slice(2);

    return await new Promise<void>((resolve, reject) => {
        if (!binaryPath) {
            reject(new Error('Binary path is undefined'));
            return;
        }

        const child = spawn(binaryPath, args, { stdio: 'inherit' });

        child.on('error', (error) => reject(error));
        child.on('exit', (code) => {
            if (code === 0 || code === 2) {
                resolve();
            } else {
                reject(new ProcessError(`Process exited with code ${code}`, code || 1));
            }
        });
    });
}

if (require.main === module) {
    main().catch((error: ProcessError) => {
        console.error(error);
        process.exit(error.code);
    });
}