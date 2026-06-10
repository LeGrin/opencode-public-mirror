import path from "node:path";

const DEFAULT_URL = "http://localhost:4096";
const SERVER_URL_ENV = "OPENCODE_SERVER_URL";
const USERNAME_ENV = "OPENCODE_SERVER_USERNAME";
const PASSWORD_ENV = "OPENCODE_SERVER_PASSWORD";

type ErrorCode =
  | "server_unreachable"
  | "server_auth_missing"
  | "server_auth_failed"
  | "server_error"
  | "project_scope_invalid";

type PreflightResult =
  | { ok: true }
  | { ok: false; code: ErrorCode; message: string };

export class OpenCodeApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number | undefined,
    public readonly apiPath: string,
    message: string,
  ) {
    super(message);
  }
}

function serverUrl(): string {
  return process.env[SERVER_URL_ENV] || DEFAULT_URL;
}

function authHeader(): Record<string, string> {
  const pwd = process.env[PASSWORD_ENV] || "";
  if (!pwd) return {};
  const user = process.env[USERNAME_ENV] || "opencode";
  const token = Buffer.from(`${user}:${pwd}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

function sanitize(message: string): string {
  const pwd = process.env[PASSWORD_ENV];
  return pwd ? message.split(pwd).join("[redacted]") : message;
}

function classify(status?: number): ErrorCode {
  if (status === 401 || status === 403) return "server_auth_failed";
  if (status && status >= 500) return "server_error";
  if (status && status >= 400) return "project_scope_invalid";
  return "server_unreachable";
}

async function preflight(): Promise<PreflightResult> {
  if (!process.env[PASSWORD_ENV]) {
    return {
      ok: false,
      code: "server_auth_missing",
      message: `${PASSWORD_ENV} is required`,
    };
  }
  try {
    const res = await fetch(`${serverUrl()}/app`, {
      method: "GET",
      headers: authHeader(),
    });
    if (res.ok || res.status === 404) return { ok: true };
    const text = sanitize(await res.text());
    const code = classify(res.status);
    return {
      ok: false,
      code,
      message: `preflight /app failed: ${res.status} ${text}`,
    };
  } catch (error) {
    return {
      ok: false,
      code: "server_unreachable",
      message: sanitize(String(error)),
    };
  }
}

export function buildSessionPayload(args: {
  scope: string;
  cwd?: string;
  parent_session_id?: string;
}): Record<string, string> {
  const directory = path.resolve(args.cwd || process.cwd());
  const body: Record<string, string> = {
    title: `sage:${args.scope}`,
    project: path.basename(directory),
    directory,
  };
  if (args.parent_session_id) body.parent_id = args.parent_session_id;
  return body;
}

export function formatError(
  error: unknown,
  hint?: string,
  extra?: Record<string, string>,
): string {
  if (error instanceof OpenCodeApiError) {
    return JSON.stringify(
      {
        ok: false,
        code: error.code,
        endpoint: error.apiPath,
        message: error.message,
        hint,
        ...extra,
      },
      null,
      2,
    );
  }
  return JSON.stringify(
    {
      ok: false,
      code: "server_error",
      message: sanitize(String(error)),
      hint,
      ...extra,
    },
    null,
    2,
  );
}

export async function api<T = any>(
  method: "GET" | "POST" | "DELETE" | "PATCH",
  apiPath: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${serverUrl()}${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = sanitize(await res.text());
    throw new OpenCodeApiError(
      classify(res.status),
      res.status,
      apiPath,
      `${method} ${apiPath}: ${res.status} ${text}`,
    );
  }
  if (res.status === 204) return {} as T;
  if (typeof res.text === "function") {
    const text = await res.text();
    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  }
  return res.json() as Promise<T>;
}

export async function ensureReady(): Promise<string | undefined> {
  const result = await preflight();
  if (result.ok) return undefined;
  return JSON.stringify(result, null, 2);
}

export const multiplexInternals = {
  authHeader,
  preflight,
  buildSessionPayload,
};
