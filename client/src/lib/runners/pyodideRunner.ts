// Chạy Python phía client bằng Pyodide (WASM). Tải Pyodide từ CDN một lần
// rồi tái sử dụng. Bắt stdout/stderr và hỗ trợ truyền stdin.

const PYODIDE_VERSION = 'v0.26.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Pyodide.'));
    document.head.appendChild(script);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPyodide(): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_CDN}pyodide.js`);
      if (!window.loadPyodide) {
        throw new Error('Pyodide chưa sẵn sàng.');
      }
      return window.loadPyodide({ indexURL: PYODIDE_CDN });
    })();
  }
  return pyodidePromise;
}

export interface RunResult {
  stdout: string;
  stderr: string;
}

// Thực thi code Python với stdin tuỳ chọn. Trả về stdout và stderr.
export async function runPython(code: string, stdin = ''): Promise<RunResult> {
  const pyodide = await getPyodide();

  let stdout = '';
  let stderr = '';

  pyodide.setStdout({ batched: (s: string) => (stdout += s + '\n') });
  pyodide.setStderr({ batched: (s: string) => (stderr += s + '\n') });

  // Thiết lập stdin từ chuỗi truyền vào.
  const stdinLines = stdin.split('\n');
  let stdinIndex = 0;
  pyodide.setStdin({
    stdin: () => {
      if (stdinIndex < stdinLines.length) {
        return stdinLines[stdinIndex++];
      }
      return null;
    },
  });

  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    stderr += String(err);
  }

  return { stdout: stdout.replace(/\n$/, ''), stderr: stderr.replace(/\n$/, '') };
}
