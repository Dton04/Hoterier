// src/screens/DealsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const DealsPage = () => {
  const [regions, setRegions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/regions")
      .then(res => setRegions(res.data))
      .catch(err => console.error("Error loading regions:", err));
  }, []);

  return (
    <section className="deals-page py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="subtitle">Điểm đến hàng đầu</h2>
          <h1 className="title">Ưu Đãi Cuối Năm</h1>
        </div>
        <div className="row">
          {regions.map((region, i) => (
            <div className="col-md-3 mb-4" key={region._id}>
              <div className="deal-region-card" onClick={() => navigate(`/hotel-results?destination=${region._id}&deal=true`)}>
                <img
                  src={region.imageUrl || `/images/region-${i + 1}.jpg`}
                  alt={region.name}
                  className="deal-region-img"
                />
                <div className="deal-region-info">
                  <span className="badge bg-success mb-2">Ưu Đãi Cuối Năm</span>
                  <h5>{region.name}</h5>
                  <p>Từ {Math.floor(Math.random() * 10) + 5}₫ mỗi đêm</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsPage;
