import * as vscode from 'vscode';
import * as depcheck from 'depcheck';

interface DepcheckResponse {
  dependencies: string[];
  devDependencies: string[];
}

export function activate(context: vscode.ExtensionContext) {
  let timeout: NodeJS.Timer | undefined = undefined;

  // create a decorator type that we use to decorate small numbers
  const unusedDependenciesDecorationType = vscode.window.createTextEditorDecorationType(
    {
      // borderWidth: '1px',
      // borderStyle: 'solid',
      overviewRulerColor: '#CDCDCD',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      // borderColor: '#C2161B',
      // color: '#CDCDCD',
      opacity: '0.5'
    }
  );

  let activeEditor: vscode.TextEditor | undefined =
    vscode.window.activeTextEditor;

  let text: string;

  const handleDepcheckResponse = ({
    dependencies,
    devDependencies
  }: DepcheckResponse) => {
    let unusedDependencies: vscode.DecorationOptions[] = [];

    // const allUnusedDependencies = [...dependencies, ...devDependencies];

    dependencies.map((dependency: string) => {
      const regEx = new RegExp(`"${dependency}"`);
      let match: RegExpExecArray | null = regEx.exec(text);

      if (match && activeEditor) {
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        );
        const decoration = {
          range: new vscode.Range(startPos, endPos),
          hoverMessage: `Unused dependency ** ${dependency} **`
        };

        unusedDependencies.push(decoration);
      }
    });

    activeEditor &&
      activeEditor.setDecorations(
        unusedDependenciesDecorationType,
        unusedDependencies
      );
  };

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    text = activeEditor.document.getText();

    if (vscode.workspace.workspaceFolders) {
      depcheck(
        vscode.workspace.workspaceFolders[0].uri.path,
        {},
        handleDepcheckResponse
      );
    }
  }

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(updateDecorations, 500);
  }

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;
      if (editor && editor.document.fileName.includes('package.json')) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (
        activeEditor &&
        event.document === activeEditor.document &&
        event.document.fileName.includes('package.json')
      ) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );
}

export function deactivate() {}
