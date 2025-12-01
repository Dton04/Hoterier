const express = require("express");
const ChatHistory = require("../models/chatHistory");
const User = require("../models/user");
const router = express.Router();

//Lấy danh sách tất cả user đã chat (cho admin)
router.get("/all", async (req, res) => {
   try {
      const histories = await ChatHistory.find()
         .populate("userId", "name email avatar")
         .sort({ updatedAt: -1 });

      res.json(histories);
   } catch (error) {
      res.status(500).json({ message: "Lỗi lấy lịch sử", error });
   }
});

//Lấy lịch sử chat theo userId (cho admin hoặc user)
router.get("/:userId", async (req, res) => {
   try {
      const history = await ChatHistory.findOne({ userId: req.params.userId })
         .populate("messages.hotelId", "name")
         .populate("messages.roomId", "name");

      res.json(history || { userId: req.params.userId, messages: [] });
   } catch (error) {
      res.status(500).json({ message: "Lỗi lấy lịch sử người dùng", error });
   }
});

// Top khách sạn được truy cập nhiều nhất
router.get("/stats/hotels", async (req, res) => {
   try {
      const hotelStats = await ChatHistory.aggregate([
         { $unwind: "$messages" },
         { $match: { "messages.hotelId": { $ne: null } } },
         {
            $group: {
               _id: "$messages.hotelId",
               count: { $sum: 1 }
            }
         },
         { $sort: { count: -1 } },
         { $limit: 10 },
         {
            $lookup: {
               from: "hotels",
               localField: "_id",
               foreignField: "_id",
               as: "hotel"
            }
         },
         { $unwind: "$hotel" },
         {
            $project: {
               _id: 1,
               count: 1,
               name: "$hotel.name",
               address: "$hotel.address",
               starRating: "$hotel.starRating"
            }
         }
      ]);

      res.json(hotelStats);
   } catch (err) {
      res.status(500).json({ message: "Lỗi lấy thống kê khách sạn", err });
   }
});


//Top khu vực / tỉnh thành được tìm kiếm nhiều nhất
router.get("/stats/regions", async (req, res) => {
   try {
      const regionStats = await ChatHistory.aggregate([
         { $unwind: "$messages" },
         { $match: { "messages.region": { $ne: null } } },
         {
            $group: {
               _id: "$messages.region",
               count: { $sum: 1 }
            }
         },
         { $sort: { count: -1 } },
         { $limit: 10 }
      ]);

      res.json(regionStats);
   } catch (err) {
      res.status(500).json({ message: "Lỗi thống kê khu vực", err });
   }
});



router.get("/stats/overview", async (req, res) => {
   try {
      const totalUsers = await ChatHistory.countDocuments();
      const totalMessages = await ChatHistory.aggregate([
         { $unwind: "$messages" },
         { $count: "total" }
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayMessages = await ChatHistory.aggregate([
         { $unwind: "$messages" },
         {
            $match: {
               "messages.timestamp": { $gte: today }
            }
         },
         { $count: "total" }
      ]);

      res.json({
         totalUsers,
         totalMessages: totalMessages[0]?.total || 0,
         todayMessages: todayMessages[0]?.total || 0,
      });
   } catch (err) {
      res.status(500).json({ message: "Lỗi thống kê tổng quan", err });
   }
});


module.exports = router;
