import type { RoomTheme } from "@/lib/room-themes"

/**
 * 해도리 방 바탕 (벽 + 바닥). 부모는 relative + overflow-hidden 이어야 한다.
 * 해도리 화면과 진주 상점 미리보기에서 같이 쓴다.
 */
export default function RoomBackground({ theme }: { theme: RoomTheme }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: theme.base }} />

      {/* 창가 빛 */}
      <div
        className="absolute left-0 top-0 h-full w-[19%]"
        style={{ background: theme.curtain }}
      />

      {/* 벽 */}
      <div
        className="absolute left-0 right-0 top-0 h-[74%]"
        style={{ background: theme.wall }}
      />
      {theme.wallPattern && (
        <div
          className="absolute left-0 right-0 top-0 h-[70%]"
          style={{
            backgroundImage: theme.wallPattern.image,
            backgroundSize: theme.wallPattern.size,
          }}
        />
      )}

      {/* 바닥 */}
      <div
        className="absolute bottom-0 left-0 h-[30%] w-full"
        style={{
          background: theme.floor,
          borderTop: `1px solid ${theme.floorBorder}`,
        }}
      />
      {theme.floorPattern && (
        <div
          className="absolute bottom-0 left-0 h-[30%] w-full"
          style={{
            backgroundImage: theme.floorPattern.image,
            backgroundSize: theme.floorPattern.size,
          }}
        />
      )}

      {/* 바닥 라인 */}
      <div className="absolute bottom-[25%] left-0 h-px w-full" style={{ background: theme.floorLine }} />
      <div className="absolute bottom-[18%] left-0 h-px w-full" style={{ background: theme.floorLine }} />
      <div className="absolute bottom-[10%] left-0 h-px w-full" style={{ background: theme.floorLine }} />
    </div>
  )
}
