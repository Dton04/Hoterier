import React, { useEffect, useState } from "react";
import AdminRengionImageUpload from "./AdminRegionImageUpload";

function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [newImage, setNewImage] = useState(null);
  // Load regions
  const fetchRegions = async () => {
    try {
      const res = await fetch("/api/regions");
      const data = await res.json();
      setRegions(data);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);


  const handleCreateRegion = async () => {
    if (!newRegion.trim()) {
      alert("Vui lòng nhập tên khu vực!");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", newRegion);
      if (newImage) formData.append("image", newImage);


      const res = await fetch("/api/regions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Tạo khu vực thành công!");
        setNewRegion("");
        setNewImage(null);
        fetchRegions();
      } else {
        alert(data.message || "Lỗi khi tạo khu vực");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  // Callback khi upload ảnh
  const handleImageUploaded = (updatedRegion) => {
    setRegions(prev =>
      prev.map(r => r._id === updatedRegion._id ? updatedRegion : r)
    );
  };

  return (
    <div className="container my-4">
      <h2>Quản lý Khu vực</h2>

      {/* 🆕 Form tạo khu vực kèm upload ảnh */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <input
              type="text"
              placeholder="Tên khu vực mới"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="form-control"
            />
          </div>
          <div className="col-md-3 text-end">
            <button
              className="btn btn-primary w-100"
              onClick={handleCreateRegion}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Thêm khu vực"}
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách khu vực */}
      <div className="row">
        {regions.map((region) => (
          <div key={region._id} className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <img
                src={region.imageUrl || "/images/placeholder.jpg"}
                alt={region.name}
                className="card-img-top"
                style={{
                  height: "200px",
                  objectFit: "cover",
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px",
                }}
              />
              <div className="card-body text-center">
                <h5 className="card-title fw-bold mb-2">{region.name}</h5>
                <AdminRengionImageUpload
                  regionId={region._id}
                  onUploaded={handleImageUploaded}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRegions;
