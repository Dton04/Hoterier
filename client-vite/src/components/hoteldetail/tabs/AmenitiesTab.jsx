import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { iconForAmenity } from "../../../utils/amenityIcons.jsx"



export default function AmenitiesTab({ amenities = [] }) {
  const visible = amenities.slice(0, 8);
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      // focus the close button for accessibility
      setTimeout(() => closeBtnRef.current?.focus(), 50);
      document.body.style.overflow = "hidden"; // prevent background scroll
    } else {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <section>
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Các tiện nghi được ưa chuộng nhất</h3>
            {amenities.length === 0 ? (
              <p className="text-gray-600 text-sm">Chưa có dữ liệu tiện nghi.</p>
            ) : (
              <div className="flex flex-wrap gap-3 items-center">
                {visible.map((a, i) => {
                  const name = typeof a === "string" ? a : a?.name;
                  if (!name) return null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-[#f0fdf4] border border-green-100 text-gray-800 px-3 py-1.5 rounded-full text-sm shadow-sm"
                    >
                      <span className="w-4 h-4 flex items-center justify-center">
                        {iconForAmenity(name)}
                      </span>
                      <span>{name}</span>
                    </div>
                  );
                })}

                {amenities.length > visible.length && (
                  <button
                    onClick={() => setOpen(true)}
                    className="text-sm text-blue-600 hover:underline ml-2"
                    aria-expanded={open}
                    aria-controls="amenities-modal"
                  >
                    Xem tất cả {amenities.length} tiện nghi →
                  </button>
                )}
              </div>
            )}
          </section>


        </div>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          id="amenities-modal"
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 flex items-start justify-end"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="relative bg-white w-full md:w-1/2 h-full overflow-y-auto shadow-2xl border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Các tiện nghi của khách sạn</h3>
                <p className="text-sm text-gray-500">Hiển thị {amenities.length} tiện nghi</p>
              </div>
              <button
                ref={closeBtnRef}
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Đóng danh sách tiện nghi"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {amenities.map((a, i) => {
                  const name = typeof a === "string" ? a : a?.name;
                  if (!name) return null;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 text-green-600">{iconForAmenity(name)}</div>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

