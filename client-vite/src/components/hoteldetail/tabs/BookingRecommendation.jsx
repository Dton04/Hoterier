export default function BookingRecommendation({ combo = [], totalGuests, onSelect }) {
  if (!combo.length) return null;

  // allocationResult trả về đúng { ...room, count }
  // => KHÔNG nhóm lại theo _id nữa
  const grouped = combo;

  // Tổng số phòng thực sự dùng
  const totalRooms = grouped.reduce((sum, r) => sum + r.count, 0);

  // Tổng tiền
  const totalPrice = grouped.reduce(
    (total, room) =>
      total + (room.discountedPrice ?? room.rentperday) * room.count,
    0
  );

  return (
    <div className="border rounded-xl shadow-md p-5 bg-white my-6">
      <h2 className="text-2xl font-bold text-blue-700 mb-3">
        Được gợi ý cho {totalGuests} người lớn
      </h2>

      <p className="text-gray-600 mb-4">
        Combo gồm <b>{totalRooms}</b> phòng phù hợp nhất:
      </p>

      <div className="space-y-4">
        {grouped.map((room) => (
          <div key={room._id} className="flex gap-4 border rounded-lg p-3">
            <img
              src={room.imageurls?.[0]}
              className="w-32 h-24 rounded-lg object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold text-blue-700">
                {room.count} × {room.name}
              </p>
              <p className="text-sm text-gray-600">
                Sức chứa mỗi phòng: {room.maxcount} người
              </p>
              <p className="text-sm text-gray-700">
                Giường: {room.beds} • {room.baths} phòng tắm
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-blue-700">
                VND {(room.discountedPrice ?? room.rentperday).toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">/phòng</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4 items-center">
        <p className="text-xl font-bold text-red-600">
          Tổng: VND {totalPrice.toLocaleString()}
        </p>

        <button
          onClick={() => {
            grouped.forEach((room) => {
              window.dispatchEvent(
                new CustomEvent("set-room-quantity", {
                  detail: {
                    roomId: room._id,
                    qty: room.count,
                  },
                })
              );
            });

            document.getElementById("rooms")?.scrollIntoView({
              behavior: "smooth",
            });

            onSelect(grouped);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Đặt các lựa chọn của bạn
        </button>
      </div>
    </div>
  );
}
