import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));
const projectRoot = path.dirname(cliPath);

const skip = process.env.ROJO_NPM_SKIP_CLI_TESTS === "1";

function runCli(args = [], options = {}) {
    return spawnSync(process.execPath, [cliPath, ...args], {
        cwd: options.cwd ?? projectRoot,
        encoding: "utf8",
        timeout: 120_000,
    });
}

function output(result) {
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

test("--version prints the installed Rojo version", { skip }, () => {
    const result = runCli(["--version"]);

    assert.equal(result.status, 0, output(result));
    assert.match(result.stdout, /Rojo \d+\.\d+\.\d+/);
});

test(
    "rokit.toml Rojo version takes precedence over the global version",
    { skip },
    () => {
        const dir = mkdtempSync(path.join(tmpdir(), "rojo-npm-"));
        const configuredVersion = "7.6.1";
        try {
            const fallbackResult = runCli(["--version"], { cwd: dir });
            assert.equal(fallbackResult.status, 0, output(fallbackResult));
            assert.match(fallbackResult.stdout, /Rojo \d+\.\d+\.\d+/);

            writeFileSync(
                path.join(dir, "rokit.toml"),
                `[tools]\nrojo = "rojo-rbx/rojo@${configuredVersion}"\n`,
            );

            const configuredResult = runCli(["--version"], { cwd: dir });

            assert.equal(configuredResult.status, 0, output(configuredResult));
            assert.match(
                configuredResult.stdout,
                new RegExp(`Rojo ${configuredVersion.replaceAll(".", "\\.")}`),
            );
            assert.notEqual(configuredResult.stdout, fallbackResult.stdout);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    },
);

test("--help prints the subcommand list", { skip }, () => {
    const result = runCli(["--help"]);

    assert.equal(result.status, 0, output(result));
    for (const subcommand of [
        "build",
        "doc",
        "init",
        "plugin",
        "serve",
        "sourcemap",
        "syncback",
        "upload",
    ]) {
        assert.match(output(result), new RegExp(`\\b${subcommand}\\b`));
    }
});

test("running with no arguments prints usage and exits 2", { skip }, () => {
    const result = runCli([]);

    assert.equal(result.status, 2, output(result));
    assert.match(output(result), /SUBCOMMANDS:/);
});

test("an unknown subcommand exits with a non-zero code", { skip }, () => {
    const result = runCli(["definitely-not-a-command"]);

    assert.notEqual(result.status, 0, output(result));
    assert.match(output(result), /error:/);
});

test("rojo build without a project reports an error", { skip }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rojo-npm-"));
    try {
        const result = runCli(["build"], { cwd: dir });

        assert.notEqual(result.status, 0, output(result));
        assert.match(output(result), /error/i);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
