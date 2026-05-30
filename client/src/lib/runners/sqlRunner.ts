// Chạy SQL phía client bằng sql.js (SQLite biên dịch sang WASM).
// Tải từ CDN một lần và tái sử dụng instance.

const SQLJS_VERSION = '1.12.0';
const SQLJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${SQLJS_VERSION}/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlPromise: Promise<any> | null = null;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<any>;
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
    script.onerror = () => reject(new Error('Không tải được sql.js.'));
    document.head.appendChild(script);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSql(): Promise<any> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      await loadScript(`${SQLJS_CDN}sql-wasm.min.js`);
      if (!window.initSqlJs) {
        throw new Error('sql.js chưa sẵn sàng.');
      }
      return window.initSqlJs({ locateFile: (file: string) => `${SQLJS_CDN}${file}` });
    })();
  }
  return sqlPromise;
}

export interface SqlResult {
  // Mỗi phần tử là kết quả của một câu lệnh trả về dữ liệu.
  tables: { columns: string[]; rows: unknown[][] }[];
  error?: string;
}

// Thực thi một hoặc nhiều câu lệnh SQL trên CSDL SQLite trong bộ nhớ.
export async function runSql(sql: string): Promise<SqlResult> {
  const SQL = await getSql();
  const db = new SQL.Database();
  try {
    const res = db.exec(sql);
    // res: mảng { columns: string[], values: any[][] }
    const tables = res.map((r: { columns: string[]; values: unknown[][] }) => ({
      columns: r.columns,
      rows: r.values,
    }));
    return { tables };
  } catch (err) {
    return { tables: [], error: String(err) };
  } finally {
    db.close();
  }
}
