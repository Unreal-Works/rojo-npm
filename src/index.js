#!/usr/bin/env node

export * from "@unrealworks/rkkit-core";

import esMain from "es-main";
import { logger, rkCommandHandlerSync } from "@unrealworks/rkkit-core";

if (esMain(import.meta)) {
    logger.setLogLevel("error");

    const result = await rkCommandHandlerSync({
        tool: "rojo",
        args: process.argv.slice(2),
    });

    process.exit(result.status);
}
