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
      borderWidth: '1px',
      borderStyle: 'solid',
      overviewRulerColor: 'blue',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        // this color will be used in light color themes
        borderColor: 'darkblue'
      },
      dark: {
        // this color will be used in dark color themes
        borderColor: 'lightblue'
      }
    }
  );

  // create a decorator type that we use to decorate large numbers
  //   const unusedDependenciesDecorationType = vscode.window.createTextEditorDecorationType(
  //     {
  //       cursor: 'crosshair',
  //       // use a themable color. See package.json for the declaration and default values.
  //       backgroundColor: { id: 'myextension.largeNumberBackground' }
  //     }
  //   );

  let activeEditor: vscode.TextEditor | undefined =
    vscode.window.activeTextEditor;

  let text: string;

  const handleDepcheckResponse = ({
    dependencies,
    devDependencies
  }: DepcheckResponse) => {
    console.log(dependencies);
    // console.log(devDependencies);

    let unusedDependencies: vscode.DecorationOptions[] = [];

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

    depcheck(
      vscode.workspace.workspaceFolders[0].uri.path,
      {},
      handleDepcheckResponse
    );
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
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );
}

export function deactivate() {}
