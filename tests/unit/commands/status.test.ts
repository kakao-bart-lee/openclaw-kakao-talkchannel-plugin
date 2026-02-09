/**
 * /status 커맨드 테스트
 */
import { describe, it, expect } from "vitest";
import {
  statusCommand,
  handleStatusCommand,
} from "../../../src/commands/status";

describe("statusCommand 정의", () => {
  it("name이 'status'이다", () => {
    expect(statusCommand.name).toBe("status");
  });

  it("description이 정의되어 있다", () => {
    expect(statusCommand.description).toBeTruthy();
    expect(statusCommand.description).toContain("릴레이");
  });

  it("aliases에 'st'가 포함된다", () => {
    expect(statusCommand.aliases).toEqual(["st"]);
  });
});

describe("handleStatusCommand", () => {
  it("handled: true를 반환한다", async () => {
    const result = await handleStatusCommand({
      userId: "user123",
      accountId: "default",
      args: [],
    });

    expect(result.handled).toBe(true);
  });

  it("상태 텍스트에 userId를 포함한다", async () => {
    const result = await handleStatusCommand({
      userId: "kakao-user-456",
      accountId: "default",
      args: [],
    });

    expect(result.text).toContain("kakao-user-456");
  });

  it("상태 텍스트에 accountId를 포함한다", async () => {
    const result = await handleStatusCommand({
      userId: "user1",
      accountId: "my-account",
      args: [],
    });

    expect(result.text).toContain("my-account");
  });

  it("상태 텍스트에 플러그인 이름을 포함한다", async () => {
    const result = await handleStatusCommand({
      userId: "user1",
      accountId: "default",
      args: [],
    });

    expect(result.text).toContain("kakao-talkchannel");
  });
});
