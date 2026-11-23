export interface HistoricalMapLayer {
  id: 'historical_1815' | 'historical_1898' | 'historical_1966';
  name: string;
  period: string;
  author: string;
  description: string;
  spatialFeatures: string[];
  bounds: {
    north: number;
    south: number;
    west: number;
    east: number;
  };
}

export const HISTORICAL_MAP_LAYERS: Record<string, HistoricalMapLayer> = {
  historical_1815: {
    id: 'historical_1815',
    name: 'Bản đồ Thành Bát Quái & Phủ Gia Định (1815)',
    period: 'Thời vua Gia Long - Nhà Nguyễn (1815)',
    author: 'Trần Văn Học (Văn thư viện Giám thành)',
    description: 'Bản đồ vẽ tay theo phương pháp đo đạc phương Tây kết hợp địa bạ triều Nguyễn, thể hiện Thành Quy (Thành Bát Quái 8 cửa kiên cố do KTS người Pháp Victor Olivier de Puymanel thiết kế theo hình bát quái Vauban), rạch Bến Nghé, sông Bình Trị và mạng lưới kênh rạch tự nhiên của Sài Gòn xưa.',
    spatialFeatures: [
      'Thành Bát Quái (Thành Quy) quy mô 8 cửa đồ sộ',
      'Đồn lũy Thảo Nghịch, Đồn Cây Mới bảo vệ thủy lộ',
      'Hệ thống rạch Bến Nghé tấp nập thuyền buôn',
      'Đại lộ nay là đường Đinh Tiên Hoàng - Tôn Đức Thắng',
    ],
    bounds: {
      north: 10.795,
      south: 10.755,
      west: 106.675,
      east: 106.720,
    },
  },
  historical_1898: {
    id: 'historical_1898',
    name: 'Bản đồ Sài Gòn - Chợ Lớn thời Pháp thuộc (1898)',
    period: 'Thời Pháp thuộc cuối thế kỷ XIX (1898)',
    author: 'Sở Địa bạ Nam Kỳ (Service du Cadastre de Cochinchine)',
    description: 'Ghi lại quy hoạch đô thị hiện đại thời Pháp sau khi lấp các con kênh cũ (như rạch Cầu Sấu thành đại lộ de la Somme nay là Hàm Nghi, rạch Grand Canal thành đại lộ Charner nay là Nguyễn Huệ), hình thành mạng lưới bàn cờ và định vị các công trình tiêu biểu như Bưu điện, Dinh Norodom, Nhà hát.',
    spatialFeatures: [
      'Mạng ô bàn cờ các đại lộ Charner, Bonard, Catinat',
      'Nhà ga xe lửa xe điện Sài Gòn - Chợ Lớn (Chemin de fer)',
      'Vị trí khởi công Nhà hát Thành phố (1898)',
      'Hệ thống công viên Vườn Bách Thảo và Công viên Tao Đàn',
    ],
    bounds: {
      north: 10.800,
      south: 10.745,
      west: 106.650,
      east: 106.725,
    },
  },
  historical_1966: {
    id: 'historical_1966',
    name: 'Bản đồ Đô thành Sài Gòn (1966)',
    period: 'Giai đoạn giữa thế kỷ XX (1966)',
    author: 'Nha Địa dư Quốc gia',
    description: 'Ghi nhận diện mạo Sài Gòn vào năm khánh thành Dinh Độc Lập mới (1966), thời kỳ phát triển bùng nổ của kiến trúc hiện đại nhiệt đới Việt Nam và mở rộng các quận nội thành.',
    spatialFeatures: [
      'Khuôn viên Dinh Độc Lập mới hoàn thành trên nền Dinh Norodom',
      'Hồ Con Rùa (Công trường Quốc tế) vừa khởi công',
      'Bến xe buýt và chợ Bến Thành trung tâm vận tải',
      'Hệ thống xa lộ Sài Gòn - Biên Hòa',
    ],
    bounds: {
      north: 10.810,
      south: 10.735,
      west: 106.640,
      east: 106.730,
    },
  },
};
