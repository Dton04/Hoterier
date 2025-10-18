import React, { useState } from 'react';
// Lưu ý: Tên component có thể là AdminRegionImageUpload (sửa lỗi chính tả)
// nhưng giữ nguyên AdminRengionImageUpload để khớp với import trong AdminRegions.jsx
function AdminRengionImageUpload({ regionId, onUploaded }) { 
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Vui lòng chọn ảnh trước!");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      // Giả sử API chạy trên cổng 5000, thay bằng biến môi trường khi deploy
      const res = await fetch(`/api/regions/${regionId}/image`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert("Upload ảnh thành công!");
        setFile(null);
        setPreview(null);
        if (onUploaded) onUploaded(data.region);
      } else {
        alert(data.message || "Lỗi upload ảnh");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Có lỗi khi upload ảnh!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-3 border-t border-gray-100">
      
      {/* Input File - Nút "Chọn ảnh" ẩn */}
      <input 
        type="file" 
        accept="image/*" 
        id={`file-upload-${regionId}`}
        onChange={handleFileChange} 
        className="hidden" // Ẩn input mặc định
      />
      
      {/* Nút bấm để kích hoạt input file */}
      <label 
        htmlFor={`file-upload-${regionId}`}
        className="w-full text-center py-2 px-4 mb-2 text-sm font-medium rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 cursor-pointer transition duration-150"
      >
        {file ? file.name : "Chọn ảnh mới"}
      </label>

      {/* Xem trước ảnh */}
      {preview && (
        <div className="mb-3">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full max-h-32 object-contain rounded" 
          />
        </div>
      )}

      {/* Nút Upload */}
      <button 
        className={`w-full py-2 px-4 text-sm font-bold rounded-lg text-white ${
          file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
        } transition duration-150`}
        onClick={handleUpload} 
        disabled={loading || !file}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang tải...
          </span>
        ) : (
          "Cập nhật ảnh"
        )}
      </button>
    </div>
  );
}
export default AdminRengionImageUpload;