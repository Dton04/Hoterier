import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function ReviewChart({ hotelId }) {
  const [chartData, setChartData] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canViewChart, setCanViewChart] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Lấy thông tin người dùng để kiểm tra vai trò
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userInfo = localStorage.getItem("userInfo");
        if (!userInfo) {
          setCanViewChart(false);
          setUserLoading(false);
          return;
        }

        const parsedUserInfo = JSON.parse(userInfo);
        const token = parsedUserInfo.token;
        if (!token) {
          setCanViewChart(false);
          setUserLoading(false);
          return;
        }

        const response = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data;
        setCanViewChart(user.isAdmin === true || user.role === "staff");
      } catch (error) {
        console.error("Error fetching user profile:", error.response?.status, error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem("userInfo");
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        setCanViewChart(false);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Lấy dữ liệu đánh giá và điểm trung bình
  useEffect(() => {    const fetchReviewData = async () => {
      if (!hotelId || !canViewChart) return;
      try {
        setLoading(true);
        setError(null);

        // Lấy điểm trung bình và tổng số đánh giá của khách sạn
        const averageResponse = await axios.get("/api/reviews/average", { params: { hotelId } });
        setAverageRating(averageResponse.data);

        // Lấy tất cả đánh giá của khách sạn
        const reviewsResponse = await axios.get("/api/reviews", { 
          params: { hotelId }
        });
        const reviews = reviewsResponse.data.reviews || [];

        // Tính số lượng đánh giá theo từng mức sao
        const ratingCounts = Array(5).fill(0);
        reviews.forEach((review) => {
          if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[review.rating - 1]++;
          }
        });

        // Chuẩn bị dữ liệu cho biểu đồ
        const data = ratingCounts.map((count, index) => ({
          name: `${index + 1} sao`,
          count,
        }));
        setChartData(data);
      } catch (error) {
        console.error("Error fetching review data:", error);
        if (error.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("userInfo");
        } else if (error.response?.status === 500) {
          setError("Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.");
        } else {
          setError("Không thể tải dữ liệu đánh giá. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchReviewData();
    }
  }, [hotelId, canViewChart, userLoading]);

  if (userLoading) {
    return <p className="text-center">Đang tải...</p>;
  }

  if (!canViewChart) {
    return null; // Ẩn hoàn toàn khi role là "user"
  }

  return (
    <div className="review-chart">
      <h5>Biểu đồ đánh giá</h5>
      {loading ? (
        <p className="text-center">Đang tải biểu đồ...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : chartData.length > 0 ? (
        <>
          <div className="rating-summary text-center mb-3">
            <p>
              Điểm trung bình: <strong>{averageRating.average.toFixed(1)}</strong>/5 
              ({averageRating.totalReviews} đánh giá)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Số lượng đánh giá" />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p className="text-center">Chưa có đánh giá nào để hiển thị.</p>
      )}
    </div>
  );
}

export default ReviewChart;