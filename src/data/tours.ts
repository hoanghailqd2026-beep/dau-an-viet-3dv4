import { TourRoute } from '../types/heritage';

export const TOUR_ROUTES: TourRoute[] = [
  {
    id: 'TOUR-01',
    title: 'Tuyến 01 — Trái tim Sài Gòn',
    subtitle: 'Dinh Độc Lập → Nhà thờ Chính tòa Đức Bà Sài Gòn',
    region: 'Quận 1',
    colorHex: '#A94F3D',
    theme: 'Biểu tượng Lịch sử & Kiến trúc Trung tâm',
    estimatedDuration: '1.5 giờ (Đi bộ)',
    distanceKm: 0.7,
    sites: [
      'HCM-DT-001', // Dinh Độc Lập
      'HCM-DT-005', // Nhà thờ Chính tòa Đức Bà Sài Gòn
    ],
    description:
      'Hành trình ngay trung tâm Quận 1 kết nối hai công trình biểu tượng bậc nhất Sài Gòn: từ Dinh Độc Lập mang kiến trúc Hiện đại Nhiệt đới của KTS. Ngô Viết Thụ tới Nhà thờ Chính tòa Đức Bà Sài Gòn bằng gạch đỏ Toulouse.',
    highlights: [
      'Chiêm ngưỡng hệ rèm hoa đá đốt trúc và các phòng khánh tiết lịch sử tại Dinh Độc Lập',
      'Khảo sát cặp tháp chuông cao 57,6m và tường gạch trần Marseille tại Nhà thờ Đức Bà Sài Gòn',
    ],
  },
  {
    id: 'TOUR-02',
    title: 'Tuyến 02 — Dấu ấn Kiến trúc Pháp',
    subtitle: 'Bưu điện trung tâm Sài Gòn → Nhà hát Thành phố Hồ Chí Minh',
    region: 'Quận 1',
    colorHex: '#526D8B',
    theme: 'Kiến trúc Đông Dương & Tân Cổ điển Pháp',
    estimatedDuration: '1.5 giờ (Đi bộ)',
    distanceKm: 0.9,
    sites: [
      'HCM-DT-003', // Bưu điện Trung tâm Sài Gòn
      'HCM-DT-002', // Nhà hát Thành phố Hồ Chí Minh
    ],
    description:
      'Cung đường kiến trúc Pháp kinh điển giữa lòng Quận 1: kết nối mái vòm thép uốn tại Bưu điện trung tâm Sài Gòn với mặt đứng Beaux-Arts lộng lẫy của Nhà hát Thành phố Hồ Chí Minh.',
    highlights: [
      'Quan sát khung vòm sắt lớn và bản đồ lịch sử cổ ngay đại sảnh Bưu điện trung tâm Sài Gòn',
      'Chiêm ngưỡng tượng phù điêu đá và không gian khán phòng ba tầng tại Nhà hát Thành phố',
    ],
  },
  {
    id: 'TOUR-03',
    title: 'Tuyến 03 — Nhịp sống & Giao thương',
    subtitle: 'Chợ Bến Thành → Hội quán Nghĩa An',
    region: 'Quận 1 - Quận 5',
    colorHex: '#C9A46A',
    theme: 'Đô thị Thương cảng & Giao lưu Văn hóa',
    estimatedDuration: '2.5 giờ',
    distanceKm: 5.4,
    sites: [
      'HCM-DT-004', // Chợ Bến Thành
      'HCM-DT-012', // Hội quán Nghĩa An
    ],
    description:
      'Hành trình nối liền hai cực giao thương lịch sử của Sài Gòn – Chợ Lớn: từ tháp đồng hồ cửa Nam Chợ Bến Thành tới quần thể chạm gỗ sơn son thếp vàng Triều Châu tại Hội quán Nghĩa An.',
    highlights: [
      'Khám phá kiến trúc nhà lồng bốn cửa và phù điêu gốm Biên Hòa tại Chợ Bến Thành',
      'Chiêm ngưỡng nghệ thuật điêu khắc gỗ thếp vàng và tiểu tượng gốm mái tại Hội quán Nghĩa An',
    ],
  },
  {
    id: 'TOUR-04',
    title: 'Tuyến 04 — Kết nối Lịch sử & Tín ngưỡng',
    subtitle: 'Bảo tàng Lịch sử TP HCM → Lăng Tả quân Lê Văn Duyệt',
    region: 'Quận 1 - Bình Thạnh',
    colorHex: '#47796D',
    theme: 'Di sản Bảo tàng & Tín ngưỡng Gia Định Xưa',
    estimatedDuration: '2.5 giờ',
    distanceKm: 2.6,
    sites: [
      'HCM-DT-006', // Bảo tàng Lịch sử TP HCM
      'HCM-DT-008', // Lăng Tả quân Lê Văn Duyệt
    ],
    description:
      'Tuyến di sản nối giữa không gian lưu giữ cổ vật kiến trúc Đông Dương tại Bảo tàng Lịch sử TP HCM và quần thể lăng miếu khảm sành sứ cổ kính của Tả quân Lê Văn Duyệt tại vùng đất Gia Định xưa.',
    highlights: [
      'Khảo sát tháp bát giác và bộ sưu tập văn hóa Óc Eo – Champa tại Bảo tàng Lịch sử TP HCM',
      'Thưởng ngoạn kiến trúc Tam quan, Bình phong và Điện thờ khảm sành sứ tại Lăng Ông Bà Chiểu',
    ],
  },
  {
    id: 'TOUR-05',
    title: 'Tuyến 05 — Hành trình Xuôi Nam',
    subtitle: 'Bến Nhà Rồng → Giồng Cá Vồ',
    region: 'Quận 4 - Cần Giờ',
    colorHex: '#526D8B',
    theme: 'Di sản Sông nước & Khảo cổ Cửa biển',
    estimatedDuration: '4.5 giờ',
    distanceKm: 48.0,
    sites: [
      'HCM-DT-007', // Bến Nhà Rồng
      'HCM-DT-010', // Giồng Cá Vồ
    ],
    description:
      'Hành trình xuôi dòng sông Sài Gòn về phía cửa biển Cần Giờ: khởi đầu từ Bến Nhà Rồng bên ngã ba sông đến di chỉ khảo cổ mộ chum 2.500 năm tuổi Giồng Cá Vồ giữa vùng lõi rừng ngập mặn.',
    highlights: [
      'Tìm hiểu dấu ấn kiến trúc thương cảng Pháp – Á Đông và lịch sử tại Bến Nhà Rồng',
      'Khảo sát địa tầng mộ chum gốm cổ và khuyên tai hai đầu thú ngọc nephrite tại Giồng Cá Vồ',
    ],
  },
  {
    id: 'TOUR-06',
    title: 'Tuyến 06 — Vùng ven Tây Bắc',
    subtitle: 'Chùa Giác Lâm → Địa đạo Củ Chi',
    region: 'Tân Bình - Củ Chi',
    colorHex: '#47796D',
    theme: 'Cổ tự Gia Định & Hệ thống Địa đạo Ngầm',
    estimatedDuration: '5 giờ',
    distanceKm: 49.5,
    sites: [
      'HCM-DT-011', // Chùa Giác Lâm
      'HCM-DT-009', // Địa đạo Củ Chi
    ],
    description:
      'Cung đường ngược hướng Tây Bắc kết nối ngôi cổ tự lâu đời bậc nhất Sài Gòn – Chùa Giác Lâm (1744) với mạng lưới hầm ngầm ba tầng huyền thoại tại vùng đất thép Địa đạo Củ Chi.',
    highlights: [
      'Chiêm ngưỡng kiến trúc chữ Tam và hơn một trăm pho tượng gỗ mít cổ tại Chùa Giác Lâm',
      'Giải phẫu 3 tầng hầm ngầm (-3m đến -10m) và bếp Hoàng Cầm tại Địa đạo Củ Chi',
    ],
  },
  {
    id: 'TOUR-07',
    title: 'Tuyến 07 — Di sản Bình Dương',
    subtitle: 'Địa đạo Tam Giác Sắt → Nhà cổ Trần Công Vàng',
    region: 'Bình Dương',
    colorHex: '#A94F3D',
    theme: 'Chiến khu Miền Đông & Kiến trúc Gỗ Cổ truyền',
    estimatedDuration: '4 giờ',
    distanceKm: 21.0,
    sites: [
      'BD-DT-002', // Địa đạo Tam Giác Sắt
      'BD-DT-001', // Nhà cổ Trần Công Vàng
    ],
    description:
      'Hành trình tiêu biểu tại tỉnh Bình Dương nối từ cụm địa đạo ba xã chiến lược Tam Giác Sắt (Tây Nam Bến Cát) về kiệt tác nhà rường 64 cột gỗ quý Trần Công Vàng tại Thủ Dầu Một.',
    highlights: [
      'Khảo sát mạng lưới địa đạo đào trong tầng đất đá ong bên hữu ngạn sông Sài Gòn',
      'Chiêm ngưỡng kết cấu mộng chốt 64 cột gỗ căm xe và chạm lộng Tứ linh tại Nhà cổ Trần Công Vàng',
    ],
  },
  {
    id: 'TOUR-08',
    title: 'Tuyến 08 — Lịch sử Bà Rịa - Vũng Tàu',
    subtitle: 'Địa đạo Long Phước → Nhà lớn Long Sơn',
    region: 'Bà Rịa - Vũng Tàu',
    colorHex: '#47796D',
    theme: 'Ký ức Kháng chiến & Quần thể Gỗ Cổ truyền',
    estimatedDuration: '3.5 giờ',
    distanceKm: 19.5,
    sites: [
      'BRVT-DT-003', // Địa đạo Long Phước
      'BRVT-DT-002', // Nhà lớn Long Sơn
    ],
    description:
      'Cung đường lịch sử – văn hóa tại Bà Rịa - Vũng Tàu kết nối hệ thống đường hầm xương cá liên ấp Địa đạo Long Phước với quần thể kiến trúc gỗ mộng cổ rộng 2 ha tại đảo Long Sơn.',
    highlights: [
      'Khảo sát cấu trúc hầm xương cá, công sự chiến đấu và hầm y tế tại Địa đạo Long Phước',
      'Khám phá quần thể Nhà lớn Long Sơn dựng hoàn toàn bằng mộng chốt gỗ quý không dùng đinh sắt',
    ],
  },
  {
    id: 'TOUR-09',
    title: 'Tuyến 09 — Dấu ấn Thành phố Biển',
    subtitle: 'Bạch Dinh (Điểm đến duy nhất)',
    region: 'Vũng Tàu',
    colorHex: '#C9A46A',
    theme: 'Di sản Kiến trúc Ven biển Vũng Tàu',
    estimatedDuration: '1.5 giờ',
    distanceKm: 0,
    sites: [
      'BRVT-DT-001', // Bạch Dinh
    ],
    description:
      'Tuyến tham quan chuyên sâu tại điểm đến duy nhất Bạch Dinh (Villa Blanche, 1898) tọa lạc trên sườn Núi Lớn hướng ra Bãi Trước Vũng Tàu, nơi lưu giữ kiến trúc Tân Cổ điển Pháp và bộ sưu tập gốm cổ Hòn Cau.',
    highlights: [
      'Chiêm ngưỡng mặt đứng Tân Cổ điển Pháp trang trí phù điêu gốm men cổ điển hướng biển',
      'Khám phá không gian trưng bày bộ sưu tập gốm sứ trục vớt từ tàu cổ Hòn Cau',
    ],
  },
];
