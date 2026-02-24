import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

const NOTE_PATH = path.join(os.homedir(), ".1note.md");

export function activate(context: vscode.ExtensionContext) {
  const noteUri = vscode.Uri.file(NOTE_PATH);

  // Command: open the note file (create if missing)
  const openCmd = vscode.commands.registerCommand("1note.open", async () => {
    try {
      await vscode.workspace.fs.stat(noteUri);
    } catch {
      await vscode.workspace.fs.writeFile(noteUri, new Uint8Array());
    }
    await vscode.window.showTextDocument(noteUri);
  });

  // Status bar button
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  statusBar.text = "1note";
  statusBar.tooltip = "Open ~/.1note.md";
  statusBar.command = "1note.open";
  statusBar.show();

  // Auto-save on every change (debounced 1s)
  let timer: ReturnType<typeof setTimeout> | undefined;
  const onChange = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document.uri.fsPath !== NOTE_PATH) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => e.document.save(), 1000);
  });

  context.subscriptions.push(openCmd, statusBar, onChange);
}

export function deactivate() {}
