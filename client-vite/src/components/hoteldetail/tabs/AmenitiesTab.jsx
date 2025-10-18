import React from "react";
import { Star } from "lucide-react";


export default function AmenitiesTab({ amenities = [], services = [], hotel, average, reviews }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Tiện nghi & Dịch vụ nổi bật</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Tiện nghi + Dịch vụ */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tiện nghi phổ biến */}
          <section>
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Tiện nghi phổ biến
            </h3>
            {amenities.length === 0 ? (
              <p className="text-gray-600 text-sm">Chưa có dữ liệu tiện nghi.</p>
            ) : (
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {amenities.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border rounded-md px-3 py-1.5 hover:bg-blue-50 transition"
                  >
                    ✔ {a}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Dịch vụ khách sạn */}
          <section>
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Dịch vụ khách sạn
            </h3>
            {services.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Hiện khách sạn chưa cập nhật dịch vụ.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((s) => (
                  <div
                    key={s._id}
                    className="p-3 border rounded-lg bg-gray-50 hover:shadow-md transition"
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="rounded-md w-full h-28 object-cover"
                      />
                    )}
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-blue-700">
                        {s.name}
                      </h4>
                      <p className="text-gray-600 text-xs line-clamp-2">
                        {s.description}
                      </p>
                      {s.price > 0 ? (
                        <p className="text-green-600 text-sm font-medium mt-1">
                          {s.price.toLocaleString()} VND
                        </p>
                      ) : (
                        <p className="text-green-600 text-sm font-medium mt-1">
                          Miễn phí
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
