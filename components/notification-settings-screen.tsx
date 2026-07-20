//변환 끝
"use client"

type NotificationSettings = {
  push_enabled: boolean
  fortune_enabled: boolean
  diary_reminder_enabled: boolean
  reply_enabled: boolean
  timezone: string
}

interface NotificationSettingsScreenProps {
  settings: NotificationSettings
  saving: boolean
  webPushEnabled: boolean
  webPushLoading: boolean
  onBack: () => void
  onChange: (key: keyof NotificationSettings, value: boolean | string) => void
  onSave: () => void
  onEnableWebPush: () => void
  onDisableWebPush: () => void
  onTestWebPush: () => void
}

function ToggleRow({
  title,
  description,
  checked,
  disabled = false,
  onToggle,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
        disabled ? "opacity-50" : ""
      }`}
      style={{ background: "#FFFCF8", borderColor: "#E5DDD5" }}
    >
      <div className="pr-4">
        <p className="text-sm font-bold" style={{ color: "#3D3530" }}>
          {title}
        </p>
        <p
          className="text-xs mt-1 leading-relaxed"
          style={{ color: "#9A8F87" }}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="relative w-14 h-8 rounded-full transition-all shrink-0"
        style={{
          background: checked ? "#C9856A" : "#DED6CF",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        aria-pressed={checked}
        aria-label={title}
      >
        <span
          className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
          style={{
            left: checked ? "30px" : "4px",
          }}
        />
      </button>
    </div>
  )
}

export default function NotificationSettingsScreen({
  settings,
  saving,
  webPushEnabled,
  webPushLoading,
  onBack,
  onChange,
  onSave,
  onEnableWebPush,
  onDisableWebPush,
  onTestWebPush,
}: NotificationSettingsScreenProps) {
  return (
    <div
      className="min-h-screen px-5 pt-12 pb-8"
      style={{ background: "#F8F6F2" }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border flex items-center justify-center"
          style={{ background: "#FFFCF8", borderColor: "#E5DDD5" }}
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <h1 className="text-lg font-extrabold" style={{ color: "#3D3530" }}>
          알림 설정
        </h1>

        <div className="w-10" />
      </div>

      <div className="space-y-3">
        <ToggleRow
          title="전체 알림"
          description="해도리의 알림을 전체적으로 받아볼 수 있어"
          checked={settings.push_enabled}
          onToggle={() => onChange("push_enabled", !settings.push_enabled)}
        />

        <ToggleRow
          title="오늘의 운세 알림"
          description="매일 오전 8시에 오늘의 흐름을 알려줄게"
          checked={settings.fortune_enabled}
          disabled={!settings.push_enabled}
          onToggle={() => onChange("fortune_enabled", !settings.fortune_enabled)}
        />

        <ToggleRow
          title="일기 리마인드"
          description="매일 오후 9시에 일기를 아직 안 썼다면 알려줄게"
          checked={settings.diary_reminder_enabled}
          disabled={!settings.push_enabled}
          onToggle={() =>
            onChange(
              "diary_reminder_enabled",
              !settings.diary_reminder_enabled
            )
          }
        />

        <ToggleRow
          title="답장 알림"
          description="다음 날 오전 8시에 해도리 답장을 알려줄게"
          checked={settings.reply_enabled}
          disabled={!settings.push_enabled}
          onToggle={() => onChange("reply_enabled", !settings.reply_enabled)}
        />
      </div>

      <div
        className="mt-6 rounded-2xl border px-4 py-4"
        style={{ background: "#FFFCF8", borderColor: "#E5DDD5" }}
      >
        <p className="text-sm font-bold mb-2" style={{ color: "#3D3530" }}>
          웹 푸시 연결
        </p>

        <p className="text-xs mb-3" style={{ color: "#9A8F87" }}>
          현재 브라우저 상태: {webPushEnabled ? "연결됨" : "연결 안 됨"}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEnableWebPush}
            disabled={webPushLoading}
            className="flex-1 py-2 rounded-xl font-bold text-white transition-all"
            style={{
              background: webPushLoading ? "#C4B8B0" : "#C9856A",
            }}
          >
            {webPushLoading ? "처리 중..." : "웹 알림 켜기"}
          </button>

          <button
            type="button"
            onClick={onDisableWebPush}
            disabled={webPushLoading}
            className="flex-1 py-2 rounded-xl font-bold transition-all"
            style={{
              background: "#EDE8E0",
              color: "#3D3530",
            }}
          >
            웹 알림 끄기
          </button>
        </div>

        <button
          type="button"
          onClick={onTestWebPush}
          disabled={webPushLoading || !webPushEnabled}
          className="w-full mt-2 py-2 rounded-xl font-bold transition-all"
          style={{
            background:
              webPushLoading || !webPushEnabled ? "#DED6CF" : "#A8BBA5",
            color: "#ffffff",
          }}
        >
          테스트 알림 보내기
        </button>
      </div>

      <div
        className="mt-6 rounded-2xl border px-4 py-4"
        style={{ background: "#FFFCF8", borderColor: "#E5DDD5" }}
      >
        <p className="text-sm font-bold mb-2" style={{ color: "#3D3530" }}>
          알림 시간 안내
        </p>
        <div className="space-y-1 text-xs" style={{ color: "#9A8F87" }}>
          <p>• 오늘의 운세: 오전 8시</p>
          <p>• 일기 리마인드: 오후 9시</p>
          <p>• 답장 알림: 다음 날 오전 8시</p>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full mt-8 py-3 rounded-2xl font-bold text-white transition-all"
        style={{ background: saving ? "#C4B8B0" : "#C9856A" }}
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  )
}