/**
 * /status 커맨드 — registerCommand 패턴 기반
 *
 * device-pair 플러그인의 registerCommand 패턴을 참고하여
 * 향후 코어 커맨드 시스템 연동을 위한 기반을 마련한다.
 *
 * @see docs/upstream-patterns.md
 */

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
}

export interface CommandContext {
  userId: string;
  accountId: string;
  args: string[];
}

export interface CommandResult {
  text?: string;
  handled: boolean;
}

/**
 * /status 커맨드 정의
 *
 * 향후 api.registerCommand()를 통해 코어에 등록할 수 있는 형태.
 */
export const statusCommand: CommandDefinition = {
  name: "status",
  description: "릴레이 연결 상태 및 플러그인 상태를 확인합니다",
  aliases: ["st"],
};

/**
 * /status 커맨드 핸들러
 *
 * 현재는 간단한 상태 텍스트를 반환한다.
 * 향후 statusAdapter.probeTalkChannel()과 연동하여
 * 실시간 릴레이 상태를 포함할 수 있다.
 */
export async function handleStatusCommand(
  ctx: CommandContext
): Promise<CommandResult> {
  const statusText =
    `플러그인: kakao-talkchannel\n` +
    `계정: ${ctx.accountId}\n` +
    `사용자: ${ctx.userId}`;

  return {
    text: statusText,
    handled: true,
  };
}
