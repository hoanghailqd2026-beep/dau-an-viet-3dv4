import type { HeritageHotspotFeature } from '../types/heritage';
import { HERITAGE_SITES } from './heritageSites';
import { DEFAULT_HERITAGE_3D_CONFIG, getSite3DHotspots } from './heritage3DConfig';

export const NEW_NINE_LANDMARK_FEATURES: Record<string, HeritageHotspotFeature[]> = {
  'HCM-DT-008': [
    {
      id: 'f1',
      name: 'Cổng Tam Quan & Bình Phong Rồng Hổ',
      description:
        'Cổng Tam Quan cổ kính hai tầng mái ngói âm dương uốn cong đầu đao cùng Lưỡng Long Chầu Nguyệt, chắn sau là bức bình phong Rồng Hổ.',
      cameraPos: [0, 8.5, 25],
      targetPos: [0, 3.2, 12.2],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Nhà Bia Đá Cổ Phan Thanh Giản (1868)',
      description:
        'Nhà bia tứ giác bên trái sân lăng lưu giữ tấm bia đá xanh khắc bài văn bia ca ngợi công đức khai mở Gia Định của Tả quân.',
      cameraPos: [-16, 6.5, 14],
      targetPos: [-9.5, 2.2, 7.5],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Tiền Điện, Đỉnh Đồng & Bao Lam Thếp Vàng',
      description:
        'Hệ mái ngói âm dương nối tiếp cùng đỉnh đồng lớn trước sân, hương án sơn son thếp vàng và hai hàng giá binh khí Bát Bửu.',
      cameraPos: [12, 7.5, 11],
      targetPos: [0, 2.5, 1.5],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Chính Điện & Khám Thờ Tả Quân Thếp Vàng',
      description:
        'Trung tâm nội thất điện thờ với khám thờ sơn son thếp vàng rực rỡ và hệ cột gỗ sơn son chạm trổ tinh xảo.',
      cameraPos: [7.5, 5.5, 4.5],
      targetPos: [0, 2.2, -7.2],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Mộ Song Táng Hình Nấm Rùa',
      description:
        'Hai ngôi mộ cổ của Tả quân Lê Văn Duyệt và nhị vị phu nhân đắp vữa ô dước hình mai rùa nằm trong vòng thành đá phía sau.',
      cameraPos: [-12, 7.2, -18],
      targetPos: [0, 1.2, -11.8],
      thumbnailUrl: '',
    },
  ],
  'HCM-DT-010': [
    {
      id: 'f1',
      name: 'Địa Tầng Khảo Cổ & Mái Che Bảo Tồn',
      description:
        'Mặt cắt địa chất Giồng Cá Vồ phân tách 3 lớp đất cát giồng, tầng văn hóa Tiền Óc Eo và bùn ngập mặn Cần Giờ.',
      cameraPos: [18, 12, 20],
      targetPos: [0, 1.5, 1.5],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Quần Thể 300+ Mộ Chum Gốm Cổ (Lathe 3D)',
      description:
        'Các mộ chum gốm hình trứng và hình trụ đứng đặt trong lưới hố khai quật ô vuông có niên đại hơn 2.500 năm.',
      cameraPos: [-8, 6.2, 12],
      targetPos: [-1.3, -0.4, 1.6],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Khuyên Tai Hai Đầu Thú & Hạt Mã Não',
      description:
        'Hiện vật tùy táng quý hiếm bằng vàng, đá ngọc nephrite và hạt mã não đỏ cam phát sáng khi bật X-Ray.',
      cameraPos: [5.5, 4.5, 9.5],
      targetPos: [1.4, -0.4, 4.3],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Hố Khai Quật Lưới Dây & Cọc Mốc',
      description:
        'Hệ thống dây định vị và cọc mốc khảo cổ học giúp ghi nhận chính xác tọa độ từng hiện vật gốm chân đế.',
      cameraPos: [0, 10, 14],
      targetPos: [0, 0.2, 3.2],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Hệ Sinh Thái Rừng Đước & Kênh Triều Cần Giờ',
      description:
        'Cây đước rễ chống và lạch nước thủy triều bao bọc gò đất cao cổ đại giữa vùng ngập mặn.',
      cameraPos: [18, 8.5, -10],
      targetPos: [10.5, 1.5, -3.5],
      thumbnailUrl: '',
    },
  ],
  'HCM-DT-011': [
    {
      id: 'f1',
      name: 'Bảo Tháp Xá Lợi 7 Tầng Lục Giác',
      description:
        'Ngọn bảo tháp lục giác cao vút tôn trí xá lợi Phật ở góc trước sân chùa, nổi bật với 7 tầng lan can đá và mái cong.',
      cameraPos: [-20, 12, 18],
      targetPos: [-11.2, 6.5, 7.5],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Cây Bồ Đề Cổ Thụ Rễ Phụ (1953)',
      description:
        'Cây bồ đề cổ thụ rợp bóng với chùm rễ phụ buông rủ bên phải sân trước được chiết từ cây bồ đề thiêng Sri Lanka.',
      cameraPos: [20, 9.5, 18],
      targetPos: [12.2, 3.5, 10.2],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Bố Cục 3 Gian Chữ Tam & Mái Ngói Liệt',
      description:
        'Tiền đường, Chính điện và Nhà Tổ nối tiếp theo trục dọc, lợp ngói âm dương võng cong cổ kính chuẩn mực Nam Bộ.',
      cameraPos: [16, 13, 16],
      targetPos: [2.5, 4.5, -1.8],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Hệ 98 Cột Gỗ Lim & Hoành Phi Câu Đối',
      description:
        'Không gian nội thất dày đặc cột gỗ lim trên chân tảng đá xanh nối bằng kỹ thuật xuyên trính chạm trổ tùng hạc.',
      cameraPos: [12, 5.8, 8.5],
      targetPos: [2.5, 2.2, 1.5],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Chính Điện Phật A Di Đà & Thập Bát La Hán',
      description:
        '18 pho tượng La Hán gỗ mít thếp vàng sắp thành hai hàng trang nghiêm chầu về tượng Phật A Di Đà tại trung tâm.',
      cameraPos: [-6, 5.2, 6.5],
      targetPos: [2.5, 2.0, -3.2],
      thumbnailUrl: '',
    },
  ],
  'HCM-DT-012': [
    {
      id: 'f1',
      name: 'Mái Ngói Lưu Ly Xanh Ngọc & Gốm Cây Mai',
      description:
        'Bộ mái cong Triều Châu phủ ngói ống men xanh ngọc bích cùng hàng tượng tiểu cảnh gốm sứ Cây Mai rực rỡ trên bờ nóc.',
      cameraPos: [15, 12, 18],
      targetPos: [0, 6.8, -1.0],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Sân Thiên Tỉnh & Nhang Vòng Treo Cao',
      description:
        'Khoảng giếng trời thông thoáng giữa Tiền điện và Chính điện đón ánh sáng tự nhiên rọi xuống sân đá và nhang vòng.',
      cameraPos: [8, 9.5, 8],
      targetPos: [0, 2.5, 0.4],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Tượng Ngựa Xích Thố Đỏ Rực',
      description:
        'Pho tượng ngựa Xích Thố tạc gỗ sơn son bóng lộng đặt tại Tiền điện bên trái, gắn liền với lễ hội chui bụng ngựa cầu may.',
      cameraPos: [-11, 4.5, 11],
      targetPos: [-5.2, 1.8, 5.6],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Chính Điện Quan Thánh & Bao Lam Thếp Vàng',
      description:
        'Khám thờ Quan Công uy nghi sau lớp bao lam gỗ chạm lộng tinh xảo và chiếc lư hương đồng cổ.',
      cameraPos: [4.5, 5.2, 2.0],
      targetPos: [0, 2.2, -7.8],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Đại Hồng Chung Cổ & Trống Lễ Hội',
      description: 'Chuông đồng lớn treo trên giá gỗ bên cánh phải cùng chiếc trống lễ hội uy nghi.',
      cameraPos: [11, 5.0, 2.5],
      targetPos: [5.8, 2.2, -4.2],
      thumbnailUrl: '',
    },
  ],
  'BRVT-DT-001': [
    {
      id: 'f1',
      name: 'Mặt Tiền Vòm Cuốn Tân Cổ Điển & Mái Marseille',
      description:
        'Tòa biệt thự 3 tầng tường trắng ngà với hành lang vòm bán nguyệt Pháp, lan can lục bình đá và mái ngói đỏ Marseille.',
      cameraPos: [16, 13, 22],
      targetPos: [0, 7.5, -1.5],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Trận Địa 19 Khẩu Thần Công Hướng Biển',
      description: 'Dãy 19 khẩu thần công đặt dọc lan can đá phía trước nhìn thẳng xuống vịnh Bãi Trước Vũng Tàu.',
      cameraPos: [12, 5.5, 18],
      targetPos: [0, 1.5, 10.6],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: '8 Tượng Bán Thân Hy Lạp - La Mã Trên Diềm Mái',
      description: 'Chuỗi 8 hốc tròn gắn tượng bán thân gốm sứ men màu châu Âu tô điểm diềm thượng tầng 3 của dinh thự.',
      cameraPos: [-10, 13.5, 13],
      targetPos: [0, 11.2, 2.5],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Phòng Trưng Bày Gốm Sứ Cổ Hòn Cau (Khang Hy)',
      description:
        'Nội thất tầng 3 trưng bày bộ sưu tập bình gốm sứ men lam Khang Hy trục vớt từ tàu đắm vùng biển Hòn Cau.',
      cameraPos: [6, 10.5, 7],
      targetPos: [0, 9.2, -3.5],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Cầu Thang Xoắn Gỗ Cổ & Rừng Hoa Sứ Núi Lớn',
      description:
        'Nội thất cầu thang gỗ xoắn tầng 2 hòa quyện giữa sắc hoa sứ trắng cổ thụ bao bọc toàn khu dinh thự.',
      cameraPos: [-16, 8.5, 12],
      targetPos: [-4.2, 6.2, -2.5],
      thumbnailUrl: '',
    },
  ],
  'BRVT-DT-002': [
    {
      id: 'f1',
      name: 'Chính Điện (Nhà Thánh)',
      description:
        'Khu Nhà Thánh 3 nếp trùng thiềm điệp ốc (Tiền điện – Trung điện – Hậu điện) với hệ cửa bức bàn gỗ căm xe, lan can con tiện, hương án, 6 tủ thờ cẩn ốc xà cừ và hoành phi câu đối sơn son thếp vàng (không đặt tượng thờ theo đúng tín ngưỡng Đạo Ông Trần).',
      cameraPos: [1.2, 6.2, -0.8],
      targetPos: [1.2, 3.8, -8.2],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Lầu Đôi & Khu Nhà Lồng',
      description:
        'Cặp Lầu Đôi 2 tầng (Lầu Tiên – Lầu Cấm) và Nhà Long Đình chồng diêm nối liền mạch qua hệ hành lang gỗ có mái ngói âm dương, lan can con tiện dẫn thẳng vào dãy Nhà Lồng phía sau.',
      cameraPos: [12.5, 7.6, 8.8],
      targetPos: [1.2, 4.2, -0.4],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Sân Đền, Đỉnh Hương & Hàng Lu Nước Mưa',
      description:
        'Sân đền lát đá xanh Núi Nứa rộng thoáng với Đỉnh Hương Đá chạm khắc ở trung tâm, cầu thang đá 3 lối đi và hàng lu nước mưa (khạp da bò) xếp ngay ngắn dọc thềm nhà.',
      cameraPos: [7.8, 5.4, 14.2],
      targetPos: [1.2, 1.8, 6.2],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Hậu Điện & Khu Bếp Nhà Lò',
      description:
        'Khu Hậu Điện nối liền Nhà Lò cổ truyền có bếp lò xây gạch, nồi đồng lớn cùng làn khói bếp mỏng bay nhẹ lên trời trên nền triền Núi Nứa (Ngọa Long) và lối bậc thang đá xanh lên Lăng Mộ Ông Trần.',
      cameraPos: [-16.2, 6.8, -2.2],
      targetPos: [-9.4, 3.6, -10.2],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Nhà Ghe Sấm (Di Vật Khai Hoang 1900)',
      description:
        'Nhà che bên trái sân đền căn chỉnh vuông góc với trục sân chính, bảo tồn nguyên vẹn chiếc Ghe Sấm thân ghe bầu lớn dài với phần mũi ghe cong truyền thống đặt trên đà gỗ căm xe.',
      cameraPos: [-4.2, 3.8, 13.2],
      targetPos: [-10.6, 1.9, 8.2],
      thumbnailUrl: '',
    },
    {
      id: 'f6',
      name: 'Cổng & Hàng Rào Trụ Đá Không Khóa Cửa',
      description:
        'Hàng rào trụ đá xanh thấp gắn đèn lồng cổ và Cổng chính mở rộng không cánh khóa nhìn ra trục đường chính phía trước — biểu trưng tinh thần hiếu khách "mở cửa suốt ngày đêm đãi khách thập phương" của Nhà Lớn Long Sơn.',
      cameraPos: [1.2, 4.8, 22.4],
      targetPos: [1.2, 2.1, 13.5],
      thumbnailUrl: '',
    },
  ],
  'BRVT-DT-003': [
    {
      id: 'f1',
      name: 'Mạng Đường Hầm Địa Đạo Uốn Lượn 2 Tầng',
      description: 'Sa bàn cắt dọc 2 tầng đường hầm uốn lượn tự nhiên sâu 3m–6m trong lớp đất đỏ bazan vững chãi vùng Bà Rịa.',
      cameraPos: [21, 12, 23],
      targetPos: [0, 1.8, 2.0],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Hầm Chữ A Gia Cố Gỗ Chống Bom Pháo',
      description: 'Hệ khung gỗ chữ A kết hợp giằng ngang chịu lực giúp bảo vệ an toàn trước sức công phá pháo kích hạng nặng.',
      cameraPos: [-12, 6.0, 18],
      targetPos: [-6.5, 3.2, 8.6],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Phòng Họp Chi Bộ & Đèn Dầu Ngầm',
      description: 'Khoang hầm chỉ huy ngầm nối thẳng xuống đường hầm xương sống qua ống tụt thông tầng.',
      cameraPos: [8, 5.5, 19],
      targetPos: [4.0, 2.8, 8.6],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Hầm Quân Y Dã Chiến (Mặt Cắt Bên +X)',
      description: 'Khoang hầm cứu thương tầng sâu trang bị sập tre và tủ y tế phục vụ thương bệnh binh.',
      cameraPos: [22, 2.5, 2],
      targetPos: [10.4, -2.2, -2.2],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Bụi Tre Tầm Vông, Ụ Mối & Nắp Hầm Bí Mật',
      description: 'Mặt đất phía trên phủ bụi tre tầm vông và ụ mối che giấu hoàn hảo nắp hầm bí mật và công sự cá nhân.',
      cameraPos: [-11, 15, 14],
      targetPos: [0, 9.0, 2.5],
      thumbnailUrl: '',
    },
  ],
  'BD-DT-001': [
    {
      id: 'f1',
      name: 'Kiến Trúc Nhà Rường 5 Gian 2 Chái Chữ Đinh',
      description: 'Toàn cảnh ngôi nhà gỗ cổ bên sông Sài Gòn với hệ mái ngói âm dương võng nhẹ và nền đá xanh vững chắc.',
      cameraPos: [18, 11, 20],
      targetPos: [0, 3.8, 1.5],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Hệ 36 Cột Gỗ Căm Xe & Chân Tảng Đá Hoa Sen',
      description: 'Mạng cột gỗ tròn bóng loáng tỳ trên chân tảng đá xanh chạm hoa sen nâng đỡ toàn bộ hệ kèo đấm truyền thống.',
      cameraPos: [-10, 4.8, 13],
      targetPos: [0, 2.4, 3.2],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Bao Lam Chạm Lộng Tứ Linh Thếp Vàng',
      description: 'Các bức bao lam, hoành phi chạm lộng tinh xảo đề tài Long - Lân - Quy - Phụng của thợ mộc Thủ Dầu Một.',
      cameraPos: [6, 5.2, 10],
      targetPos: [0, 3.8, 2.8],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Tủ Thờ Gia Tiên & Bình Phong Cẩn Xà Cừ',
      description: 'Bức bình phong gỗ và tủ thờ khảm ốc xà cừ lấp lánh đặt tại gian chính giữa trang nghiêm.',
      cameraPos: [-4, 4.0, 9.5],
      targetPos: [0, 1.7, 1.8],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Gian Khách Trường Kỷ & Vườn Bonsai Kiểng Cổ',
      description: 'Bộ trường kỷ khảm trai tiếp khách hai bên gian thờ nối ra sân gạch tàu viền hàng rào kiểng.',
      cameraPos: [13, 6.2, 6],
      targetPos: [4.6, 1.8, 2.5],
      thumbnailUrl: '',
    },
  ],
  'BD-DT-002': [
    {
      id: 'f1',
      name: 'Vành Đai Đỏ Bên Sông Sài Gòn & Rừng Cao Su',
      description:
        'Toàn cảnh sa bàn mặt cắt địa đạo Tam Giác Sắt đối diện bờ sông Sài Gòn uốn lượn với hàng cao su Bến Cát thẳng tắp.',
      cameraPos: [20, 14, 24],
      targetPos: [-1.0, 2.5, 1.0],
      thumbnailUrl: '',
    },
    {
      id: 'f2',
      name: 'Hầm Chỉ Huy & Sa Bàn Tác Chiến 3D',
      description: 'Phòng chỉ huy ngầm tầng 1 với bàn sa bàn tác chiến và máy vô tuyến chỉ đạo đánh bại trận càn Cedar Falls.',
      cameraPos: [-4, 6.2, 19],
      targetPos: [-2.2, 3.0, 8.6],
      thumbnailUrl: '',
    },
    {
      id: 'f3',
      name: 'Kho Vũ Khí Ngầm Tây Nam Bến Cát',
      description: 'Kho cất giữ súng bộ binh và hòm đạn chiến đấu ẩn sâu dưới tầng đất đỏ sét pha sỏi.',
      cameraPos: [14, 5.5, 18],
      targetPos: [7.8, 2.8, 8.6],
      thumbnailUrl: '',
    },
    {
      id: 'f4',
      name: 'Bếp Hoàng Cầm & Ống Tản Khói Ngầm',
      description: 'Hệ bếp nấu ăn ngầm dẫn khói qua đường ống uốn lượn xuyên đất khiến máy bay trinh sát không thể phát hiện.',
      cameraPos: [5, 1.2, 19],
      targetPos: [1.2, -3.5, 8.5],
      thumbnailUrl: '',
    },
    {
      id: 'f5',
      name: 'Cửa Thoát Hiểm Ven Sông & Giao Thông Hào',
      description: 'Ngách hầm sâu mở thẳng ra bến thuyền sông Sài Gòn kết nối trực tiếp sang Địa đạo Củ Chi.',
      cameraPos: [-18, 6.5, 16],
      targetPos: [-9.2, 1.8, 7.0],
      thumbnailUrl: '',
    },
  ],
};

