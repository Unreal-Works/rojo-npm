import { rokitCommandHandler } from "@unrealworks/rkkit-core";

const result = await rokitCommandHandler({
    args: process.argv.slice(2),
});

process.exit(result.status);
