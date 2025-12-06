import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mail, Phone, Upload } from "lucide-react";

const StaffCreateHotel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
    district: "",
    city: "",
    contactNumber: "",
    email: "",
    description: "",
    starRating: 3,
  });

  const [regions, setRegions] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
  };
  
  // Tự động điền email của staff và khóa lại
  useEffect(() => {
    if (userInfo?.user?.email) {
      setFormData(prev => ({ ...prev, email: userInfo.user.email }));
    } else if (userInfo?.email) {
       // Fallback nếu cấu trúc object khác
       setFormData(prev => ({ ...prev, email: userInfo.email }));
    }
  }, []);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data } = await axios.get("/api/regions", config);
        setRegions(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Lỗi khi tải danh sách khu vực");
      }
    };
    fetchRegions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);

    imagePreview.forEach(url => URL.revokeObjectURL(url));
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning('Vui lòng nhập tên khách sạn');
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang tạo yêu cầu...');

    try {
      const payload = {
        ...formData,
        district: formData.city, // Mapping city to district as per original logic
        starRating: Number(formData.starRating),
        isApproved: false // Explicitly set to false
      };

      const { data } = await axios.post("/api/hotels", payload, config);
      const savedHotelId = data.hotel._id;

      if (newImages.length > 0) {
        const imagePayload = new FormData();
        newImages.forEach((image) => imagePayload.append("images", image));
        await axios.post(`/api/hotels/${savedHotelId}/images`, imagePayload, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${userInfo.token}` },
        });
      }

      toast.dismiss(loadingToast);
      toast.success("Đã gửi yêu cầu tạo khách sạn! Vui lòng chờ Admin duyệt.");
      setTimeout(() => navigate("/staff/hotels"), 2000);

    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 2xl:p-10 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Đăng ký Khách sạn mới</h2>
        <nav>
          <ol className="flex items-center gap-2 text-sm">
            <li><Link to="/staff/dashboard" className="text-gray-500 hover:text-blue-600">Dashboard /</Link></li>
            <li className="text-blue-600 font-medium">Tạo khách sạn</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Tên khách sạn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="VD: Khách sạn ABC"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Địa chỉ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Số nhà, đường..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Khu vực <span className="text-red-500">*</span></label>
                <select
                  name="region"
                  value={formData.region ? `${formData.region}|${formData.city}` : ""}
                  onChange={(e) => {
                    const [regionId, cityName] = e.target.value.split("|");
                    setFormData(prev => ({ ...prev, region: regionId, city: cityName || "" }));
                  }}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {regions.map((region) => (
                    <optgroup key={region._id} label={region.name}>
                      {region.cities?.map((city, i) => (
                        <option key={i} value={`${region._id}|${city.name}`}>{city.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  placeholder="Giới thiệu về khách sạn..."
                ></textarea>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Email liên hệ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    // onChange={handleInputChange} // Không cho phép sửa
                    readOnly // Chỉ đọc
                    disabled // Vô hiệu hóa input
                    required
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none" // Style cho trạng thái disabled
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Hạng sao</label>
                <input
                  type="number"
                  name="starRating"
                  min="1"
                  max="5"
                  value={formData.starRating}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Hình ảnh</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500">Kéo thả hoặc click để tải ảnh lên</p>
                </div>
                {imagePreview.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {imagePreview.map((url, idx) => (
                      <img key={idx} src={url} alt="Preview" className="h-20 w-full object-cover rounded-md border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/staff/hotels")}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Gửi Yêu Cầu Duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffCreateHotel;
