// SuggestedRoomCombos.js
// CHUẨN BOOKING.COM – cho phép phòng trùng nhau

export function getSuggestedRoomCombos(rooms, totalGuests, roomsNeeded) {
  if (!rooms?.length) return null;

  // Chỉ lấy phòng available
  const available = rooms.filter(r => r.availabilityStatus === "available");
  if (!available.length) return null;

  // SORT phòng theo maxcount giảm dần → ưu tiên phòng lớn
  const sorted = [...available].sort((a, b) => b.maxcount - a.maxcount);

  // 👉 CASE 1: Nếu khách sạn chỉ có 1 loại phòng → trả về roomsNeeded lần
  if (sorted.length === 1) {
    const room = sorted[0];
    const result = [];

    for (let i = 0; i < roomsNeeded; i++) {
      result.push({
        ...room,
        roomsBooked: 1
      });
    }

    return result;
  }

  // 👉 CASE 2: Nhiều loại phòng → chọn phòng lớn nhất trước
  let remaining = totalGuests;
  let result = [];

  for (const room of sorted) {
    const cap = room.maxcount;

    // số phòng loại này cần dùng
    const need = Math.min(roomsNeeded - result.length, Math.ceil(remaining / cap));

    for (let i = 0; i < need; i++) {
      result.push({ ...room, roomsBooked: 1 });
      remaining -= cap;
      if (result.length >= roomsNeeded || remaining <= 0) break;
    }

    if (result.length >= roomsNeeded || remaining <= 0) break;
  }

  // Nếu còn thiếu phòng → bổ sung phòng nhỏ nhất
  while (result.length < roomsNeeded) {
    const smallest = sorted[sorted.length - 1];
    result.push({ ...smallest, roomsBooked: 1 });
  }

  return result;
}
