#!/usr/bin/env node
import { logger, rkCommandHandlerSync } from "rkkit";

logger.setLogLevel("error");
const result = await rkCommandHandlerSync({
    tool: "rojo",
    args: process.argv.slice(2),
});

process.exit(result.status);
