const baseUrl = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/, '');
const total = positiveInteger(process.env.LOAD_TOTAL, 20);
const concurrency = positiveInteger(process.env.LOAD_CONCURRENCY, 4);
const timeoutMs = positiveInteger(process.env.LOAD_TIMEOUT_MS, 60_000);

function positiveInteger(raw, fallback) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

function percentile(values, percent) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((percent / 100) * sorted.length) - 1)];
}

async function findPythonLanguageId() {
  const languages = await requestJson('/languages');
  const python = languages.find((language) => /^Python \(3\./i.test(language.name));
  if (!python) throw new Error('Judge0 does not expose a Python 3 runtime.');
  return python.id;
}

async function submitAndWait(languageId, index) {
  const startedAt = performance.now();
  const submission = await requestJson('/submissions?base64_encoded=false&wait=false', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      language_id: languageId,
      source_code: `print("LOAD-${index}")`,
      expected_output: `LOAD-${index}\n`,
      cpu_time_limit: 2,
      wall_time_limit: 5,
      memory_limit: 128000,
      enable_network: false,
      enable_per_process_and_thread_time_limit: true,
      enable_per_process_and_thread_memory_limit: true,
    }),
  });
  if (!submission.token) throw new Error(`Submission ${index} did not return a token.`);

  while (performance.now() - startedAt < timeoutMs) {
    const result = await requestJson(
      `/submissions/${submission.token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory`,
    );
    if (result.status?.id > 2) {
      return {
        ok: result.status.id === 3 && result.stdout === `LOAD-${index}\n`,
        status:
          result.status.description +
          (result.stderr ? `: ${result.stderr.trim()}` : '') +
          (result.compile_output ? `: ${result.compile_output.trim()}` : ''),
        latencyMs: Math.round(performance.now() - startedAt),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Submission ${index} timed out after ${timeoutMs} ms.`);
}

async function main() {
  const languageId = await findPythonLanguageId();
  const results = new Array(total);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < total) {
      const index = nextIndex++;
      try {
        results[index] = await submitAndWait(languageId, index + 1);
      } catch (error) {
        results[index] = {
          ok: false,
          status: error instanceof Error ? error.message : String(error),
          latencyMs: timeoutMs,
        };
      }
    }
  }

  console.log(`Judge0 load smoke: total=${total}, concurrency=${concurrency}, endpoint=${baseUrl}`);
  const suiteStartedAt = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));

  const passed = results.filter((result) => result.ok).length;
  const latencies = results.map((result) => result.latencyMs);
  const durationMs = Math.round(performance.now() - suiteStartedAt);
  console.log(`Passed: ${passed}/${total}`);
  console.log(
    `Latency: p50=${percentile(latencies, 50)}ms, p95=${percentile(latencies, 95)}ms, max=${Math.max(...latencies)}ms`,
  );
  console.log(`Throughput: ${((total / durationMs) * 1000).toFixed(2)} submissions/second`);

  if (passed !== total) {
    const failures = results.filter((result) => !result.ok).slice(0, 5);
    for (const failure of failures) console.error(`FAILED: ${failure.status}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