export function getLandmarkFeatures(siteId: string): HeritageHotspotFeature[] {
  const syncedHotspots = getSite3DHotspots(siteId);
  if (syncedHotspots && syncedHotspots.length > 0) {
    return syncedHotspots;
  }
  if (NEW_NINE_LANDMARK_FEATURES[siteId]) {
    return NEW_NINE_LANDMARK_FEATURES[siteId];
  }
  const staticHotspots = DEFAULT_HERITAGE_3D_CONFIG[siteId]?.hotspots;
  if (staticHotspots && staticHotspots.length > 0) {
    return staticHotspots;
  }
  if (siteId === 'HCM-DT-001') {
    return [
      {
        id: 'f1',
        name: 'Đại Sảnh & Cầu Thang Đôi',
        description:
          'Không gian đại sảnh lát đá cẩm thạch vân kem kết nối trực tiếp cầu thang đôi hình chữ Y trải thảm đỏ sang trọng với tay vịn gỗ quý và đèn chùm pha lê trung tâm.',
        cameraPos: [0, 5.2, 12.8],
        targetPos: [0, 3.2, -0.4],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Phòng Trình Quốc Thư & Tranh Sơn Mài',
        description:
          'Nơi diễn ra nghi lễ tiếp đón đại sứ các nước, nổi bật với thảm gấm vàng, bộ ghế sơn son thếp vàng và bức tranh sơn mài khổ lớn Bình Ngô Đại Cáo / Giang Sơn Cẩm Tú.',
        cameraPos: [10.2, 5.4, 9.5],
        targetPos: [10.2, 4.85, -3.6],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Phòng Nội Các (Tầng Trệt)',
        description:
          'Phòng họp Hội đồng Nội các cánh Tây tầng trệt với bàn họp lớn hình chữ U bằng gỗ gõ đỏ bóng, 20 ghế bọc da xanh lục và hệ thống micro hội nghị.',
        cameraPos: [-15.8, 3.8, 10.2],
        targetPos: [-10.2, 2.0, -1.5],
        thumbnailUrl: '',
      },
      {
        id: 'f4',
        name: 'Phòng Làm Việc Tổng Thống & Tứ Phương Vô Sự',
        description:
          'Cụm không gian tầng 2 gồm bàn làm việc gỗ gụ Tổng thống, quả địa cầu cùng lầu vọng cảnh Tứ Phương Vô Sự trên tầng thượng với hàng cột sơn son đỏ rực và bàn trà.',
        cameraPos: [-9.5, 11.8, 15.5],
        targetPos: [-1.5, 9.2, 0.2],
        thumbnailUrl: '',
      },
      {
        id: 'f5',
        name: 'Tầng Hầm Chỉ Huy Ngầm (B1)',
        description:
          'Khu boong-ke bê tông cốt thép chịu bom sâu dưới lòng đất với cửa thép xanh ô-liu kín hơi, bàn tác chiến gỗ, máy điện đài phát đèn tín hiệu và bản đồ quân sự Nam Bộ.',
        cameraPos: [7.8, 4.6, -18.5],
        targetPos: [0, -1.0, -8.2],
        thumbnailUrl: '',
      },
      {
        id: 'f6',
        name: 'Sân Đáp Trực Thăng UH-1 (08/04/1975)',
        description:
          'Bãi đáp trực thăng chữ H trên tầng thượng lưu giữ 2 vòng tròn đỏ đánh dấu vị trí trúng bom ngày 08/04/1975 cùng mô hình trực thăng UH-1 Iroquois.',
        cameraPos: [7.5, 14.5, -13.5],
        targetPos: [0, 10.1, -5.6],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-002') {
    return [
      {
        id: 'f1',
        name: 'Vòm Cuốn Lớn & Sảnh Caryatids',
        description:
          'Mặt tiền chính với bậc tam cấp đá granite xám vát mở rộng, tượng Nữ thần Caryatids đá trắng ngà đỡ ban công tầng 2 và vòm cuốn trung tâm.',
        cameraPos: [-6, 9.5, 30],
        targetPos: [-2.5, 7.5, 13.0],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Hai Cánh Mặt Tiền & Lan Can Đá Trắng',
        description:
          'Hai cánh mặt tiền đối xứng với cửa sổ vòm lớn, khung phào chỉ đắp nổi, trụ cột vuông và lan can con tiện đá trắng phía trước mái Mansard.',
        cameraPos: [16, 10.5, 26],
        targetPos: [8.2, 6.5, 11.5],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Hệ Mái Mansard Đỉnh Bằng & Cửa Mái Bên Hông',
        description:
          'Hệ mái Mansard 4 mặt dốc lợp ngói đá phiến vảy cá giật cấp phía sau vòm mặt tiền và các ô cửa mái đều đặn hai bên hông.',
        cameraPos: [25, 17.5, -2],
        targetPos: [3.5, 11.5, -4.0],
        thumbnailUrl: '',
      },
      {
        id: 'f4',
        name: '9 Nhịp Hông & Mặt Hậu Lan Can Đá',
        description:
          'Hai bên hông chia 9 nhịp trên khối bệ thềm đá xám cùng mặt hậu kết thúc phẳng bằng hệ lan can con tiện đá trắng.',
        cameraPos: [-18, 11.5, -32],
        targetPos: [-6.5, 7.2, -16],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-003') {
    return [
      {
        id: 'f1',
        name: 'Đồng Hồ Cổ & Cổng Chính (1891)',
        description:
          'Chiếc đồng hồ La Mã cổ kính đặt trang trọng trên đỉnh trán tường Tân Phục Hưng chính giữa mặt tiền, lưu giữ nhịp thời gian hơn 130 năm của Sài Gòn.',
        cameraPos: [-5, 10, 22],
        targetPos: [-2.5, 9.2, 8.5],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Khung Vòm Thép Gustave Eiffel',
        description:
          'Kết cấu vòm kim loại chịu lực thanh thoát thế kỷ XIX chạy dọc sảnh giao dịch chính, lấy sáng tự nhiên qua hệ mái lồng.',
        cameraPos: [14, 15, 14],
        targetPos: [3.5, 8.5, -2.5],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Hệ Cửa Vòm & Cửa Chớp Pháp Cổ',
        description:
          'Dãy cửa sổ vòm cao đối xứng hai cánh kết hợp cửa chớp lá sách màu xanh lá đặc trưng giúp thông gió nhiệt đới và tôn lên sắc tường vàng cổ điển.',
        cameraPos: [-16, 6, 20],
        targetPos: [-11.5, 4.5, 7],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-005') {
    return [
      {
        id: 'f1',
        name: 'Hai Tháp Chuông Đôi & Chóp Bạc 60m',
        description:
          'Hai tháp chuông vuông đối xứng gắn cửa vòm đôi, đồng hồ cổ, lan can đá trắng và 2 chóp bát giác bọc kẽm cao 60,5m mang Thánh giá trên đỉnh.',
        cameraPos: [-8, 19, 26],
        targetPos: [-4.5, 17, 9.2],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Cửa Sổ Hoa Hồng & 3 Cổng Vòm',
        description:
          'Cửa sổ kính màu hình tròn lớn viền đá trắng kết hợp hàng vòm nhỏ và 3 cổng vòm Romanesque dẫn vào thánh đường.',
        cameraPos: [8, 9.5, 22],
        targetPos: [3.5, 8.2, 11.2],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Tượng Đức Mẹ Hòa Bình & Quảng Trường',
        description:
          'Tượng Đức Mẹ Hòa Bình bằng đá cẩm thạch trắng Carrara đặt trên bệ trụ đá cao giữa vườn hoa Công xã Paris phía trước nhà thờ.',
        cameraPos: [-10, 5.5, 28],
        targetPos: [-4.2, 3.8, 18.8],
        thumbnailUrl: '',
      },
      {
        id: 'f4',
        name: 'Hậu Cung 3 Tầng Giật Cấp & 5 Nhà Nguyện Tỏa Tia',
        description:
          'Cấu trúc Hậu cung 3 tầng đồng tâm phía sau Cánh ngang mở rộng với 5 Nhà nguyện đa giác tỏa hình cánh quạt.',
        cameraPos: [12, 18.5, -42],
        targetPos: [5.5, 7.5, -18],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-007') {
    return [
      {
        id: 'f1',
        name: 'Đôi Rồng Đất Nung Trên Mái (Lưỡng Long Chầu Nguyệt)',
        description:
          'Tượng đôi rồng đất nung tráng men xanh ngọc lưu ly chầu mặt trăng trên đỉnh mái tòa nhà hãng tàu Messageries Maritimes (1863).',
        cameraPos: [-6, 16.0, 19],
        targetPos: [-3.5, 13.8, 0],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Hành Lang Vòm Cuốn Pháp Cổ 7 Nhịp',
        description:
          'Hệ hành lang vòm cuốn bán nguyệt bao quanh 4 mặt kết hợp hàng cột vuông trắng kem và tường gạch đất nung thoáng mát ven sông Sài Gòn.',
        cameraPos: [16, 7.5, 22],
        targetPos: [6.5, 4.5, 5.5],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-004') {
    return [
      {
        id: 'f1',
        name: 'Tháp Đồng Hồ Cửa Nam 1914',
        description:
          'Tháp chuông 4 mặt sừng sững hướng ra quảng trường trung tâm, biểu tượng giao thương sầm uất hơn một thế kỷ của Sài Gòn.',
        cameraPos: [-6, 11, 23],
        targetPos: [-3.5, 9.2, 11],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Mái Ngói Xếp Tầng Thông Gió',
        description: 'Kiến trúc chợ nhiệt đới Nam Bộ với các tầng mái so le lấy gió và ánh sáng tự nhiên.',
        cameraPos: [18, 14, 12],
        targetPos: [5.5, 6.5, -2.5],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-006') {
    return [
      {
        id: 'f1',
        name: 'Tháp Bát Giác Trung Tâm 3 Tầng Mái Chồng Diêm',
        description:
          'Khối tháp bát giác trung tâm do KTS Auguste Delaval thiết kế năm 1929 với hệ mái ngói ống âm dương 3 tầng chồng diêm uy nghi.',
        cameraPos: [-6, 12.5, 22],
        targetPos: [-2.5, 9.5, 1.0],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Sảnh Chính, Hệ Đấu Củng & Cửa Gỗ Hoa Văn Kỷ Hà',
        description:
          'Hiên sảnh đón mở rộng với bậc tam cấp đá, cột vuông trắng ngà đỡ hệ đấu củng nhiều tầng và 3 bộ Cửa Đại Khoa gỗ lim.',
        cameraPos: [8, 5.5, 19.5],
        targetPos: [4.2, 3.8, 7.2],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Hai Cánh Trưng Bày Đối Xứng & Cửa Sổ Lá Sách',
        description:
          'Hai dãy nhà cánh dài đối xứng mỗi bên 5 nhịp, cửa sổ cao lắp 2 cánh chớp lá sách gỗ lim thông gió nhiệt đới.',
        cameraPos: [-14.0, 8.0, 21.5],
        targetPos: [-10.8, 4.5, 1.5],
        thumbnailUrl: '',
      },
      {
        id: 'f4',
        name: 'Hai Khối Đầu Hồi Chữ U Giao Thoa Á - Âu',
        description:
          'Hai khối đầu hồi nhô ra ở hai đầu tạo thế chữ U bề thế với cụm cửa sổ gỗ cao, phù điêu ngang và lan can con tiện đá.',
        cameraPos: [19.5, 8.8, 21.5],
        targetPos: [15.5, 5.0, 2.2],
        thumbnailUrl: '',
      },
    ];
  }
  if (siteId === 'HCM-DT-009') {
    return [
      {
        id: 'f1',
        name: 'Rừng Ngụy Trang, Hố Bom B-52 & Ụ Mối Thông Hơi',
        description:
          'Tầng mặt đất tái hiện rừng nhiệt đới Củ Chi với lối mòn đất đỏ, hố bom B-52, lán lá chữ A, ụ mối thông hơi và cửa hầm bí mật.',
        cameraPos: [-16, 18, 22],
        targetPos: [-8.5, 8.8, -4.5],
        thumbnailUrl: '',
      },
      {
        id: 'f2',
        name: 'Tầng 1 (Sâu 3m): Hầm Chỉ Huy & Bếp Hoàng Cầm',
        description:
          'Tầng hầm đầu tiên gồm Phòng họp Chỉ huy có cột gỗ chống trần, bàn sa bàn tác chiến và hầm Bếp Hoàng Cầm có rãnh dẫn khói tản nhiệt.',
        cameraPos: [-14, 9.5, 25],
        targetPos: [-7.5, 5.2, 8.5],
        thumbnailUrl: '',
      },
      {
        id: 'f3',
        name: 'Tầng 2 (Sâu 6m): Hầm Quân Y & Xưởng Vũ Khí',
        description:
          'Tầng hầm giữa ở độ sâu 6m bố trí Hầm Quân y dã chiến, Hầm Công binh chế tạo vũ khí và trục đường hầm xương sống có hố tụt thông tầng.',
        cameraPos: [20, 7.5, 22],
        targetPos: [8.5, 2.8, 5.5],
        thumbnailUrl: '',
      },
      {
        id: 'f4',
        name: 'Tầng 3 (Sâu 10m): Hầm Trú Ẩn & Lối Thoát Ra Sông',
        description:
          'Tầng hầm sâu nhất trong lớp đất sét pha đá ong bền chắc gồm Hầm trú ẩn chống bom, Giếng nước ngầm và ngách thoát hiểm ra sông Sài Gòn.',
        cameraPos: [-12, 3.5, 24],
        targetPos: [-2.5, -2.2, 9.5],
        thumbnailUrl: '',
      },
      {
        id: 'f5',
        name: 'Mặt Cắt Địa Chất Đá Ong & Giao Thông Hào',
        description:
          'Cấu trúc địa chất đất sét pha đá ong trên nền phù sa cổ có độ kết dính tự nhiên siêu bền, cho phép đào hơn 250km đường hầm 3 tầng.',
        cameraPos: [22, 12, -16],
        targetPos: [9.5, 5.5, -6.5],
        thumbnailUrl: '',
      },
      {
        id: 'f6',
        name: 'Cửa Hầm Bí Mật Ngụy Trang & Bẫy Chông Tre Củ Chi',
        description:
          'Hệ thống nắp hầm gỗ ngụy trang lá rừng khô kết hợp lỗ thông hơi hình ụ mối tự nhiên và cụm hầm chông chiến đấu.',
        cameraPos: [14, 15, 24],
        targetPos: [4.2, 8.2, 9.2],
        thumbnailUrl: '',
      },
    ];
  }
  const siteObj = HERITAGE_SITES.find((s) => s.id === siteId);
  return [
    {
      id: 'f1',
      name: 'Điểm Nhấn Kiến Trúc Tổng Thể',
      description:
        'Công trình di sản tiêu biểu ghi đậm dấu ấn không gian kiến trúc - văn hóa của miền Đông Nam Bộ qua các thời kỳ.',
      cameraPos: [0, 8, 16],
      targetPos: [0, 6, 0],
      thumbnailUrl: siteObj?.photos?.[0] || '',
    },
  ];
}
