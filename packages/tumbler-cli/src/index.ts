#!/usr/bin/env bun
import { build } from "./commands/build";

/**
 * Entry point for the Tumbler Command Line Interface (CLI).
 * Parses arguments and delegates to specific commands.
 */

const args = process.argv.slice(2);
const command = args[0];

// Dispatch commands
if (command === "build") {
    // Execute the build command with the optional project root argument
    await build(args[1]);
} else {
    // Display usage information for unknown commands
    console.log("Usage: tumbler-cli build [project-root]");
}
