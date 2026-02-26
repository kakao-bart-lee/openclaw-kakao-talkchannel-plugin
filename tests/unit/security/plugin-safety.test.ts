/**
 * 플러그인 보안 체크리스트 테스트
 *
 * OpenClaw v2026.2.1+ 보안 스캐너 호환성 확인.
 * 플러그인 소스 코드에 위험 패턴이 없는지 정적 분석.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC_DIR = join(__dirname, "../../../src");

/** src/ 하위의 모든 .ts 파일을 재귀 수집 */
function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("플러그인 보안 체크리스트", () => {
  const sourceFiles = collectTsFiles(SRC_DIR);

  it("소스 파일이 존재한다", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("eval() 호출이 없다", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      // eval( 패턴 매치 (문자열 리터럴 내부 제외 불가하므로 단순 검사)
      expect(content).not.toMatch(/\beval\s*\(/);
    }
  });

  it("new Function() 호출이 없다", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/new\s+Function\s*\(/);
    }
  });

  it("child_process 모듈 사용이 없다", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/child_process/);
    }
  });

  it("fs.writeFile / fs.unlink 직접 사용이 없다", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/\bfs\.(writeFile|unlink|rmdir|rm)\b/);
    }
  });

  it("process.env에서 토큰을 하드코딩하지 않는다", () => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      // 하드코딩된 토큰 패턴 (API key, secret 등)
      expect(content).not.toMatch(
        /["'](sk-|ghp_|gho_|Bearer\s+[A-Za-z0-9]{20,})["']/
      );
    }
  });

  describe("민감 필드 표시 (openclaw.plugin.json)", () => {
    let pluginJson: Record<string, unknown>;

    it("openclaw.plugin.json을 파싱할 수 있다", () => {
      const content = readFileSync(
        join(__dirname, "../../../openclaw.plugin.json"),
        "utf-8"
      );
      pluginJson = JSON.parse(content);
      expect(pluginJson).toBeDefined();
    });

    it("relayToken에 sensitive: true가 설정되어 있다", () => {
      const content = readFileSync(
        join(__dirname, "../../../openclaw.plugin.json"),
        "utf-8"
      );
      pluginJson = JSON.parse(content);
      const hints = pluginJson.uiHints as Record<
        string,
        { sensitive?: boolean }
      >;
      expect(hints["accounts.*.relayToken"]?.sensitive).toBe(true);
    });

    it("sessionToken에 sensitive: true가 설정되어 있다", () => {
      const content = readFileSync(
        join(__dirname, "../../../openclaw.plugin.json"),
        "utf-8"
      );
      pluginJson = JSON.parse(content);
      const hints = pluginJson.uiHints as Record<
        string,
        { sensitive?: boolean }
      >;
      expect(hints["accounts.*.sessionToken"]?.sensitive).toBe(true);
    });
  });

  describe("토큰 상태 마스킹", () => {
    it("relay 상태 응답에서 토큰 존재 여부를 직접 노출하지 않는다", () => {
      const gatewayContent = readFileSync(
        join(SRC_DIR, "adapters/gateway.ts"),
        "utf-8"
      );
      // "토큰 없음" 같은 직접적인 토큰 유무 표시가 없어야 함
      expect(gatewayContent).not.toContain('"토큰 없음"');
      expect(gatewayContent).not.toContain("'토큰 없음'");
    });
  });
});
