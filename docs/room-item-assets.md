# 해도리 방 소품 그림 만들기

해도리 방(정면 단면)에 놓을 소품 그림을 AI 이미지 생성으로 만들고 앱에 넣는 방법.

## 1. 그림체 기준

- 기준 그림: `public/images/haedori-room.jpg` (홈 화면 해도리 방)
- 갈색 외곽선(#8A5A3C 근처), 파스텔 색, 그림자 거의 없음, 귀여운 2D 일러스트
- **정면에서 본 모습** (비스듬한 각도·원근 없음)
- 소품 하나만, 배경은 투명 또는 단색 흰색

## 2. 프롬프트 템플릿

이미지 생성할 때 `haedori-room.jpg`를 참고 이미지로 같이 넣고, `{ITEM}` 자리만 바꿔서 쓴다.

```
A single {ITEM}, front view, flat 2D illustration in the exact style of the reference image:
cute pastel colors, soft warm palette (peach, mint, pink, cream, light wood),
clean brown outlines of even thickness, minimal shading, no perspective, no shadow on the ground.
Centered, the whole object fully visible, nothing else in the image.
Plain pure white background (or transparent). No text, no watermark.
```

| 키 (파일 이름) | 소품 | `{ITEM}` 에 넣을 말 |
|---|---|---|
| `wall_clock` | 벽시계 | round wall clock with a pink rim and cream face |
| `heart_frame` | 하트 액자 | small hanging picture frame with a pink heart drawing, mint frame |
| `round_window` | 동그란 창문 | round wooden window with a cross frame and light blue sky |
| `calendar` | 달력 | wall calendar with a mint header and small date grid |
| `wall_shelf` | 벽 선반 | small wooden wall shelf holding a potted plant, a mug and two books |
| `plant` | 화분 | small potted plant with green leaves in a light wood pot |
| `floor_lamp` | 스탠드 조명 | standing floor lamp with a warm yellow shade and wooden pole |
| `bookshelf` | 책장 | small wooden bookshelf with colorful books and a drawer |
| `cushion` | 쿠션 | soft pink floor cushion |
| `rug` | 러그 | oval mint rug with a dashed stitched border, seen slightly from above |

팁
- 같은 대화(세션)에서 연달아 뽑으면 그림체가 더 잘 맞는다.
- 외곽선 두께가 소품마다 다르면 어색하다. 기준 그림과 나란히 놓고 비교해서 고른다.
- 해상도는 1024px 정도면 충분하다 (스크립트가 600px로 줄인다).

## 3. 앱에 넣기

1. 뽑은 그림을 `raw-items/` 폴더(아무 데나)에 **키 이름으로** 저장한다.
   예: `raw-items/wall_clock.png`, `raw-items/plant.jpg`
2. diary-frontend 폴더에서 실행:
   ```bash
   pip install pillow numpy          # 처음 한 번
   python3 scripts/process-room-items.py raw-items/ --dry-run   # 미리보기
   python3 scripts/process-room-items.py raw-items/
   ```
3. 스크립트가 하는 일
   - 배경 제거 (흰 배경은 가장자리부터 이어진 부분만 지워서, 그림 안의 흰색은 남김)
   - 여백 자르기, 긴 변 600px로 줄이기
   - `public/room-items/<키>.png` 저장
   - `lib/room-items.ts` 해당 소품 줄에 `image`, `aspect` 자동 추가 (다시 돌리면 덮어씀)
4. 크기가 어색하면 `lib/room-items.ts`에서 그 소품의 `width`(방 너비 대비 %)만 조정한다.
5. 빌드해서 확인 후 커밋.

그림이 없는 소품은 `components/room-item-art.tsx`의 임시 SVG 그림이 대신 보인다.

## 4. 새 소품 추가

1. `lib/room-items.ts`의 `ROOM_ITEMS`에 한 줄 추가 (`key`, `name`, `zone`: wall/floor, `width`)
2. 백엔드 `shop_items`에 상품 추가 (`item_type='room_item'`, `item_key` = 같은 키)
   ```sql
   INSERT INTO shop_items (name, description, price, item_type, item_key, is_active, created_at)
   VALUES ('이름', '설명', 100, 'room_item', '새키', 1, NOW());
   ```
3. 위 3번 순서로 그림 넣기
