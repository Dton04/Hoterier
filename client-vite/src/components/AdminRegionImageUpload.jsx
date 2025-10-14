import React, {useState} from 'react';


function AdminRengionImageUpload({regionId,onUploaded}) {
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
      const res = await fetch(`http://localhost:5000/api/regions/${regionId}/image`, {
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
    <div className="region-upload">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" style={{ maxWidth: "200px", marginTop: "10px" }} />
        </div>
      )}
      <button className="btn btn-primary mt-2" onClick={handleUpload} disabled={loading}>
        {loading ? "Đang tải..." : "Upload Ảnh"}
      </button>
    </div>
  );

}
export default AdminRengionImageUpload;