#!/usr/bin/env node
import { logger, rkCommandHandlerSync } from "rkkit";

logger.setLogLevel("error");
rkCommandHandlerSync({
    tool: "rojo",
    args: process.argv.slice(2),
});
