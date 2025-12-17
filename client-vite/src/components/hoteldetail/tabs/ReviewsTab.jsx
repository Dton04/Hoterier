import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import "moment/locale/vi";

export default function ReviewsTab({ hotel, reviews = [], average = 0 }) {
  const [selectedFilter, setSelectedFilter] = useState({
    type: "Tất cả",
    score: "Tất cả",
    language: "Tất cả",
    time: "Tất cả",
  });

  const [localReviews, setLocalReviews] = useState(reviews || []);
  const [expanded, setExpanded] = useState({});
  const [categoriesAvg, setCategoriesAvg] = useState(null);
  const user = useSelector((state) => state.loginUserReducer.currentUser);
  const [eligibility, setEligibility] = useState({ canReview: false, hasReviewed: false });
  const [showModal, setShowModal] = useState(false);
  const [formRating, setFormRating] = useState(10);
  const [formComment, setFormComment] = useState("");
  const [formCriteria, setFormCriteria] = useState({ cleanliness: 10, comfort: 10, staff: 10, location: 10, facilities: 10, value: 10 });

  useEffect(() => {
    setLocalReviews(reviews || []);
  }, [reviews]);

  useEffect(() => {
    const hotelId = hotel?._id || hotel?.id;
    if (!hotelId) return;
    axios.get(`/api/reviews/categories-average`, { params: { hotelId } })
      .then((res) => setCategoriesAvg(res.data.average))
      .catch(() => setCategoriesAvg(null));
  }, [hotel]);

  useEffect(() => {
    const hotelId = hotel?._id || hotel?.id;
    if (!hotelId || !user?.token) return;
    axios.get(`/api/reviews/eligibility`, { params: { hotelId }, headers: { Authorization: `Bearer ${user.token}` } })
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility({ canReview: false, hasReviewed: false }));
  }, [hotel, user]);

  const computedAverage = useMemo(() => {
    if (!localReviews?.length) return average || 0;
    const sum = localReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
    return sum / localReviews.length;
  }, [localReviews, average]);

  const handleSubmitReview = async () => {
    const hotelId = hotel?._id || hotel?.id;
    if (!user?.token || !hotelId) return;
    if (!formComment.trim()) return;
    try {
      await axios.post(`/api/reviews`, { hotelId, rating: formRating, comment: formComment.trim(), criteriaRatings: formCriteria }, { headers: { Authorization: `Bearer ${user.token}` } });
      const res = await axios.get(`/api/reviews`, { params: { hotelId } });
      setLocalReviews(res.data.reviews || []);
      const cats = await axios.get(`/api/reviews/categories-average`, { params: { hotelId } });
      setCategoriesAvg(cats.data.average);
      setShowModal(false);
      setFormComment("");

      toast.success("Đánh giá thành công!");

    } catch { }
  };



  return (
    <div className="bg-white rounded-xl border shadow-lg p-6 space-y-10">
      {/* === PHẦN TỔNG QUAN === */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Đánh giá của khách về {hotel?.name || "khách sạn này"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Chúng tôi cố gắng mang đến 100% đánh giá thật từ khách hàng
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-blue-700">
            {Number(computedAverage || 0).toFixed(1)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">Tuyệt vời</p>
            <p className="text-gray-500 text-sm">{localReviews.length} đánh giá</p>
          </div>
        </div>
      </div>

      {/* === HẠNG MỤC === */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Hạng mục</h3>
          <button
            onClick={() => setShowModal(true)}
            disabled={!eligibility.canReview || eligibility.hasReviewed}
            className={`px-4 py-1.5 rounded-md text-sm ${eligibility.canReview && !eligibility.hasReviewed ? "bg-[#003580] text-white" : "bg-gray-200 text-gray-500"}`}
          >
            Viết đánh giá
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-12">
          {[
            { key: "staff", label: "Nhân viên phục vụ" },
            { key: "facilities", label: "Tiện nghi" },
            { key: "cleanliness", label: "Sạch sẽ" },
            { key: "comfort", label: "Thoải mái" },
            { key: "value", label: "Đáng giá tiền" },
            { key: "location", label: "Địa điểm" },
          ].map((c) => {
            const score = categoriesAvg?.[c.key] ?? 0;
            return (
              <div key={c.key} className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">{c.label}</span>
                <div className="flex items-center gap-2 w-40">
                  <div className="flex-1 bg-gray-200 h-[6px] rounded-full">
                    <div
                      className={`h-[6px] rounded-full ${score >= 9 ? "bg-green-600" : "bg-blue-600"}`}
                      style={{ width: `${(Number(score) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{Number(score).toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === BỘ LỌC === */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Bộ lọc</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          {[
            { key: "type", label: "Khách đánh giá" },
            { key: "score", label: "Điểm đánh giá" },
            { key: "language", label: "Ngôn ngữ" },
            { key: "time", label: "Thời gian" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">
                {f.label}
              </label>
              <select
                value={selectedFilter[f.key]}
                onChange={(e) =>
                  setSelectedFilter({ ...selectedFilter, [f.key]: e.target.value })
                }
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Tất cả</option>
                <option>Khách Việt Nam</option>
                <option>Khách quốc tế</option>
              </select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {["Phòng", "Vị trí", "Sạch sẽ", "Bữa sáng", "Giường", "Nhân viên"].map(
            (tag, i) => (
              <button
                key={i}
                className="px-3 py-1.5 border rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                + {tag}
              </button>
            )
          )}
        </div>
      </div>

      {/* === DANH SÁCH ĐÁNH GIÁ === */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Đánh giá của khách
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localReviews.length === 0 ? (
            <div className="text-gray-600 text-sm">Chưa có đánh giá cho khách sạn này</div>
          ) : (
            localReviews.map((r) => {
              const isExpanded = !!expanded[r._id];
              const raw = r.comment || "";
              const short = raw.length > 200 ? raw.slice(0, 200).trim() + "..." : raw;
              const text = isExpanded ? raw : short;
              return (
                <div key={r._id} className="border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {r.userName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{r.userName || "Không rõ"}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{r.country || ""}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{moment(r.createdAt).format("DD/MM/YYYY")}</p>
                    </div>
                    <div className="bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-lg">
                      {r.rating?.toFixed ? r.rating.toFixed(1) : Number(r.rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="mt-3 text-gray-700">
                    <p className="text-[15px]">“{text}”</p>
                    {raw.length > 200 && (
                      <button
                        onClick={() => setExpanded((s) => ({ ...s, [r._id]: !isExpanded }))}
                        className="mt-2 text-blue-600 hover:underline text-sm"
                      >
                        {isExpanded ? "Thu gọn" : "Tìm hiểu thêm"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowModal(false)}></div>
          <div className="w-full sm:w-[55%] md:w-[50%] lg:w-[45%] bg-white shadow-2xl h-full overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl">✕</button>
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-[#003580]">Viết đánh giá</h2>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Điểm tổng (1–10)</label>
                <input type="number" min={1} max={10} value={formRating} onChange={(e) => setFormRating(Number(e.target.value))} className="border rounded-md px-3 py-1.5 w-24" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Chấm điểm tiêu chí (1–10)</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(formCriteria).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">
                        {k === 'staff' ? 'Nhân viên phục vụ' : k === 'facilities' ? 'Tiện nghi' : k === 'cleanliness' ? 'Sạch sẽ' : k === 'comfort' ? 'Thoải mái' : k === 'value' ? 'Đáng giá tiền' : 'Địa điểm'}
                      </span>
                      <input type="number" min={1} max={10} value={v} onChange={(e) => setFormCriteria((s) => ({ ...s, [k]: Number(e.target.value) }))} className="border rounded-md px-2 py-1 w-20" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nội dung đánh giá</label>
                <textarea rows={4} value={formComment} onChange={(e) => setFormComment(e.target.value)} className="border rounded-md w-full px-3 py-2" placeholder="Hãy chia sẻ trải nghiệm của bạn" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Hủy</button>
                <button onClick={handleSubmitReview} className="px-4 py-2 bg-[#003580] text-white rounded-md">Gửi đánh giá</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
