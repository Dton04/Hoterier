// src/utils/amenityIcons.js
import {
  Wifi,
  Coffee,
  Car,
  Activity,
  Bed,
  Bath,
  Tv,
  Utensils,
  Dumbbell,
  Fan,
  Snowflake,
  Lock,
  Users,
  TreePalm,
  Waves,
  Building,
  CigaretteOff,
  MapPin,
  ShieldCheck,
  Check,
  Bus,
  Briefcase,
  Shirt,
  Flame,
  Building2,
  Hotel,
} from "lucide-react";

export const AMENITY_ICONS = [
  // ====== Tiện nghi nổi bật ======
  { keywords: ["wifi"], icon: Wifi, color: "text-green-600" },
  { keywords: ["bữa sáng", "breakfast"], icon: Coffee, color: "text-yellow-600" },
  { keywords: ["xe", "đưa đón", "sân bay"], icon: Bus, color: "text-blue-600" },
  { keywords: ["không hút thuốc", "cấm hút thuốc"], icon: CigaretteOff, color: "text-gray-600" },
  { keywords: ["spa", "chăm sóc sức khỏe"], icon: Activity, color: "text-pink-600" },
  { keywords: ["thể dục", "gym", "fitness"], icon: Dumbbell, color: "text-blue-500" },
  { keywords: ["dịch vụ phòng", "room service"], icon: Building2, color: "text-green-700" },
  { keywords: ["nhà hàng", "restaurant"], icon: Utensils, color: "text-orange-600" },
  { keywords: ["bar", "quầy bar"], icon: Coffee, color: "text-purple-600" },
  { keywords: ["hồ bơi", "bể bơi", "pool"], icon: Waves, color: "text-cyan-500" },

  // ====== Cực kỳ phù hợp cho kỳ lưu trú ======
  { keywords: ["phòng tắm riêng", "bồn tắm"], icon: Bath, color: "text-blue-400" },
  { keywords: ["tivi", "tv"], icon: Tv, color: "text-indigo-600" },
  { keywords: ["view", "tầm nhìn", "cảnh"], icon: TreePalm, color: "text-green-500" },
  { keywords: ["gia đình"], icon: Users, color: "text-teal-600" },
  { keywords: ["ban công"], icon: Building, color: "text-purple-500" },
  { keywords: ["điều hòa", "máy lạnh"], icon: Snowflake, color: "text-blue-400" },

  // ====== Dịch vụ lau dọn ======
  { keywords: ["giặt ủi", "lau dọn", "ủi quần áo"], icon: Shirt, color: "text-rose-400" },
  { keywords: ["giặt khô"], icon: Fan, color: "text-gray-600" },

  // ====== Dịch vụ doanh nhân ======
  { keywords: ["doanh nhân", "hội họp", "hội nghị", "business"], icon: Briefcase, color: "text-amber-600" },
  { keywords: ["fax", "photocopy"], icon: Hotel, color: "text-gray-600" },

  // ====== An ninh ======
  { keywords: ["bình chữa cháy", "phòng cháy"], icon: Flame, color: "text-red-600" },
  { keywords: ["cctv", "camera", "an ninh"], icon: ShieldCheck, color: "text-emerald-600" },
  { keywords: ["két sắt"], icon: Lock, color: "text-gray-700" },

  // ====== Phòng tắm ======
  { keywords: ["giấy vệ sinh", "khăn tắm"], icon: Bath, color: "text-blue-300" },
  { keywords: ["dép"], icon: Bed, color: "text-gray-400" },

  // ====== Khác ======
  { keywords: ["vị trí", "trung tâm"], icon: MapPin, color: "text-red-500" },
];

/** 🔍 Hàm lấy icon phù hợp */
export const iconForAmenity = (label) => {
  if (!label || typeof label !== "string")
    return <Check className="text-green-600 w-4 h-4" />;

  const lower = label.toLowerCase();

  for (const item of AMENITY_ICONS) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      const Icon = item.icon;
      return <Icon className={`${item.color} w-4 h-4`} />;
    }
  }

  return <Check className="text-green-600 w-4 h-4" />;
};
