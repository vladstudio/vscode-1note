import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

const NOTE_PATH = path.join(os.homedir(), ".1note.md");

function scrollToEnd(editor: vscode.TextEditor) {
  const doc = editor.document;
  const lastLine = doc.lineCount - 1;
  const lastChar = doc.lineAt(lastLine).text.length;
  const endPos = new vscode.Position(lastLine, lastChar);
  editor.selection = new vscode.Selection(endPos, endPos);
  editor.revealRange(new vscode.Range(endPos, endPos));
}

export function activate(context: vscode.ExtensionContext) {
  const noteUri = vscode.Uri.file(NOTE_PATH);

  const openCmd = vscode.commands.registerCommand("1note.open", async () => {
    // Create file if missing
    try {
      await vscode.workspace.fs.stat(noteUri);
    } catch {
      await vscode.workspace.fs.writeFile(noteUri, new Uint8Array());
    }

    const editor = await vscode.window.showTextDocument(noteUri);
    const doc = editor.document;

    // Append \n\n#\n\n if file doesn't already end with an empty heading
    const text = doc.getText();
    const needsNewNote = !/\n#\s*\n\s*$/.test(text) && !/^#\s*\n\s*$/.test(text);

    if (needsNewNote && text.length > 0) {
      const endPos = doc.positionAt(text.length);
      await editor.edit((edit) => {
        edit.insert(endPos, "\n\n#\n\n");
      });
    }

    scrollToEnd(editor);
  });

  // Scroll to bottom when .1note.md is opened by any process
  const onEditorChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.uri.fsPath === NOTE_PATH) {
      scrollToEnd(editor);
    }
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

  context.subscriptions.push(openCmd, onEditorChange, statusBar, onChange);
}

export function deactivate() {}
