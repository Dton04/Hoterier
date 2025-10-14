import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";


function FestivalHotels() {
  const { id } = useParams();
  const [festival, setFestival] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Xác định ảnh hiệu ứng theo mùa
  const getEffectByFestival = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("đông")) return "/images/snowing.gif";
    if (lower.includes("hè")) return "/images/sunlight.gif";
    if (lower.includes("thu")) return "/images/leaves.gif";
    if (lower.includes("xuân")) return "/images/cherry.gif";
    return "/images/snowing.gif"; // mặc định
  };

  // Lấy thông tin lễ hội + khách sạn + khu vực
  useEffect(() => {
    const fetchFestivalHotels = async () => {
      try {
        const { data } = await axios.get(`/api/discounts/${id}/festival-hotels`);
        setFestival(data.festival);
        setHotels(data.hotels);
      } catch (error) {
        console.error("Lỗi khi tải danh sách lễ hội:", error);
        setError("Không thể tải dữ liệu lễ hội. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    const fetchRegions = async () => {
      try {
        const { data } = await axios.get("/api/regions");
        setRegions(data);
      } catch (err) {
        console.error("Lỗi khi tải khu vực:", err);
      }
    };

    fetchFestivalHotels();
    fetchRegions();
  }, [id]);

  // Lọc khách sạn theo khu vực
  const filteredHotels = selectedRegion
    ? hotels.filter((h) => h.region?._id === selectedRegion)
    : hotels;

  // Lấy giá thấp nhất đã giảm trong danh sách phòng
  const getLowestDiscountedPrice = (hotel) => {
  if (!hotel.rooms || hotel.rooms.length === 0) return 0;
  return Math.min(...hotel.rooms.map(r => r.discountedPrice || r.rentperday || 0));
};




  const formatPrice = (price) => {
    return price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0 VND";
  };

  const handleViewDetails = (hotel) => {
    if (!festival) {
      alert("Dữ liệu lễ hội chưa sẵn sàng, vui lòng thử lại!");
      return;
    }

    navigate(`/hotel/${hotel._id}`, {
      state: {
        festival: {
          _id: festival._id,
          name: festival.name,
          discountType: festival.discountType,
          discountValue: festival.discountValue,
        },
      },
    });
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải ưu đãi...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const effectImage = getEffectByFestival(festival?.name);

  return (
    <div className="festival-page">
      {/* Banner lễ hội */}
      <div className="festival-banner position-relative text-center">
        <img src={effectImage} alt="festival effect" className="festival-effect" />
        <div className="festival-overlay">
          <h1 className="festival-title">{festival?.name}</h1>
          <p className="festival-description">{festival?.description}</p>
          <Badge bg="danger" className="festival-discount-badge">
            Giảm{" "}
            {festival?.discountType === "percentage"
              ? `${festival.discountValue}%`
              : formatPrice(festival.discountValue)}
          </Badge>
        </div>
      </div>

      {/* Khu vực và khách sạn */}
      <Container className="py-5">
        <h2 className="text-center mb-4 fw-bold">Chọn khu vực</h2>
        <div className="region-filter mb-5 text-center">
          <Button
            variant={selectedRegion === null ? "primary" : "outline-primary"}
            className="region-button mx-2"
            onClick={() => setSelectedRegion(null)}
          >
            Tất cả
          </Button>
          {regions.map((r) => (
            <Button
              key={r._id}
              variant={selectedRegion === r._id ? "primary" : "outline-primary"}
              className="region-button mx-2"
              onClick={() => setSelectedRegion(r._id)}
            >
              {r.name}
            </Button>
          ))}
        </div>

        <h3 className="text-center mb-5 fw-bold">
          {selectedRegion
            ? `Khách sạn tại ${regions.find((r) => r._id === selectedRegion)?.name}`
            : "Tất cả khách sạn trong lễ hội"}
        </h3>

        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredHotels.length > 0 ? (
            filteredHotels.map((hotel) => (
              <Col key={hotel._id}>
                <Card className="hotel-card h-100 shadow-sm border-0">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={hotel.imageurls?.[0] || "/default-hotel.jpg"}
                      alt={hotel.name}
                      className="hotel-image"
                      onClick={() => handleViewDetails(hotel)}
                    />
                    <Badge bg="danger" className="discount-badge">
                      {festival?.discountType === "percentage"
                        ? `-${festival.discountValue}%`
                        : `-${formatPrice(festival.discountValue)}`}
                    </Badge>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="hotel-title">{hotel.name}</Card.Title>
                    <Card.Text className="hotel-address">
                      <FaMapMarkerAlt className="me-2" />
                      {hotel.address}
                    </Card.Text>
                    <div className="hotel-rating mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < Math.round(hotel.rating || 4) ? "text-warning" : "text-muted"}
                        />
                      ))}
                      <span className="ms-2">({hotel.rating || 4.0})</span>
                    </div>
                    <div className="hotel-prices mt-auto">
                      <span className="original-price">{formatPrice(hotel.rooms?.[0]?.rentperday)}</span>
                      <span className="discounted-price">
                        Chỉ từ <strong>{formatPrice(getLowestDiscountedPrice(hotel))}</strong>/đêm
                      </span>

                    </div>
                    <Button
                      variant="primary"
                      className="view-details-button mt-3"
                      onClick={() => handleViewDetails(hotel)}
                    >
                      Xem chi tiết
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info" className="text-center">
                Không tìm thấy khách sạn nào trong khu vực này.
              </Alert>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
}

export default FestivalHotels;