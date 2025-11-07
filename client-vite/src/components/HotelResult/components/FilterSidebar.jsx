import React from "react";
import { FaStar } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function FilterSidebar({
   regions,
   filters,
   setFilters,
   showAllRegions,
   setShowAllRegions,
   filteredHotels,
   navigate,
   resetFilters,
   services,
   amenities,
   setShowMapModal,
}) {
   return (
      <>
         {/* SIDEBAR */}
         <aside className="hidden lg:block bg-white rounded-xl shadow-md sticky top-24 h-fit p-4 col-span-1 mr-4 w-[105%]">
            <h3 className="text-xl font-semibold text-[#003580] mb-4">
               Bộ lọc tìm kiếm
            </h3>
            {/* 🗺️ Bản đồ khu vực */}
            <div className="border-b pb-4 mb-4">

               <div className="h-60 w-full rounded-lg overflow-hidden relative border">
                  <MapContainer
                     center={[10.7769, 106.7009]}
                     zoom={12}
                     scrollWheelZoom={false}
                     className="h-full w-full z-0"
                  >
                     <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                     />
                     {filteredHotels
                        .filter((h) => h.latitude && h.longitude)
                        .map((h, i) => (
                           <Marker key={i} position={[h.latitude, h.longitude]}>
                              <Popup>
                                 <strong>{h.name}</strong>
                                 <br />
                                 {h.address}
                              </Popup>
                           </Marker>
                        ))}
                  </MapContainer>

                  <button
                     onClick={() => setShowMapModal(true)}
                     className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-[#0071c2] hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-md transition mb-5"
                  >
                     Hiển thị trên bản đồ
                  </button>
               </div>
            </div>

            {/* 🌍 Điểm đến hàng đầu ở Việt Nam */}
            <div className="border-b pb-4 mb-5">
               <h4 className="text-gray-700 font-semibold mb-3 text-[15px]">
                  Điểm đến hàng đầu ở Việt Nam
               </h4>

               {regions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Đang tải...</p>
               ) : (
                  <>
                     {/* Hiển thị tối đa 13 vùng, có thể mở rộng */}
                     {regions
                        .slice(0, showAllRegions ? regions.length : 13)
                        .map((region) => (
                           <label
                              key={region._id}
                              onClick={() =>
                                 navigate(`/hotel-results?region=${encodeURIComponent(region.name)}`)
                              }
                              className="flex items-center space-x-2 cursor-pointer text-sm mb-1 hover:text-[#003580] transition"
                           >
                              <input
                                 type="checkbox"
                                 checked={filters.region === region.name}
                                 onChange={() =>
                                    setFilters({
                                       ...filters,
                                       region: region.name,
                                       city: "",
                                    })
                                 }
                                 className="accent-blue-600"
                              />
                              <span>{region.name}</span>
                           </label>
                        ))}

                     {/* Nút mở rộng / thu gọn */}
                     {regions.length > 13 && (
                        <button
                           onClick={() => setShowAllRegions((prev) => !prev)}
                           className="text-[#0071c2] text-sm mt-1 hover:underline"
                        >
                           {showAllRegions ? "Ẩn bớt" : `Hiển thị tất cả ${regions.length} loại`}
                        </button>
                     )}
                  </>
               )}
            </div>

            {/* 🏙️ Thành phố / Quận theo khu vực đã chọn */}
            {filters.region && (() => {
               const selected = regions.find((r) => r.name === filters.region);
               if (!selected?.cities?.length) return null;

               return (
                  <div className="border-b pb-5 mb-5">
                     <h4 className="text-gray-700 font-semibold mb-3 text-[15px]">
                        Thành phố / Quận tại {selected.name}
                     </h4>
                     <div className="grid grid-cols-2 gap-2">
                        {selected.cities.map((c, i) => (
                           <button
                              key={i}
                              onClick={() => {
                                 setFilters({ ...filters, city: c.name });
                                 navigate(
                                    `/hotel-results?region=${encodeURIComponent(filters.region)}&district=${encodeURIComponent(c.name)}`
                                 );
                              }}

                              className={`text-xs sm:text-sm rounded-lg border p-2 transition-all duration-200 ${filters.city === c.name
                                 ? "bg-[#0071c2] text-white border-[#0071c2]"
                                 : "bg-gray-50 hover:bg-blue-50 border-gray-200 text-gray-700"
                                 }`}
                           >
                              {c.name}
                           </button>
                        ))}
                     </div>
                  </div>
               );
            })()}

            {/* Price */}
            <div className="border-b pb-4 mb-4">
               <h4 className="text-gray-700 font-medium mb-2">Khoảng giá (VND)</h4>
               <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="500000"
                  value={filters.maxPrice}
                  onChange={(e) =>
                     setFilters({ ...filters, maxPrice: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600"
               />
               <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Tối đa: {filters.maxPrice.toLocaleString()}₫</span>
               </div>
            </div>

            {/* Rating */}
            <div className="border-b pb-4 mb-4">
               <h4 className="text-gray-700 font-medium mb-2">Điểm đánh giá</h4>
               {[5, 4, 3, 2, 1].map((r) => (
                  <label key={r} className="flex items-center space-x-2 cursor-pointer mb-1">
                     <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === r}
                        onChange={() => setFilters({ ...filters, rating: r })}
                        className="accent-blue-600"
                     />
                     <div className="flex text-yellow-400">
                        {[...Array(r)].map((_, i) => <FaStar key={i} />)}
                     </div>
                     <span className="text-sm text-gray-600 ml-1">trở lên</span>
                  </label>
               ))}
            </div>

            {/* Star rating */}
            <div className="border-b pb-4 mb-4">
               <h4 className="text-gray-700 font-medium mb-2">Xếp hạng chỗ nghỉ</h4>
               {[5, 4, 3, 2, 1].map((star) => (
                  <label key={star} className="flex items-center space-x-2 cursor-pointer mb-1">
                     <input
                        type="checkbox"
                        checked={filters.starRatings.includes(star)}
                        onChange={() =>
                           setFilters((prev) => ({
                              ...prev,
                              starRatings: prev.starRatings.includes(star)
                                 ? prev.starRatings.filter((s) => s !== star)
                                 : [...prev.starRatings, star],
                           }))
                        }
                     />
                     <div className="flex text-yellow-400">
                        {[...Array(star)].map((_, i) => <FaStar key={i} />)}
                     </div>
                  </label>
               ))}
            </div>

            {/* Dịch vụ khách sạn */}
            <div className="border-b pb-4 mb-4">
               <h4 className="text-gray-700 font-medium mb-2">Dịch vụ khách sạn</h4>
               <div className="max-h-40 overflow-y-auto">
                  {services.map((s) => (
                     <label key={s} className="flex items-center space-x-2 text-sm cursor-pointer mb-1">
                        <input
                           type="checkbox"
                           checked={filters.services.includes(s)}
                           onChange={() =>
                              setFilters((prev) => ({
                                 ...prev,
                                 services: prev.services.includes(s)
                                    ? prev.services.filter((v) => v !== s)
                                    : [...prev.services, s],
                              }))
                           }
                           className="accent-blue-600"
                        />
                        <span>{s}</span>
                     </label>
                  ))}
               </div>
            </div>

            {/* Tiện nghi phòng */}
            <div className="border-b pb-4 mb-4">
               <h4 className="text-gray-700 font-medium mb-2">Tiện nghi phòng</h4>
               <div className="max-h-40 overflow-y-auto">
                  {amenities.map((name) => (
                     <label key={name} className="flex items-center space-x-2 text-sm cursor-pointer mb-1">
                        <input
                           type="checkbox"
                           checked={filters.amenities.includes(name)}
                           onChange={() =>
                              setFilters((prev) => ({
                                 ...prev,
                                 amenities: prev.amenities.includes(name)
                                    ? prev.amenities.filter((v) => v !== name)
                                    : [...prev.amenities, name],
                              }))
                           }
                           className="accent-blue-600"
                        />
                        <span>{name}</span>
                     </label>
                  ))}
               </div>
            </div>



            <button
               onClick={resetFilters}
               className="w-full mt-5 bg-[#003580] text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
            >
               Đặt lại bộ lọc
            </button>
         </aside>
      </>
   );
}
