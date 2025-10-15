import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");

  const fetchAmenities = async () => {
    const { data } = await axios.get("/api/amenities");
    setAmenities(data);
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleAdd = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleDelete = (item) => {
    setAmenities(amenities.filter((a) => a !== item));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-[#003580] mt-20">Quản lý tiện nghi phòng</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newAmenity}
          onChange={(e) => setNewAmenity(e.target.value)}
          placeholder="Thêm tiện nghi mới..."
          className="flex-1 border rounded-md px-3 py-2"
        />
        <button onClick={handleAdd} className="bg-[#0071c2] text-white px-4 py-2 rounded-md">
          Thêm
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {amenities.map((item, i) => (
          <li key={i} className="flex justify-between items-center py-2">
            <span>{item}</span>
            <button onClick={() => handleDelete(item)} className="text-red-500 hover:underline">
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminAmenities;
