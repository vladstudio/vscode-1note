#!/bin/bash
bun run build && bunx @vscode/vsce package && code --install-extension 1note-0.0.1.vsix && echo "Installed. Reload VS Code windows to activate."
