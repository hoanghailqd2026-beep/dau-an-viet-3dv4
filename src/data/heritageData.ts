// ============================================================================
// DẤU ẤN VIỆT 3D — NGUỒN DỮ LIỆU DI SẢN GỐC MẶC ĐỊNH (src/data/heritageData.ts)
// Toàn bộ src/data/heritageSites.ts, src/data/heritagePhotos.ts và
// src/data/heritage3DConfig.ts đều đọc trực tiếp từ DEFAULT_HERITAGE_SITES.
// ============================================================================

import type { HeritageSite } from '../types/heritage.ts';

export const DEFAULT_HERITAGE_SITES: HeritageSite[] = [
  {
    "id": "HCM-DT-001",
    "officialName": "Dinh Độc Lập",
    "folkName": "Hội trường Thống Nhất / Dinh Toàn quyền xưa",
    "identifierCode": "HCM-Q1-LSKT-001",
    "rankingLevel": "Special National",
    "type": "History",
    "gps": {
      "lat": 10.7769,
      "lng": 106.6953
    },
    "vn2000": {
      "x": 1191828.35,
      "y": 603380.49,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "135",
      "street": "Nam Kỳ Khởi Nghĩa",
      "ward": "Bến Thành",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Dinh Độc Lập là biểu tượng lịch sử đặc biệt của TP. Hồ Chí Minh và cả nước, nơi ghi dấu sự kiện ngày 30/4/1975 non sông liền một dải. Công trình kết hợp hài hòa giữa triết lý kiến trúc phương Đông cổ truyền với công nghệ kiến trúc hiện đại thế kỷ XX.",
    "chronology": "1868 (Dinh Norodom) - 1962 (tái thiết) - 1966 (khánh thành)",
    "commencementYear": 1962,
    "architect": "KTS. Ngô Viết Thụ (Khôi nguyên La Mã 1955)",
    "milestones": [
      {
        "year": "1868",
        "event": "Khởi công xây dựng Dinh Norodom theo bản vẽ của KTS Hermite"
      },
      {
        "year": "1962",
        "event": "Khởi công xây mới theo đồ án thiết kế triết học phương Đông của Ngô Viết Thụ"
      },
      {
        "year": "1966",
        "event": "Khánh thành dinh thự mới với diện tích sử dụng 20.000m²"
      },
      {
        "year": "1975",
        "event": "Xe tăng 390 và 843 húc đổ cổng chính, kết thúc thắng lợi cuộc kháng chiến chống Mỹ"
      },
      {
        "year": "2009",
        "event": "Được Thủ tướng Chính phủ xếp hạng Di tích Quốc gia Đặc biệt (Đợt 1)"
      }
    ],
    "architecturalStyle": "Hiện đại nhiệt đới kết hợp Triết lý phương Đông (Chiết tự Chữ Hán: Cát, Khẩu, Trung, Tam, Chủ)",
    "conservationStatus": "Good",
    "conservationNotes": "Hệ thống hoa gió rèm hoa trúc bê tông và nội thất nguyên bản được bảo tồn nghiêm ngặt cấp quốc gia.",
    "materials": [
      "Bê tông cốt thép chịu lực",
      "Đá rửa hoa cương",
      "Gỗ gõ đỏ",
      "Kính cường lực"
    ],
    "dimensionsDescription": "Khuôn viên rộng 12 ha, cao 26m gồm 3 tầng chính, 2 gác lửng, tầng thượng và 2 tầng hầm kiên cố.",
    "photos": [
      "https://cdn3.ivivu.com/2024/08/diem-den-TP.HCM-ivivu-1-1.png",
      "https://ak-d.tripcdn.com/images/1mi4312000tpwjsey927F.jpg?proc=source/trip"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "/dinhdoclap.glb",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Dinh Độc Lập - Biểu tượng thống nhất và đỉnh cao kiến trúc Việt",
        "duration": "04:32",
        "transcript": "Chào mừng quý khách đến với Dinh Độc Lập. Tọa lạc trên khuôn viên rộng 12 héc-ta giữa trung tâm Sài Gòn, công trình do Kiến trúc sư Ngô Viết Thụ thiết kế. Mặt tiền dinh mô phỏng bức rèm hoa trúc cách điệu, bố cục tổng thể kết tinh tinh hoa phong thủy phương Đông..."
      },
      "en": {
        "title": "Independence Palace - Architectural masterpiece & landmark of peace",
        "duration": "03:50",
        "transcript": "Welcome to the Independence Palace, also known as the Reunification Convention Hall. Designed by Prix de Rome laureate architect Ngo Viet Thu, the palace harmonizes modern tropical architecture with Eastern philosophic geometry..."
      },
      "fr": {
        "title": "Palais de la Réunification - Joyau de l’architecture moderne vietnamienne",
        "duration": "04:10",
        "transcript": "Bienvenue au Palais de l’Indépendance, chef-d’œuvre moderniste conçu par l’architecte Ngo Viet Thu, lauréat du Premier Grand Prix de Rome..."
      }
    },
    "openingHours": "08:00 - 16:30 (Mở cửa tất cả các ngày trong tuần)",
    "ticketPrices": "65.000 VNĐ/người lớn (bao gồm phòng trưng bày Di tích)",
    "regulations": [
      "Trang phục lịch sự, trang nghiêm",
      "Không mang theo chất dễ cháy nổ, hành lý cồng kềnh",
      "Tuân thủ luồng di chuyển tham quan và hướng dẫn của thuyết minh viên"
    ],
    "managementUnit": "Ban Quản lý Di tích Lịch sử Dinh Độc Lập (Cục Quản trị - Văn phòng Chính phủ)",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 1272/QĐ-TTg ngày 12/8/2009",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [
      {
        "id": "REV-001",
        "reviewerName": "GS. TSKH. KTS. Hoàng Đạo Kính",
        "title": "Chuyên gia Di sản Kiến trúc Đô thị",
        "organization": "Hội Kiến trúc sư Việt Nam",
        "ratingScore": 98,
        "comment": "Dữ liệu không gian 3D đạt chuẩn đo đạc LiDAR. Phân tích hình học triết tự chữ Hán (Khẩu, Cát, Trung) chuẩn xác tuyệt đối.",
        "verdict": "approved",
        "timestamp": "2026-03-12"
      }
    ],
    "visibility": "published",
    "updatedAt": "2026-09-20",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền Dinh Độc Lập (Hội trường Thống Nhất), Quận 1, TP. Hồ Chí Minh",
        "Không gian Phòng Trình quốc thư và bức tranh sơn mài Bình Ngô đại cáo (họa sĩ Nguyễn Văn Minh, 1966)"
      ],
      "en": [
        "Facade of Independence Palace (Reunification Hall), District 1, Ho Chi Minh City",
        "Credentials Presentation Hall and Binh Ngo Dai Cao Lacquer Painting (Nguyen Van Minh, 1966)"
      ],
      "zh": [
        "胡志明市第一郡独立宫（统一会堂）正面全景",
        "独立宫国书呈递厅与大型漆画《平吴大告》（阮文明作，1966年）"
      ]
    },
    "config3D": {
      "mode": "glb_only",
      "glbUrl": "/dinhdoclap.glb",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Đại Sảnh & Cầu Thang Đôi",
          "description": "Không gian đại sảnh lát đá cẩm thạch vân kem kết nối trực tiếp cầu thang đôi hình chữ Y trải thảm đỏ sang trọng với tay vịn gỗ quý và đèn chùm pha lê trung tâm.",
          "cameraPos": [
            0,
            5.2,
            12.8
          ],
          "targetPos": [
            0,
            3.2,
            -0.4
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Phòng Trình Quốc Thư & Tranh Sơn Mài",
          "description": "Nơi diễn ra nghi lễ tiếp đón đại sứ các nước, nổi bật với thảm gấm vàng, bộ ghế sơn son thếp vàng và bức tranh sơn mài khổ lớn Bình Ngô Đại Cáo / Giang Sơn Cẩm Tú.",
          "cameraPos": [
            10.2,
            5.4,
            9.5
          ],
          "targetPos": [
            10.2,
            4.85,
            -3.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Phòng Nội Các (Tầng Trệt)",
          "description": "Phòng họp Hội đồng Nội các cánh Tây tầng trệt với bàn họp lớn hình chữ U bằng gỗ gõ đỏ bóng, 20 ghế bọc da xanh lục và hệ thống micro hội nghị.",
          "cameraPos": [
            -15.8,
            3.8,
            10.2
          ],
          "targetPos": [
            -10.2,
            2,
            -1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Phòng Làm Việc Tổng Thống & Tứ Phương Vô Sự",
          "description": "Cụm không gian tầng 2 gồm bàn làm việc gỗ gụ Tổng thống, quả địa cầu cùng lầu vọng cảnh Tứ Phương Vô Sự trên tầng thượng với hàng cột sơn son đỏ rực và bàn trà.",
          "cameraPos": [
            -9.5,
            11.8,
            15.5
          ],
          "targetPos": [
            -1.5,
            9.2,
            0.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Tầng Hầm Chỉ Huy Ngầm (B1)",
          "description": "Khu boong-ke bê tông cốt thép chịu bom sâu dưới lòng đất với cửa thép xanh ô-liu kín hơi, bàn tác chiến gỗ, máy điện đài phát đèn tín hiệu và bản đồ quân sự Nam Bộ.",
          "cameraPos": [
            7.8,
            4.6,
            -18.5
          ],
          "targetPos": [
            0,
            -1,
            -8.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f6",
          "name": "Sân Đáp Trực Thăng UH-1 (08/04/1975)",
          "description": "Bãi đáp trực thăng chữ H trên tầng thượng lưu giữ 2 vòng tròn đỏ đánh dấu vị trí trúng bom ngày 08/04/1975 cùng mô hình trực thăng UH-1 Iroquois.",
          "cameraPos": [
            7.5,
            14.5,
            -13.5
          ],
          "targetPos": [
            0,
            10.1,
            -5.6
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-002",
    "officialName": "Nhà hát Thành phố",
    "folkName": "Nhà hát Lớn Sài Gòn / Saigon Opera House",
    "identifierCode": "HCM-Q1-KTNT-002",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.7766,
      "lng": 106.7032
    },
    "vn2000": {
      "x": 1191797.84,
      "y": 604244.63,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "07",
      "street": "Công trường Lam Sơn",
      "ward": "Bến Nghé",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Nhà hát Thành phố là công trình nghệ thuật biểu diễn tiêu biểu mang phong cách Tân Baroque (Flamboyant Beaux-Arts), được xây dựng từ cuối thế kỷ XIX với hệ thống phù điêu, tượng thiên thần và khán phòng âm học xuất sắc.",
    "chronology": "1898 (khởi công) - 1900 (khánh thành)",
    "commencementYear": 1898,
    "architect": "KTS. Félix Olivier, Ernest Guichard và Eugène Ferret",
    "milestones": [
      {
        "year": "1898",
        "event": "Khởi công xây dựng trên Quảng trường Lam Sơn"
      },
      {
        "year": "1900",
        "event": "Khánh thành với vở diễn mở màn của đoàn kịch Pháp"
      },
      {
        "year": "1944",
        "event": "Hư hại một phần do không kích, sau đó gỡ bỏ một số tượng trang trí"
      },
      {
        "year": "1998",
        "event": "Dự án đại tu nhân kỷ niệm 300 năm Sài Gòn - TP.HCM, phục dựng đầy đủ các tác phẩm điêu khắc mặt tiền"
      },
      {
        "year": "2012",
        "event": "Xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Tân Cổ điển Pháp & Beaux-Arts (Phù điêu Gothic - Baroque)",
    "conservationStatus": "Good",
    "conservationNotes": "Được phục hồi nguyên trạng hệ thống tượng nữ thần nâng đỡ vòm mái và hoa văn thạch cao trần khán phòng.",
    "materials": [
      "Đá sa thạch",
      "Vật liệu trang trí nhập khẩu từ Paris",
      "Thạch cao nghệ thuật",
      "Đá hoa cương"
    ],
    "dimensionsDescription": "Khán phòng 468 chỗ ngồi với 3 tầng khán giả, thiết kế dạng móng ngựa đặc trưng châu Âu.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/2/23/%C3%93pera%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_02.JPG",
      "https://vcdn1-vnexpress.vnecdn.net/2021/11/16/nha-hat-4-1539258640-jpeg-3925-1637063505.jpg?w=1020&h=0&q=100&dpr=2&fit=crop&s=ueXg7BQRZ40_2qf4mQESpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Nhà hát Thành phố - Thánh đường âm nhạc giữa lòng Sài Gòn",
        "duration": "03:45",
        "transcript": "Trước mặt quý vị là Nhà hát Thành phố Hồ Chí Minh, khánh thành vào ngày đầu tiên của thế kỷ XX - 1 tháng 1 năm 1900. Lấy cảm hứng từ Nhà hát Opéra Garnier ở Paris, toàn bộ phù điêu và nội thất đều mang đậm tinh thần nghệ thuật Pháp cổ điển..."
      },
      "en": {
        "title": "Saigon Opera House - A century of performing arts",
        "duration": "03:15",
        "transcript": "Standing proudly in Lam Son Square, the Municipal Theatre was inaugurated in 1900. Modeled after the Opéra Garnier in Paris, it remains one of the finest examples of French colonial Flamboyant architecture in Southeast Asia..."
      },
      "fr": {
        "title": "L’Opéra de Saïgon - Héritage flamboyant au cœur de la métropole",
        "duration": "03:30",
        "transcript": "Édifié en 1900 selon les plans de l’architecte Eugène Ferret, l’Opéra de Saïgon s’inspire de la grande tradition théâtrale française de la fin du XIXe siècle..."
      }
    },
    "openingHours": "Theo lịch biểu diễn và chương trình tham quan nghệ thuật đặc biệt",
    "ticketPrices": "Tùy theo chương trình biểu diễn nghệ thuật (À Ố Show, hòa nhạc giao hưởng)",
    "regulations": [
      "Trang phục trang trọng khi dự khán",
      "Tắt chuông điện thoại trong suốt buổi biểu diễn",
      "Không chụp ảnh, quay phim có flash khi nghệ sĩ biểu diễn"
    ],
    "managementUnit": "Nhà hát Giao hưởng Nhạc Vũ Kịch TP.HCM (HBSO) & Trung tâm Tổ chức Biểu diễn",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 54/QĐ-BVHTTDL ngày 11/01/2012",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [
      {
        "id": "REV-002",
        "reviewerName": "TS. Nguyễn Thị Hậu",
        "title": "Tổng thư ký Hội Khoa học Lịch sử TP.HCM",
        "organization": "Hội Khoa học Lịch sử",
        "ratingScore": 95,
        "comment": "Tư liệu lịch sử về quá trình phục hồi tượng mặt tiền năm 1998 đầy đủ, đối chiếu bản vẽ lưu trữ kho tài liệu quốc gia chính xác.",
        "verdict": "approved",
        "timestamp": "2026-02-18"
      }
    ],
    "visibility": "published",
    "updatedAt": "2026-09-15",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền kiến trúc Nhà hát Thành phố Hồ Chí Minh (2013)",
        "Không gian khán phòng và kết cấu mái vòm bên trong Nhà hát Thành phố"
      ],
      "en": [
        "Facade of the Municipal Theatre of Ho Chi Minh City (2013)",
        "Interior Auditorium and Dome Architecture of Saigon Opera House"
      ],
      "zh": [
        "胡志明市大剧院正面建筑全景（2013年）",
        "胡志明市大剧院内部观众厅与穹顶结构"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        22,
        18,
        34
      ],
      "cameraTarget": [
        0,
        6,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Vòm Cuốn Lớn (Tympanum #1d3b36) & Sảnh Caryatids",
          "description": "Mặt tiền chính với bậc tam cấp đá granite xám (#5a5856) vát mở rộng, 2 tượng Nữ thần Caryatids đá trắng ngà (#e8e2d8) đỡ ban công tầng 2 liền mạch, 2 cặp cột tròn đôi Corinth (#d2c6bc) và Vòm cuốn lớn nền xanh lục đậm (#1d3b36) đắp 3 vòng hoa tròn cùng cụm tượng thiên thần xòe cánh chữ V trên đỉnh.",
          "cameraPos": [
            -6,
            9.5,
            30
          ],
          "targetPos": [
            -2.5,
            7.5,
            13
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Hai Cánh Mặt Tiền (1 Cửa Vòm Lớn) & Lan Can Đá Trắng",
          "description": "Hai cánh mặt tiền đối xứng, mỗi bên đặt 1 ô cửa sổ vòm lớn duy nhất ở chính giữa mảng tường đá (#d2c6bc) bao quanh bởi khung phào chỉ chữ nhật đắp nổi, 2 trụ cột vuông góc và hàng lan can con tiện đá trắng (#e8e2d8) che phía trước mái Mansard.",
          "cameraPos": [
            16,
            10.5,
            26
          ],
          "targetPos": [
            8.2,
            6.5,
            11.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Hệ Mái Mansard Đỉnh Bằng (#4a5868) & 6 Cửa Mái Bên Hông",
          "description": "Hệ mái Mansard 4 mặt dốc lợp ngói đá phiến vảy cá xanh xám (#4a5868) giật cấp phía sau vòm mặt tiền và đuôi mái, đỉnh mái phẳng màu xám đá sáng (#7a8288) có gờ viền đá bao quanh và 6 ô cửa mái nhỏ (dormer windows) đều đặn mỗi bên hông.",
          "cameraPos": [
            25,
            17.5,
            -2
          ],
          "targetPos": [
            3.5,
            11.5,
            -4
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "9 Nhịp Hông (Vòm Trung Tâm, Bệ Thềm Đá) & Mặt Hậu Lan Can Đá",
          "description": "Hai bên hông chia 9 nhịp (4 nhịp trái + 1 Nhịp Giữa Nhô Cao Có Vòm Bán Nguyệt + 4 nhịp phải) đặt trên khối bệ thềm đá xám (raised stone terrace) rộng dưới 5 nhịp giữa; mặt hậu kết thúc phẳng bằng hệ lan can con tiện đá trắng trước mái Mansard 5 cửa mái và 6 nhịp vòm dưới.",
          "cameraPos": [
            -18,
            11.5,
            -32
          ],
          "targetPos": [
            -6.5,
            7.2,
            -16
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-003",
    "officialName": "Bưu điện Trung tâm Sài Gòn",
    "folkName": "Bưu điện Thành phố",
    "identifierCode": "HCM-Q1-KTNT-003",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.7798,
      "lng": 106.6999
    },
    "vn2000": {
      "x": 1192150.7,
      "y": 603882.61,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "02",
      "street": "Công xã Paris",
      "ward": "Bến Nghé",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Bưu điện Trung tâm Sài Gòn là một trong những công trình kiến trúc cổ kính và tráng lệ bậc nhất Việt Nam, nơi giao thoa tuyệt mỹ giữa phong cách kiến trúc Phục Hưng phương Tây và các chi tiết trang trí phương Đông.",
    "chronology": "1886 (khởi công) - 1891 (khánh thành)",
    "commencementYear": 1886,
    "architect": "KTS. Alfred Foulhoux và Marie-Alfred Foulhoux (cấu trúc vòm kim loại được thiết kế theo cảm hứng Gustave Eiffel)",
    "milestones": [
      {
        "year": "1886",
        "event": "Khởi công xây dựng trụ sở bưu điện điện báo mới"
      },
      {
        "year": "1891",
        "event": "Khánh thành và đưa vào vận hành hệ thống bưu chính viễn thông Nam Kỳ"
      },
      {
        "year": "2014",
        "event": "Trùng tu chỉnh trang toàn diện lớp sơn và hoa văn mặt tiền"
      },
      {
        "year": "2020",
        "event": "Bảo tồn hai bức bản đồ lịch sử vẽ tay trên tường sảnh chính"
      }
    ],
    "architecturalStyle": "Tân Phục Hưng (Renaissance Revival) kết hợp kết cấu vòm thép tiền chế",
    "conservationStatus": "Good",
    "conservationNotes": "Hai bức bản đồ cổ \"Saigon et ses environs 1892\" và \"Lignes télégraphiques du Sud Vietnam et du Cambodge 1936\" được bảo dưỡng bề mặt.",
    "materials": [
      "Khung thép rèn chịu lực",
      "Gạch nung màu đất son",
      "Gỗ lim",
      "Ngói gốm men"
    ],
    "dimensionsDescription": "Mặt tiền dài hơn 80m, vòm thông tầng cao 12m với trần kim loại cong thanh thoát.",
    "photos": [
      "https://owa.bestprice.vn/images/destinations/uploads/buu-dien-thanh-pho-ho-chi-minh-60a1ec6764a14.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a6/Saigon_Central_Post_Office.JPG"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Bưu điện Trung tâm - Nhịp cầu thư từ hơn 130 năm lịch sử",
        "duration": "04:15",
        "transcript": "Bưu điện Trung tâm Sài Gòn được xây dựng từ năm 1886 đến 1891. Chiếc đồng hồ cổ lớn trên cổng vào vẫn tích tắc đếm thời gian suốt hơn một thế kỷ. Bước vào bên trong, quý khách sẽ choáng ngợp bởi vòm mái thép rèn hình bán nguyệt duyên dáng..."
      },
      "en": {
        "title": "Saigon Central Post Office - Masterpiece of iron architecture",
        "duration": "03:40",
        "transcript": "Built between 1886 and 1891 by architect Alfred Foulhoux, this iconic mustard-yellow monument features stunning barrel-vaulted iron ceilings and hand-painted historical geographic maps..."
      },
      "fr": {
        "title": "Poste Centrale de Saïgon - Chef-d’œuvre d’Alfred Foulhoux",
        "duration": "03:55",
        "transcript": "Érigée à la fin du XIXe siècle, la Poste Centrale de Saïgon fascine par son immense voûte métallique rappelant l’époque de Gustave Eiffel..."
      }
    },
    "openingHours": "07:30 - 18:00 (Mở cửa miễn phí hàng ngày)",
    "ticketPrices": "Miễn phí vào cửa",
    "regulations": [
      "Không làm ồn tại khu vực quầy giao dịch bưu chính đang hoạt động",
      "Giữ gìn vệ sinh chung, không chạm vào các bản đồ lịch sử trên tường"
    ],
    "managementUnit": "Bưu điện TP. Hồ Chí Minh (Tổng Công ty Bưu điện Việt Nam VNPost)",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định công nhận di tích cấp Quốc gia - Bộ VHTTDL",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [
      {
        "id": "REV-003",
        "reviewerName": "KTS. Khương Văn Mười",
        "title": "Phó Chủ tịch Hội Kiến trúc sư Việt Nam",
        "organization": "Hội Kiến trúc sư TP.HCM",
        "ratingScore": 97,
        "comment": "Cấu trúc kết cấu thép mái vòm là minh chứng tiêu biểu của công nghệ xây dựng công nghiệp cuối thế kỷ XIX. Mô hình 3D bóc tách phân tầng rất ấn tượng.",
        "verdict": "approved",
        "timestamp": "2026-03-01"
      }
    ],
    "visibility": "published",
    "updatedAt": "2026-09-22",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền và đồng hồ trung tâm Bưu điện Trung tâm Sài Gòn",
        "Không gian đại sảnh và kết cấu mái vòm khung sắt bên trong Bưu điện Trung tâm Sài Gòn"
      ],
      "en": [
        "Main Facade and Central Clock of Saigon Central Post Office",
        "Main Hall and Iron-truss Vaulted Ceiling of Saigon Central Post Office"
      ],
      "zh": [
        "西贡中心邮政局正面与中央大钟全景",
        "西贡中心邮政局大厅与铁架拱顶结构"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Đồng Hồ Cổ & Cổng Chính (1891)",
          "description": "Chiếc đồng hồ La Mã cổ kính đặt trang trọng trên đỉnh trán tường Tân Phục Hưng chính giữa mặt tiền, lưu giữ nhịp thời gian hơn 130 năm của Sài Gòn.",
          "cameraPos": [
            -5,
            10,
            22
          ],
          "targetPos": [
            -2.5,
            9.2,
            8.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Khung Vòm Thép Gustave Eiffel",
          "description": "Kết cấu vòm kim loại chịu lực thanh thoát thế kỷ XIX chạy dọc sảnh giao dịch chính, lấy sáng tự nhiên qua hệ mái lồng.",
          "cameraPos": [
            14,
            15,
            14
          ],
          "targetPos": [
            3.5,
            8.5,
            -2.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Hệ Cửa Vòm & Cửa Chớp Pháp Cổ",
          "description": "Dãy cửa sổ vòm cao đối xứng hai cánh kết hợp cửa chớp lá sách màu xanh lá đặc trưng giúp thông gió nhiệt đới và tôn lên sắc tường vàng cổ điển.",
          "cameraPos": [
            -16,
            6,
            20
          ],
          "targetPos": [
            -11.5,
            4.5,
            7
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-004",
    "officialName": "Chợ Bến Thành",
    "folkName": "Chợ Mới Sài Gòn",
    "identifierCode": "HCM-Q1-KTNT-004",
    "rankingLevel": "City",
    "type": "Architecture",
    "gps": {
      "lat": 10.7725,
      "lng": 106.698
    },
    "vn2000": {
      "x": 1191342.55,
      "y": 603677.3,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Khuôn viên",
      "street": "Quảng trường Quách Thị Trang",
      "ward": "Bến Thành",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Chợ Bến Thành là biểu tượng giao thương và văn hóa sống động hơn 110 năm của Sài Gòn - TP.HCM. Tháp đồng hồ 4 mặt ở cửa Nam là hình ảnh nhận diện quốc tế của thành phố.",
    "chronology": "1912 (khởi công) - 1914 (khánh thành)",
    "commencementYear": 1912,
    "architect": "Hãng thầu Brossard et Mopin",
    "milestones": [
      {
        "year": "1912",
        "event": "Khởi công xây chợ mới trên vùng đầm lầy Bồ Rệt (Marais Boresse)"
      },
      {
        "year": "1914",
        "event": "Lễ hội khánh thành chợ diễn ra trong 3 ngày với hàng chục ngàn người tham dự"
      },
      {
        "year": "1952",
        "event": "Gắn 12 bức phù điêu gốm Biên Hòa miêu tả sản vật Nam Bộ tại 4 cửa chính"
      },
      {
        "year": "2024",
        "event": "Hoàn thiện hồ sơ xếp hạng Di tích Lịch sử - Kiến trúc Nghệ thuật cấp Thành phố"
      }
    ],
    "architecturalStyle": "Kiến trúc Chợ Đông Dương (Mái ngói xếp tầng thông gió, tháp đồng hồ trung tâm)",
    "conservationStatus": "Good",
    "conservationNotes": "12 bức phù điêu gốm Biên Hòa và tháp đồng hồ cửa Nam được kiểm định bảo tồn di sản.",
    "materials": [
      "Khung thép tiền chế",
      "Gốm Biên Hòa mỹ nghệ",
      "Gạch nung",
      "Ngói âm dương & ngói móc"
    ],
    "dimensionsDescription": "Diện tích mặt bằng hơn 13.000m² với gần 1.500 sạp kinh doanh 4 hướng Đông, Tây, Nam, Bắc.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg",
      "https://vietnamspot.ru/images/articles/ho-chi-minh-prices/hero.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Chợ Bến Thành - Trái tim thương mại và ký ức đô thị",
        "duration": "03:55",
        "transcript": "Tháp đồng hồ Chợ Bến Thành sừng sững ở cửa Nam từ năm 1914 đến nay. Bốn cổng chợ mang tên 4 phương dẫn vào không gian sầm uất với đủ loại đặc sản Nam Bộ, vải vóc và ẩm thực truyền thống..."
      },
      "en": {
        "title": "Ben Thanh Market - Soul of Saigon’s commercial heritage",
        "duration": "03:20",
        "transcript": "Established in 1914, Ben Thanh Market is the heartbeat of Saigon. Its iconic clock tower at the South Gate welcomes millions of travelers each year to explore southern Vietnamese culinary and handicraft traditions..."
      },
      "fr": {
        "title": "Le Marché Ben Thanh - Symbole incontournable de Saïgon",
        "duration": "03:40",
        "transcript": "Inauguré en 1914 par la firme Brossard et Mopin, le marché Ben Thanh et son beffroi central constituent le repère visuel le plus emblématique de la cité..."
      }
    },
    "openingHours": "06:00 - 18:00 (Khu chợ đêm mở cửa từ 18:00 - 22:00)",
    "ticketPrices": "Vào cửa tự do",
    "regulations": [
      "Đề phòng giữ gìn tư trang cá nhân ở chỗ đông người",
      "Tuân thủ quy định phòng cháy chữa cháy trong khu vực chợ"
    ],
    "managementUnit": "Ban Quản lý Chợ Bến Thành (UBND Quận 1)",
    "dossierStatus": "expert_review",
    "decisionDecreeNumber": "Quyết định số 3982/QĐ-UBND của UBND TP.HCM",
    "submittedByUnit": "Ban Quản lý Di tích Quận 1",
    "expertReviews": [
      {
        "id": "REV-004",
        "reviewerName": "Nhà nghiên cứu Nguyễn Đình Tư",
        "title": "Nhà nghiên cứu Địa chí & Lịch sử Sài Gòn",
        "organization": "Hội đồng Khoa học Lịch sử TP.HCM",
        "ratingScore": 96,
        "comment": "Cần bổ sung chú giải về lịch sử chợ Bến Thành cũ bên bờ rạch Bến Nghé trước năm 1914 để người dân hiểu rõ nguồn gốc tên gọi Bến Thành.",
        "verdict": "approved",
        "timestamp": "2026-01-20"
      }
    ],
    "visibility": "published",
    "updatedAt": "2026-09-18",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền Cửa Nam và Tháp đồng hồ Chợ Bến Thành",
        "Không gian kiến trúc mái vòm và các gian hàng truyền thống bên trong Chợ Bến Thành"
      ],
      "en": [
        "South Gate Facade and Clock Tower of Ben Thanh Market",
        "Vaulted Roof Architecture and Traditional Stalls Inside Ben Thanh Market"
      ],
      "zh": [
        "滨城市场南门正面与钟楼全景",
        "滨城市场内部拱顶结构与传统摊位风貌"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Tháp Đồng Hồ Cửa Nam 1914",
          "description": "Tháp chuông 4 mặt sừng sững hướng ra bùng binh Quách Thị Trang, biểu tượng giao thương sầm uất hơn một thế kỷ của Sài Gòn.",
          "cameraPos": [
            -6,
            11,
            23
          ],
          "targetPos": [
            -3.5,
            9.2,
            11
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Mái Ngói Xếp Tầng Thông Gió",
          "description": "Kiến trúc chợ nhiệt đới Nam Bộ với các tầng mái so le lấy gió và ánh sáng tự nhiên xua tan oi bức.",
          "cameraPos": [
            18,
            14,
            12
          ],
          "targetPos": [
            5.5,
            6.5,
            -2.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-005",
    "officialName": "Nhà thờ Chính tòa Đức Bà Sài Gòn",
    "folkName": "Vương cung Thánh đường Đức Bà / Nhà thờ Lớn Sài Gòn",
    "identifierCode": "HCM-Q1-KTNT-005",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.77978,
      "lng": 106.69902
    },
    "vn2000": {
      "x": 1192148.19,
      "y": 603786.37,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "01",
      "street": "Công xã Paris",
      "ward": "Bến Nghé",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Nhà thờ Đức Bà là công trình tôn giáo tiêu biểu với phong cách kiến trúc Romanesque hòa quyện Gothic cổ kính. Toàn bộ gạch nung xây dựng được chuyển từ Toulouse (Pháp) và giữ nguyên sắc hồng đất son suốt gần 150 năm.",
    "chronology": "1877 (đặt viên đá đầu tiên) - 1880 (khánh thành) - 1895 (thêm 2 tháp chuông kẽm)",
    "commencementYear": 1877,
    "architect": "KTS. Jules Bourard",
    "milestones": [
      {
        "year": "1877",
        "event": "Giám mục Isidore Colombert đặt viên đá đầu tiên xây dựng"
      },
      {
        "year": "1880",
        "event": "Khánh thành vào dịp lễ Phục Sinh ngày 11/4/1880"
      },
      {
        "year": "1895",
        "event": "Xây thêm hai ngọn tháp nhọn cao 57,6m gắn 6 quả chuông đồng lớn"
      },
      {
        "year": "1959",
        "event": "Tòa Thánh Vatican phong hiệu Vương cung Thánh đường (Basilica)"
      },
      {
        "year": "2017 - nay",
        "event": "Đại trùng tu toàn diện hệ thống mái ngói và tháp chuông chuẩn châu Âu"
      }
    ],
    "architecturalStyle": "Romanesque kết hợp Gothic cổ điển Pháp",
    "conservationStatus": "Under Restoration",
    "conservationNotes": "Đang trong giai đoạn đại trùng tu kỹ thuật cao với sự phối hợp của các chuyên gia di sản quốc tế (ngói Marseille, kính màu Chartres).",
    "materials": [
      "Gạch ngói Toulouse không rêu mốc",
      "Thép mạ kẽm",
      "Đá cẩm thạch trắng Carrara",
      "Kính màu nghệ thuật"
    ],
    "dimensionsDescription": "Chiều dài 93m, rộng 35m, chiều cao đỉnh tháp chuông 60,5m.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/d/d7/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_03.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_14.JPG"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Vương cung Thánh đường Đức Bà - Ngọn tháp đôi giữa lòng đô thị",
        "duration": "04:05",
        "transcript": "Khởi công năm 1877, Nhà thờ Đức Bà là công trình kỳ vĩ xây dựng hoàn toàn bằng gạch trần sản xuất tại Pháp không hề bám rêu mốc. Hai ngọn tháp nhọn vươn cao 60 mét cùng 6 quả chuông đồng tạo nên thanh âm quen thuộc cho cư dân đô thị..."
      },
      "en": {
        "title": "Notre-Dame Cathedral Basilica of Saigon",
        "duration": "03:35",
        "transcript": "Constructed entirely with bricks imported from Toulouse that never lose their distinctive terracotta color, this Neo-Romanesque cathedral has anchored Saigon’s skyline since 1880..."
      },
      "fr": {
        "title": "Basilique Notre-Dame de Saïgon",
        "duration": "03:50",
        "transcript": "Conçue par Jules Bourard, cette cathédrale aux briques rouges de Toulouse et aux clochers élancés témoigne du savoir-faire architectural du XIXe siècle..."
      }
    },
    "openingHours": "Khuôn viên ngoài: Cả ngày; Thánh lễ: 05:30 & 17:30 (bên trong tạm giới hạn du khách do trùng tu)",
    "ticketPrices": "Miễn phí",
    "regulations": [
      "Khu vực đang thi công trùng tu - du khách chú ý biển báo an toàn",
      "Giữ sự tôn nghiêm khi chụp ảnh bên ngoài nhà thờ"
    ],
    "managementUnit": "Tòa Tổng Giám mục Tổng Giáo phận TP. Hồ Chí Minh",
    "dossierStatus": "district_submitted",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-08-30",
    "photoCaptionsByLang": {
      "vi": [
        "Mặt tiền hai tháp chuông Nhà thờ Chính tòa Đức Bà Sài Gòn và tượng Đức Mẹ Hòa Bình",
        "Không gian nội thất lòng chính điện và kết cấu vòm cuốn Roman – Gothic bên trong Nhà thờ Đức Bà Sài Gòn"
      ],
      "en": [
        "Twin Bell Towers of Notre-Dame Cathedral Basilica of Saigon and Statue of Our Lady of Peace",
        "Main Nave Interior and Romanesque-Gothic Vaulted Arches of Notre-Dame Cathedral Basilica of Saigon"
      ],
      "zh": [
        "西贡圣母大教堂双钟楼与和平圣母像全景",
        "西贡圣母大教堂主殿内部空间与罗曼—哥特式拱顶结构"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        22,
        38
      ],
      "cameraTarget": [
        0,
        10,
        4
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Hai Tháp Chuông Đôi & Chóp Bạc 60m",
          "description": "Hai tháp chuông vuông đối xứng gắn cửa vòm đôi (bifora), đồng hồ cổ, lan can đá trắng và 2 chóp bát giác bọc kẽm cao 60,5m mang Thánh giá trên đỉnh.",
          "cameraPos": [
            -8,
            19,
            26
          ],
          "targetPos": [
            -4.5,
            17,
            9.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Cửa Sổ Hoa Hồng (Rose Window) & 3 Cổng Vòm",
          "description": "Cửa sổ kính màu hình tròn lớn viền đá trắng kết hợp hàng vòm nhỏ (blind arcade) và 3 cổng vòm Romanesque dẫn vào thánh đường.",
          "cameraPos": [
            8,
            9.5,
            22
          ],
          "targetPos": [
            3.5,
            8.2,
            11.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Tượng Đức Mẹ Hòa Bình & Quảng Trường",
          "description": "Tượng Đức Mẹ Hòa Bình bằng đá cẩm thạch trắng Carrara (1959) đặt trên bệ trụ đá cao giữa vườn hoa bầu dục Công xã Paris phía trước nhà thờ.",
          "cameraPos": [
            -10,
            5.5,
            28
          ],
          "targetPos": [
            -4.2,
            3.8,
            18.8
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hậu Cung 3 Tầng Giật Cấp & 5 Nhà Nguyện Tỏa Tia",
          "description": "Cấu trúc Hậu cung (Chevet) 3 tầng đồng tâm phía sau Cánh ngang mở rộng với 5 Nhà nguyện đa giác tỏa hình cánh quạt (-72°, -36°, 0°, +36°, +72°), 6 gờ tường đá tỏa tia chia múi mái tầng giữa và dãy 4 vòm cuốn mặt sau.",
          "cameraPos": [
            12,
            18.5,
            -42
          ],
          "targetPos": [
            5.5,
            7.5,
            -18
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-006",
    "officialName": "Bảo tàng Lịch sử Thành phố Hồ Chí Minh",
    "folkName": "Bảo tàng Blanchard de la Brosse",
    "identifierCode": "HCM-Q1-KTNT-006",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.787992,
      "lng": 106.704756
    },
    "vn2000": {
      "x": 1193058.52,
      "y": 604410.89,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "02",
      "street": "Nguyễn Bỉnh Khiêm",
      "ward": "Bến Nghé",
      "district": "Quận 1",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Tác phẩm xuất sắc của trào lưu Kiến trúc Đông Dương (Indochine) do KTS Auguste Delaval thiết kế. Nơi lưu giữ hàng vạn hiện vật lịch sử quý giá từ thời tiền sử đến thế kỷ XX, đặc biệt là văn hóa Óc Eo và Champa.",
    "chronology": "1926 (khởi công) - 1929 (khánh thành)",
    "commencementYear": 1926,
    "architect": "KTS. Auguste Delaval",
    "milestones": [
      {
        "year": "1926",
        "event": "Khởi công xây dựng trong Vườn Bách Thảo Sài Gòn"
      },
      {
        "year": "1929",
        "event": "Khánh thành với tên Bảo tàng Blanchard de la Brosse"
      },
      {
        "year": "1970",
        "event": "KTS Nguyễn Bá Lăng thiết kế mở rộng phần sau theo hình chữ U"
      },
      {
        "year": "2012",
        "event": "Xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc Đông Dương (Indochinois - giao thoa Âu & Á nhiệt đới)",
    "conservationStatus": "Good",
    "conservationNotes": "Tháp bát giác trung tâm và ngói lưu ly men ngọc được bảo quản tốt.",
    "materials": [
      "Mái ngói âm dương tráng men",
      "Gạch thẻ",
      "Hoa văn rồng phượng trang trí đắp nổi"
    ],
    "dimensionsDescription": "Khuôn viên rợp bóng cây cổ thụ trong Thảo Cầm Viên, mặt tiền có tháp bát giác mô phỏng dịch lý phương Đông.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/5/57/Vietnam_History_Museum_HCMC.JPG",
      "https://vnmh.com.vn/DataFiles/2024/11/News/Tieng%20Viet/15.11.2024/1.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Bảo tàng Lịch sử - Kho tàng văn minh Nam Bộ và phong cách Đông Dương",
        "duration": "04:00",
        "transcript": "Bảo tàng Lịch sử là viên ngọc quý của phong cách Kiến trúc Đông Dương do KTS Auguste Delaval thiết kế. Mái ngói cong, các cửa sổ lấy gió tự nhiên và tháp bát giác độc đáo..."
      },
      "en": {
        "title": "Museum of History - Indochine heritage sanctuary",
        "duration": "03:30",
        "transcript": "Built in 1929, this splendid museum masterfully integrates French neoclassical symmetry with Vietnamese pagoda eaves and cooling verandas..."
      },
      "fr": {
        "title": "Musée d’Histoire de Hô Chi Minh-Ville",
        "duration": "03:45",
        "transcript": "Conçu par Auguste Delaval, le musée incarne le style indochinois dans toute sa splendeur décorative..."
      }
    },
    "openingHours": "08:00 - 11:30 & 13:00 - 17:00 (Thứ Ba đến Chủ Nhật)",
    "ticketPrices": "30.000 VNĐ/lượt",
    "regulations": [
      "Không sờ vào cổ vật và hiện vật trưng bày",
      "Không sử dụng chân máy ảnh trong phòng trưng bày"
    ],
    "managementUnit": "Bảo tàng Lịch sử TP. Hồ Chí Minh",
    "dossierStatus": "approved_published",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-09-01",
    "photoCaptionsByLang": {
      "vi": [
        "Cổng chính và khối tháp bát giác phong cách kiến trúc Đông Dương tại Bảo tàng Lịch sử TP. Hồ Chí Minh",
        "Không gian sân vườn trưng bày ngoài trời và nhà bia truyền thống tại Bảo tàng Lịch sử"
      ],
      "en": [
        "Main Entrance and Indochinese Octagonal Tower of the Museum of Vietnamese History in HCMC",
        "Outdoor Artifact Courtyard and Traditional Stele Pavilion at the Museum of History"
      ],
      "zh": [
        "胡志明市历史博物馆印度支那风格正门与八角塔楼",
        "历史博物馆户外文物庭院与传统碑亭景观"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        24,
        19,
        34
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Tháp Bát Giác Trung Tâm 3 Tầng Mái Chồng Diêm (Biểu tượng Đông Dương 1929)",
          "description": "Khối tháp bát giác trung tâm do KTS Auguste Delaval thiết kế năm 1929 với hệ mái ngói ống âm dương 3 tầng chồng diêm uy nghi, hai tầng cổ diêm trổ cửa thông phong và đỉnh hồ lô đồng cổ ở tâm đỉnh chóp.",
          "cameraPos": [
            -6,
            12.5,
            22
          ],
          "targetPos": [
            -2.5,
            9.5,
            1
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Sảnh Chính, Hệ Đấu Củng - Con Sơn & Cửa Gỗ Hoa Văn Kỷ Hà",
          "description": "Hiên sảnh đón mở rộng có chiều sâu với 9 bậc tam cấp đá, 4 cột vuông trắng ngà phía trước đỡ hệ đấu củng nhiều tầng, 3 bộ Cửa Đại Khoa bằng gỗ lim chạm ô vuông Á Đông lùi vào trong và bảng tên BẢO TÀNG LỊCH SỬ.",
          "cameraPos": [
            8,
            5.5,
            19.5
          ],
          "targetPos": [
            4.2,
            3.8,
            7.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Hai Cánh Trưng Bày Đối Xứng & Hệ Cửa Sổ Lá Sách Thông Gió Nhiệt Đới",
          "description": "Hai dãy nhà cánh dài đối xứng mỗi bên 5 nhịp trụ tường phẳng, tường vàng nghệ cổ điển (#d9b66c), cửa sổ cao lắp 2 cánh chớp lá sách gỗ lim thông gió nhiệt đới kết hợp ô thoáng kỷ hà và mái dốc 4 mặt chồng diêm.",
          "cameraPos": [
            -14,
            8,
            21.5
          ],
          "targetPos": [
            -10.8,
            4.5,
            1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hai Khối Đầu Hồi Chữ U & Nghệ Thuật Trang Trí Giao Thoa Á - Âu",
          "description": "Hai khối đầu hồi nhô ra ở hai đầu (x = ±15.2 đến ±19.2) tạo thế chữ U bề thế, nổi bật với cụm 3 cửa sổ gỗ cao ghép liền nhau, khung phù điêu ngang phía trên, lan can con tiện đá dưới hiên và mái ngói dốc 4 mặt.",
          "cameraPos": [
            19.5,
            8.8,
            21.5
          ],
          "targetPos": [
            15.5,
            5,
            2.2
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-007",
    "officialName": "Bến Nhà Rồng - Bảo tàng Hồ Chí Minh",
    "folkName": "Bến cảng Nhà Rồng / Hãng tàu Messageries Maritimes xưa",
    "identifierCode": "HCM-Q4-LS-007",
    "rankingLevel": "National",
    "type": "History",
    "gps": {
      "lat": 10.7681,
      "lng": 106.7068
    },
    "vn2000": {
      "x": 1190858.83,
      "y": 604641.31,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "01",
      "street": "Nguyễn Tất Thành",
      "ward": "Phường 12",
      "district": "Quận 4",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Nơi người thanh niên yêu nước Nguyễn Tất Thành (Chủ tịch Hồ Chí Minh) bước chân lên con tàu Amiral Latouche-Tréville ra đi tìm đường cứu nước ngày 5/6/1911. Tòa nhà nguyên là trụ sở thương cảng của Hãng tàu Thống nhất Pháp với đôi rồng ngậm ngọc trên nóc.",
    "chronology": "1863 (xây dựng trụ sở) - 1911 (sự kiện lịch sử Bác Hồ ra đi tìm đường cứu nước)",
    "commencementYear": 1863,
    "architect": "Hãng Vận tải đường biển Messageries Maritimes",
    "milestones": [
      {
        "year": "1863",
        "event": "Khởi công xây dựng trụ sở thương cảng tại ngã ba sông Sài Gòn và rạch Bến Nghé"
      },
      {
        "year": "1911",
        "event": "Người thanh niên Nguyễn Tất Thành xuất phát tìm đường giải phóng dân tộc"
      },
      {
        "year": "1979",
        "event": "Công nhận là Di tích Lịch sử cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc thực dân phương Tây kết hợp tượng rồng đất nung truyền thống Việt trên nóc mái",
    "conservationStatus": "Good",
    "conservationNotes": "Được tôn tạo cảnh quan công viên ven sông Sài Gòn.",
    "materials": [
      "Gạch đất nung",
      "Tượng lưỡng long triều nhật tráng men",
      "Gỗ lim Nam Bộ"
    ],
    "dimensionsDescription": "Tòa nhà hai tầng tọa lạc ngay ngã ba sông đắc địa mở tầm nhìn thoáng đãng ra sông Sài Gòn.",
    "photos": [
      "https://cafefcdn.com/203337114487263232/2022/9/22/photo-8-1663852672514412348474.jpg",
      "https://phongnhaviet.com/uploads/tour/2024_04/ben_nha_rong_2-transformed.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Bến Nhà Rồng - Dấu son ngày 5 tháng 6 năm 1911",
        "duration": "04:20",
        "transcript": "Bến cảng Nhà Rồng là nơi gắn liền với dấu ấn vĩ đại của lịch sử hiện đại Việt Nam. Ngày 5 tháng 6 năm 1911, từ bến cảng này, người thanh niên 21 tuổi Nguyễn Tất Thành đã bắt đầu cuộc hành trình 30 năm bôn ba qua bốn biển năm châu..."
      },
      "en": {
        "title": "Dragon Wharf - Historic journey of National Liberation",
        "duration": "03:40",
        "transcript": "On June 5, 1911, a young patriot named Nguyen Tat Thanh boarded the steamship Amiral Latouche-Treville from this very dock, embarking on his thirty-year journey to seek national independence..."
      },
      "fr": {
        "title": "Quai des Messageries Maritimes - Port historique de Saïgon",
        "duration": "03:50",
        "transcript": "Construit en 1863 pour la compagnie des Messageries Maritimes, ce bâtiment a marqué le départ historique d’Hô Chi Minh en 1911..."
      }
    },
    "openingHours": "07:30 - 11:30 & 13:30 - 17:00 (Từ Thứ Ba đến Chủ Nhật)",
    "ticketPrices": "20.000 VNĐ (Miễn phí cho học sinh, sinh viên)",
    "regulations": [
      "Giữ gìn trật tự và trang nghiêm trong phòng tưởng niệm",
      "Không chạm tay vào các tư liệu gốc và hiện vật lịch sử"
    ],
    "managementUnit": "Bảo tàng Hồ Chí Minh - Chi nhánh TP. Hồ Chí Minh",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 1288/VH-QĐ",
    "submittedByUnit": "Ban Quản lý Di tích Quận 4",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-09-10",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền kiến trúc Bến Nhà Rồng – Bảo tàng Hồ Chí Minh hướng sông Sài Gòn",
        "Toàn cảnh khuôn viên Bến Nhà Rồng bên ngã ba sông Sài Gòn về đêm"
      ],
      "en": [
        "Riverfront Facade of Nha Rong Wharf – Ho Chi Minh Museum",
        "Aerial Night View of Nha Rong Wharf Along the Saigon River"
      ],
      "zh": [
        "芽龙港—胡志明博物馆临江正面建筑全景",
        "西贡河畔芽龙港园区夜间俯瞰全景"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Đôi Rồng Đất Nung Trên Mái (Lưỡng Long Chầu Nguyệt)",
          "description": "Tượng đôi rồng đất nung tráng men xanh ngọc lưu ly chầu mặt trăng trên đỉnh mái tòa nhà hãng tàu Messageries Maritimes (1863).",
          "cameraPos": [
            -6,
            16,
            19
          ],
          "targetPos": [
            -3.5,
            13.8,
            0
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Hành Lang Vòm Cuốn Pháp Cổ 7 Nhịp",
          "description": "Hệ hành lang vòm cuốn bán nguyệt bao quanh 4 mặt kết hợp hàng cột vuông trắng kem và tường gạch đất nung thoáng mát ven sông Sài Gòn.",
          "cameraPos": [
            16,
            7.5,
            22
          ],
          "targetPos": [
            6.5,
            4.5,
            5.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-008",
    "officialName": "Lăng Tả quân Lê Văn Duyệt",
    "folkName": "Lăng Ông Bà Chiểu / Miếu Thượng Công",
    "identifierCode": "HCM-BT-LSKT-008",
    "rankingLevel": "National",
    "type": "History",
    "gps": {
      "lat": 10.8016,
      "lng": 106.6974
    },
    "vn2000": {
      "x": 1194561.28,
      "y": 603601.71,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "01",
      "street": "Vũ Tùng",
      "ward": "Phường 1",
      "district": "Quận Bình Thạnh",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Khu lăng mộ và đền thờ Tả quân Tổng trấn thành Gia Định Lê Văn Duyệt (1764-1832), người có công lớn trong việc khai phá, mở mang và phát triển vùng đất phương Nam trù phú, bình ổn biên cương.",
    "chronology": "1848 (khởi dựng lại sau khi vua Thiệu Trị giải oan) - 1914 (tôn tạo tiền điện)",
    "commencementYear": 1848,
    "architect": "Thợ chạm khắc mỹ nghệ dân gian cung đình Huế & nghệ nhân Nam Bộ",
    "milestones": [
      {
        "year": "1832",
        "event": "Tả quân Lê Văn Duyệt qua đời, an táng tại Bà Chiểu"
      },
      {
        "year": "1848",
        "event": "Vua Tự Đức truy phục chức hàm, ban chỉ tôn tạo lăng mộ"
      },
      {
        "year": "1989",
        "event": "Được công nhận Di tích Lịch sử Văn hóa cấp Quốc gia"
      },
      {
        "year": "2020",
        "event": "Lễ hội Khai hạ - Cầu an tại Lăng Ông được ghi danh Di sản Văn hóa Phi vật thể Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc lăng tẩm truyền thống Nam Bộ thời Nguyễn (nhà trùng thiềm điệp ốc, khảm gốm và mảnh sành sứ)",
    "conservationStatus": "Good",
    "conservationNotes": "Hệ thống hoành phi, câu đối, đồ tự khí và nghệ thuật cẩn sành sứ cổ được tu bổ bảo toàn giá trị thẩm mỹ.",
    "materials": [
      "Gốm sành sứ Cây Mai",
      "Gỗ quý Nam Bộ",
      "Đá ong móng mộ",
      "Vôi vỏ sò truyền thống"
    ],
    "dimensionsDescription": "Khuôn viên rộng 18.500m² với nhà bia, khu mộ cổ rùa đá và đền thờ trung điện, chính điện.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/8/82/C%E1%BB%95ng_ch%C3%ADnh_L%C4%83ng_%C3%94ng_B%C3%A0_Chi%E1%BB%83u.jpg",
      "https://redsvn.net/wp-content/uploads/2018/02/Redsvn-Lang-Ong-Ba-Chieu-09.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Lăng Ông Bà Chiểu - Trái tim tâm linh và công đức khai mở phương Nam",
        "duration": "04:30",
        "transcript": "Lăng Ông Bà Chiểu là chốn tôn nghiêm bậc nhất của người dân Sài Gòn - Gia Định. Tả quân Lê Văn Duyệt là vị Tổng trấn công minh, biến Sài Gòn thành trung tâm giao thương sầm uất đa văn hóa. Nghệ thuật ghép sành sứ tinh xảo trên bờ nóc đền thờ là đỉnh cao mỹ thuật dân gian Nam Bộ..."
      },
      "en": {
        "title": "Le Van Duyet Tomb - Memorial of the southern viceroy",
        "duration": "03:45",
        "transcript": "Honoring the legendary Viceroy of Gia Dinh Citadel, Marshal Le Van Duyet, this sacred memorial reflects southern Vietnamese temple architecture and vibrant mosaic craftsmanship..."
      },
      "fr": {
        "title": "Mausolée du Maréchal Lê Van Duyêt",
        "duration": "03:50",
        "transcript": "Lieu de dévotion populaire majeur, le tombeau du maréchal Lê Van Duyêt célèbre la mémoire du gouverneur qui assura la prospérité du delta méridional au XIXe siècle..."
      }
    },
    "openingHours": "07:00 - 17:00 (Mở cửa tất cả các ngày trong năm)",
    "ticketPrices": "Vào cửa tự do",
    "regulations": [
      "Trang phục kín đáo, lịch sự khi vào khu vực nội điện",
      "Thắp hương đúng nơi quy định, tôn trọng phong tục tín ngưỡng"
    ],
    "managementUnit": "Ban Quản lý Di tích Lịch sử Văn hóa Lăng Lê Văn Duyệt (UBND Q. Bình Thạnh)",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 1288/VH-QĐ của Bộ Văn hóa",
    "submittedByUnit": "Ban Quản lý Di tích Quận Bình Thạnh",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-09-05",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh cổng Tam Quan Thượng Công Miếu tại Lăng Tả quân Lê Văn Duyệt",
        "Không gian sân thiên tỉnh, lư hương đá và kiến trúc gỗ sơn son thếp vàng tại Lăng Tả quân Lê Văn Duyệt"
      ],
      "en": [
        "Triple-Arched Main Gate (Tam Quan) of Le Van Duyet Mausoleum",
        "Inner Courtyard, Stone Incense Burner and Gilded Red-Lacquered Doors at Le Van Duyet Mausoleum"
      ],
      "zh": [
        "左军黎文悦陵“上公庙”三关门正面全景",
        "左军黎文悦陵内庭院、石香炉与朱漆贴金木雕殿门景观"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Cổng Tam Quan & Bình Phong Rồng Hổ",
          "description": "Cổng Tam Quan cổ kính hai tầng mái ngói âm dương uốn cong đầu đao cùng Lưỡng Long Chầu Nguyệt, chắn sau là bức bình phong Rồng Hổ.",
          "cameraPos": [
            0,
            8.5,
            25
          ],
          "targetPos": [
            0,
            3.2,
            12.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Nhà Bia Đá Cổ Phan Thanh Giản (1868)",
          "description": "Nhà bia tứ giác bên trái sân lăng lưu giữ tấm bia đá xanh khắc bài văn bia ca ngợi công đức khai mở Gia Định của Tả quân.",
          "cameraPos": [
            -16,
            6.5,
            14
          ],
          "targetPos": [
            -9.5,
            2.2,
            7.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Tiền Điện, Đỉnh Đồng & Bao Lam Thếp Vàng",
          "description": "Hệ mái ngói âm dương nối tiếp cùng đỉnh đồng lớn trước sân, hương án sơn son thếp vàng và hai hàng giá binh khí Bát Bửu.",
          "cameraPos": [
            12,
            7.5,
            11
          ],
          "targetPos": [
            0,
            2.5,
            1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Chính Điện & Khám Thờ Tả Quân Thếp Vàng",
          "description": "Trung tâm nội thất điện thờ với khám thờ sơn son thếp vàng rực rỡ và hệ cột gỗ sơn son chạm trổ tinh xảo.",
          "cameraPos": [
            7.5,
            5.5,
            4.5
          ],
          "targetPos": [
            0,
            2.2,
            -7.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Mộ Song Táng Hình Nấm Rùa",
          "description": "Hai ngôi mộ cổ của Tả quân Lê Văn Duyệt và nhị vị phu nhân đắp vữa ô dước hình mai rùa nằm trong vòng thành đá phía sau.",
          "cameraPos": [
            -12,
            7.2,
            -18
          ],
          "targetPos": [
            0,
            1.2,
            -11.8
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-009",
    "officialName": "Khu di tích lịch sử Địa đạo Củ Chi",
    "folkName": "Vùng đất thép Củ Chi / Địa đạo Bến Dược - Bến Đình",
    "identifierCode": "HCM-CC-LS-009",
    "rankingLevel": "Special National",
    "type": "History",
    "gps": {
      "lat": 11.1444,
      "lng": 106.4636
    },
    "vn2000": {
      "x": 1232409.44,
      "y": 577943.48,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Ấp Phú Hiệp",
      "street": "Tỉnh lộ 15",
      "ward": "Xã Phú Mỹ Hưng",
      "district": "Huyện Củ Chi",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Kỳ quan nghệ thuật quân sự độc nhất vô nhị trên thế giới với chiều dài hơn 250km đường hầm ngầm trong lòng đất sét pha đá ong (laterite clay) trên nền phù sa cổ bền chắc như bê tông tự nhiên. Hiện TP.HCM đang tích cực hoàn thiện hồ sơ đệ trình UNESCO ghi danh là Di sản Thế giới.",
    "chronology": "1948 (bắt đầu đào thời kháng chiến chống Pháp) - 1968 (hoàn thiện liên hoàn hệ thống)",
    "commencementYear": 1948,
    "architect": "Quân và dân Huyện Củ Chi sáng tạo trong thực tiễn chiến đấu",
    "milestones": [
      {
        "year": "1948",
        "event": "Khởi đầu từ những hầm bí mật đơn lẻ ở xã Tân Phú Trung và Phước Vĩnh An"
      },
      {
        "year": "1961 - 1968",
        "event": "Phát triển thành hệ thống đường ngầm 3 tầng liên hoàn dài hơn 250km"
      },
      {
        "year": "2015",
        "event": "Thủ tướng Chính phủ xếp hạng Di tích Quốc gia Đặc biệt"
      },
      {
        "year": "2024 - 2026",
        "event": "Hoàn thiện hồ sơ di sản đệ trình UNESCO công nhận Di sản Thế giới"
      }
    ],
    "architecturalStyle": "Công trình quân sự phòng thủ ngầm độc đáo (3 tầng sâu từ 3m đến 12m)",
    "conservationStatus": "Good",
    "conservationNotes": "Hệ thống lỗ thông hơi, bếp Hoàng Cầm và kết cấu lòng đất sét pha đá ong trên nền phù sa cổ được gia cố an toàn đón hàng triệu lượt khách.",
    "materials": [
      "Đất sét pha đá ong (laterite clay) trên nền phù sa cổ bền chắc như bê tông tự nhiên",
      "Gỗ rừng nhiệt đới làm khung chống"
    ],
    "dimensionsDescription": "Trục đường ngầm dài hơn 250km tỏa nhánh như mạng nhện, đầy đủ bệnh xá, phòng họp, giếng nước ngầm.",
    "photos": [
      "https://tphcm.cdnchinhphu.vn/334895287454388224/2023/2/9/lich-su-dia-dao-cu-chi-16759444202221598085616-32-0-859-1323-crop-1675944470600559109852.jpg",
      "https://senteursduvietnam.com/wp-content/uploads/2022/11/1.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Địa đạo Củ Chi - Thành phố ngầm huyền thoại trong lòng đất thép",
        "duration": "05:10",
        "transcript": "Địa đạo Củ Chi là minh chứng sống động cho ý chí kiên cường và trí tuệ sáng tạo phi thường. Nằm sâu trong lòng đất từ 3 đến 12 mét, hệ thống địa đạo liên hoàn 3 tầng có đầy đủ các phân khu chức năng như phòng mổ dã chiến, xưởng quân giới, bếp Hoàng Cầm không khói..."
      },
      "en": {
        "title": "Cu Chi Tunnels - Legendary subterranean warfare system",
        "duration": "04:15",
        "transcript": "Stretching over 250 kilometers underground, Cu Chi Tunnels represent an astonishing feat of human engineering and resilience. Currently on Vietnam’s tentative list for UNESCO World Heritage recognition..."
      },
      "fr": {
        "title": "Tunnels de Cu Chi - Le réseau souterrain héroïque",
        "duration": "04:30",
        "transcript": "Ce labyrinthe de plus de 250 km de galeries taillées à même l’argile témoigne de l’ingéniosité tactique exceptionnelle des résistants..."
      }
    },
    "openingHours": "07:30 - 17:00 (Mở cửa tất cả các ngày trong năm)",
    "ticketPrices": "125.000 VNĐ (Khách quốc tế) / 35.000 VNĐ (Khách Việt Nam)",
    "regulations": [
      "Người có tiền sử bệnh tim mạch hoặc chứng sợ không gian hẹp (claustrophobia) nên cân nhắc trước khi xuống hầm sâu",
      "Đi theo sự chỉ dẫn nghiêm ngặt của hướng dẫn viên chuyên nghiệp"
    ],
    "managementUnit": "Khu Di tích Lịch sử Địa đạo Củ Chi",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 2367/QĐ-TTg của Thủ tướng Chính phủ",
    "submittedByUnit": "Sở Văn hóa và Thể thao TP. Hồ Chí Minh",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-09-25",
    "photoCaptionsByLang": {
      "vi": [
        "Lối xuống đường hầm Cửa số 5 tại Khu di tích lịch sử Địa đạo Củ Chi",
        "Cụm lán trại mái lá ngụy trang và hầm bán âm dưới tán rừng Địa đạo Củ Chi"
      ],
      "en": [
        "Entrance No. 5 to the Underground Tunnel Network at Cu Chi Tunnels Historical Site",
        "Camouflaged Thatched Shelters and Semi-subterranean Dugouts in Cu Chi Forest"
      ],
      "zh": [
        "古芝地道历史遗迹区5号地下通道入口",
        "古芝地道林荫下的伪装茅草棚与半地下掩体景观"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        24,
        19,
        28
      ],
      "cameraTarget": [
        0,
        2,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Rừng Ngụy Trang, Hố Bom B-52 & Ụ Mối Thông Hơi",
          "description": "Tầng mặt đất tái hiện rừng nhiệt đới Củ Chi với lối mòn đất đỏ, 2 hố bom B-52, lán lá chữ A nửa chìm nửa nổi, 3 ụ mối ngụy trang ống thông hơi, cửa hầm bí mật và hầm chông tre.",
          "cameraPos": [
            -16,
            18,
            22
          ],
          "targetPos": [
            -8.5,
            8.8,
            -4.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Tầng 1 (Sâu 3m): Hầm Chỉ Huy & Bếp Hoàng Cầm Tản Khói",
          "description": "Tầng hầm đầu tiên cách mặt đất 3m gồm Phòng họp & Chỉ huy có cột gỗ chống trần, bàn sa bàn tác chiến, cờ Mặt trận, hầm Bếp Hoàng Cầm có rãnh dẫn khói tản nhiệt ngầm và đường hầm chữ Z có nút chặn chống độc.",
          "cameraPos": [
            -14,
            9.5,
            25
          ],
          "targetPos": [
            -7.5,
            5.2,
            8.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Tầng 2 (Sâu 6m): Hầm Quân Y, Xưởng Vũ Khí & Nút Chặn Chữ Z",
          "description": "Tầng hầm giữa ở độ sâu 6m bố trí Hầm Quân y dã chiến (giường tre, võng dù, bàn mổ, tủ thuốc), Hầm Công binh cưa vỏ bom chế tạo vũ khí và trục đường hầm xương sống mặt cắt bên phải (+X) có hố tụt thông tầng.",
          "cameraPos": [
            20,
            7.5,
            22
          ],
          "targetPos": [
            8.5,
            2.8,
            5.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Tầng 3 (Sâu 10m): Hầm Trú Ẩn B-52, Giếng Nước Ngầm & Lối Thoát Ra Sông",
          "description": "Tầng hầm sâu nhất (8m - 10m) trong lớp đất sét pha đá ong (laterite clay) trên nền phù sa cổ bền chắc như bê tông tự nhiên gồm Hầm trú ẩn chống bom B-52, Giếng nước ngầm và ngách thoát hiểm ra sông Sài Gòn.",
          "cameraPos": [
            -12,
            3.5,
            24
          ],
          "targetPos": [
            -2.5,
            -2.2,
            9.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Mặt Cắt Địa Chất Đá Ong (Laterite Clay) & Giao Thông Hào",
          "description": "Cấu trúc địa chất đất sét pha đá ong trên nền phù sa cổ có độ kết dính tự nhiên siêu bền, cho phép đào hơn 250km đường hầm 3 tầng chịu được sức ép bom đạn và xe tăng hạng nặng.",
          "cameraPos": [
            22,
            12,
            -16
          ],
          "targetPos": [
            9.5,
            5.5,
            -6.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f6",
          "name": "Cửa Hầm Bí Mật Ngụy Trang & Bẫy Chông Tre Củ Chi",
          "description": "Hệ thống nắp hầm gỗ ngụy trang lá rừng khô kết hợp lỗ thông hơi hình ụ mối tự nhiên và cụm hầm chông chiến đấu bảo vệ vòng ngoài khu căn cứ.",
          "cameraPos": [
            14,
            15,
            24
          ],
          "targetPos": [
            4.2,
            8.2,
            9.2
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-010",
    "officialName": "Khu Di tích Khảo cổ học Giồng Cá Vồ",
    "folkName": "Gò Cổ Giồng Cá Vồ Cần Giờ",
    "identifierCode": "HCM-CG-KC-010",
    "rankingLevel": "National",
    "type": "Archaeology",
    "gps": {
      "lat": 10.4578,
      "lng": 106.8856
    },
    "vn2000": {
      "x": 1156599.78,
      "y": 624323.46,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Ấp Hòa Hiệp",
      "street": "Đường ven rừng Sác",
      "ward": "Xã Long Hòa",
      "district": "Huyện Cần Giờ",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Di tích khảo cổ học mộ chum đặc biệt quan trọng thuộc văn hóa Tiền Óc Eo (thế kỷ III TCN đến thế kỷ I SCN), minh chứng cho sự tồn tại của một trung tâm chế tác trang sức đá quý, thủy tinh và thương cảng biển sơ khai cách đây hơn 2.000 năm.",
    "chronology": "Thế kỷ III trước Công nguyên - Thế kỷ I sau Công nguyên",
    "commencementYear": -300,
    "architect": "Cư dân cổ Tiền Óc Eo & Cảng thị duyên hải Nam Bộ xưa",
    "milestones": [
      {
        "year": "1993",
        "event": "Phát hiện di chỉ và tiến hành khai quật khảo cổ học đợt đầu"
      },
      {
        "year": "1994",
        "event": "Khai quật hàng trăm mộ chum gốm lớn chứa di cốt và đồ tùy táng bằng vàng, mã não"
      },
      {
        "year": "2000",
        "event": "Bộ Văn hóa Thông tin xếp hạng Di tích Khảo cổ học cấp Quốc gia"
      },
      {
        "year": "2023",
        "event": "Phát hiện khuyên tai hai đầu thú bằng đá ngọc nefrit và thủy tinh nhân tạo cổ"
      }
    ],
    "architecturalStyle": "Di chỉ khảo cổ học táng tục Mộ Chum (Jar Burial) và xưởng chế tác thủ công ven biển",
    "conservationStatus": "Good",
    "conservationNotes": "Hiện trường khai quật có mái che bảo vệ địa tầng và kho bảo quản hiện vật nguyên trạng.",
    "materials": [
      "Gốm thô áo đỏ",
      "Đá ngọc nephrite",
      "Vàng lá trang sức",
      "Thủy tinh cổ"
    ],
    "dimensionsDescription": "Gò đất cát nổi giữa vùng rừng ngập mặn Cần Giờ với diện tích khảo cổ gần 2 ha.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mangrove_in_Can_Gio_forest.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/87/Oc_Eo_Culture_Gold_Coin_1.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": false,
    "audioGuide": {
      "vn": {
        "title": "Giồng Cá Vồ - Dấu ấn cảng thị cổ hơn 2.000 năm trước ở Cần Giờ",
        "duration": "04:10",
        "transcript": "Giồng Cá Vồ là di chỉ khảo cổ học vô cùng quý hiếm của TP.HCM. Hơn hai ngàn năm trước, nơi đây từng là một trung tâm chế tác đá quý và cảng thị phồn vinh trên con đường gốm sứ và tơ lụa trên biển..."
      },
      "en": {
        "title": "Giong Ca Vo - 2,000-year-old prehistoric archaeological harbor",
        "duration": "03:40",
        "transcript": "Situated in the mangrove biosphere of Can Gio, Giong Ca Vo represents one of the most critical Pre-Oc Eo archaeological sites with unique terracotta jar burials and jade ear ornaments..."
      },
      "fr": {
        "title": "Site archéologique de Giong Ca Vo",
        "duration": "03:45",
        "transcript": "Vieux de plus de 2 000 ans, ce site exceptionnel témoigne des réseaux commerciaux maritimes antiques en Asie du Sud-Est..."
      }
    },
    "openingHours": "08:00 - 16:30 (Cần liên hệ đăng ký trước đối với đoàn nghiên cứu chuyên đề)",
    "ticketPrices": "20.000 VNĐ/khách",
    "regulations": [
      "Tuyệt đối không xâm phạm các hố khai quật địa tầng",
      "Tuân thủ quy chế bảo vệ khu Dự trữ Sinh quyển Rừng ngập mặn Cần Giờ"
    ],
    "managementUnit": "Bảo tàng Lịch sử TP.HCM & UBND Huyện Cần Giờ",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 38/2000/QĐ-BVHTT",
    "submittedByUnit": "Ban Quản lý Di tích Huyện Cần Giờ",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-09-02",
    "photoCaptionsByLang": {
      "vi": [
        "Cảnh quan hệ sinh thái rừng ngập mặn Cần Giờ bao quanh Khu Di tích Khảo cổ học Giồng Cá Vồ",
        "Hiện vật đồng tiền bạc cổ cắt đôi thuộc văn hóa Óc Eo – Phù Nam tại vùng di tích Giồng Cá Vồ"
      ],
      "en": [
        "Can Gio Mangrove Ecosystem Surrounding Giong Ca Vo Archaeological Site",
        "Halved Ancient Silver Coin Artifact of Oc Eo – Funan Culture at Giong Ca Vo"
      ],
      "zh": [
        "环绕榕卡沃考古遗址区的芹耶红树林生态环境景观",
        "榕卡沃遗址区出土的扶南—奥埃文化半切古银币文物"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        21,
        15,
        25
      ],
      "cameraTarget": [
        0,
        0.8,
        1.5
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Địa Tầng Khảo Cổ & Mái Che Bảo Tồn",
          "description": "Mặt cắt địa chất Giồng Cá Vồ phân tách 3 lớp đất cát giồng, tầng văn hóa Tiền Óc Eo và bùn ngập mặn Cần Giờ.",
          "cameraPos": [
            18,
            12,
            20
          ],
          "targetPos": [
            0,
            1.5,
            1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Quần Thể 300+ Mộ Chum Gốm Cổ (Lathe 3D)",
          "description": "Các mộ chum gốm hình trứng và hình trụ đứng đặt trong lưới hố khai quật ô vuông có niên đại hơn 2.500 năm.",
          "cameraPos": [
            -8,
            6.2,
            12
          ],
          "targetPos": [
            -1.3,
            -0.4,
            1.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Khuyên Tai Hai Đầu Thú & Hạt Mã Não",
          "description": "Hiện vật tùy táng quý hiếm bằng vàng, đá ngọc nephrite và hạt mã não đỏ cam phát sáng khi bật X-Ray.",
          "cameraPos": [
            5.5,
            4.5,
            9.5
          ],
          "targetPos": [
            1.4,
            -0.4,
            4.3
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hố Khai Quật Lưới Dây & Cọc Mốc",
          "description": "Hệ thống dây định vị và cọc mốc khảo cổ học giúp ghi nhận chính xác tọa độ từng hiện vật gốm chân đế.",
          "cameraPos": [
            0,
            10,
            14
          ],
          "targetPos": [
            0,
            0.2,
            3.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Hệ Sinh Thái Rừng Đước & Kênh Triều Cần Giờ",
          "description": "Cây đước rễ chống và lạch nước thủy triều bao bọc gò đất cao cổ đại giữa vùng ngập mặn.",
          "cameraPos": [
            18,
            8.5,
            -10
          ],
          "targetPos": [
            10.5,
            1.5,
            -3.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-011",
    "officialName": "Chùa Giác Lâm",
    "folkName": "Tổ đình Giác Lâm / Chùa Cẩm Sơn",
    "identifierCode": "HCM-TB-KTNT-011",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.7794,
      "lng": 106.6506
    },
    "vn2000": {
      "x": 1192090.16,
      "y": 598490.78,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "565",
      "street": "Lạc Long Quân",
      "ward": "Phường 10",
      "district": "Quận Tân Bình",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Một trong những ngôi chùa cổ nhất của vùng đất Sài Gòn - Gia Định, được xây dựng từ năm 1744 dưới thời chúa Nguyễn Phúc Khoát. Ngôi chùa lưu giữ hơn 100 pho tượng gỗ cổ quý hiếm và kiến trúc chữ Tam đặc trưng Nam Bộ.",
    "chronology": "1744 (khởi lập) - 1798 (đại trùng tu)",
    "commencementYear": 1744,
    "architect": "Thiền sư Viên Quang cùng các thợ chạm thủ công truyền thống Nam Bộ",
    "milestones": [
      {
        "year": "1744",
        "event": "Cư sĩ Lý Thụy Long quyên tiền khởi dựng chùa Cẩm Sơn"
      },
      {
        "year": "1798",
        "event": "Thiền sư Viên Quang trùng tu chùa theo bố cục chữ Tam"
      },
      {
        "year": "1988",
        "event": "Được công nhận Di tích Lịch sử - Văn hóa cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc Phật giáo Nam Bộ cổ truyền (Bố cục ba gian chữ Tam, mái bánh ít xếp tầng)",
    "conservationStatus": "Good",
    "conservationNotes": "113 pho tượng cổ bằng gỗ mít thếp vàng và các bao lam chạm trổ tùng hạc được gìn giữ cẩn trọng.",
    "materials": [
      "Gỗ mít cổ thụ",
      "Sơn son thếp vàng",
      "Gạch tàu lát sàn",
      "Ngói liệt"
    ],
    "dimensionsDescription": "Khuôn viên thanh tịnh rợp bóng bồ đề với tháp Xá Lợi 7 tầng cao 32m.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Chua_Giac_Lam_Gate.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/4/4d/Ch%C3%B9a_Gi%C3%A1c_L%C3%A2m%2C_th%C3%A1ng_01_n%C4%83m_2022_%28th%C3%A1p_x%C3%A1_l%E1%BB%A3i%29_%284%29.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Chùa Giác Lâm - Dấu ấn Phật giáo phương Nam gần 300 năm",
        "duration": "04:15",
        "transcript": "Được dựng từ năm 1744, Tổ đình Giác Lâm là chiếc nôi của Phật giáo thiền phái Lâm Tế tại Nam Bộ. Cấu trúc chữ Tam gồm chính điện, giảng đường và nhà trai tạo nên không gian thanh tịnh mộc mạc đậm chất Nam Bộ..."
      },
      "en": {
        "title": "Giac Lam Pagoda - Ancient spiritual cradle of Saigon",
        "duration": "03:40",
        "transcript": "Founded in 1744, Giac Lam is among the oldest temples in Ho Chi Minh City, housing over a hundred gilded wood statues and authentic southern architectural woodwork..."
      },
      "fr": {
        "title": "Pagode Giac Lam - Témoin tricentenaire du bouddhisme du Sud",
        "duration": "03:50",
        "transcript": "Fondée en 1744 sous le règne des seigneurs Nguyen, cette pagode historique illustre l’art bouddhique traditionnel méridional..."
      }
    },
    "openingHours": "06:00 - 12:00 & 13:30 - 20:00 (Mở cửa miễn phí)",
    "ticketPrices": "Vào cửa tự do",
    "regulations": [
      "Trang phục kín đáo, bỏ nón mũ khi bước vào chính điện",
      "Không chụp ảnh cận cảnh người đang lễ bái cầu an"
    ],
    "managementUnit": "Ban Quản trị Tổ đình Giác Lâm & Giáo hội Phật giáo Việt Nam",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 1288/VH-QĐ của Bộ Văn hóa",
    "submittedByUnit": "Ban Quản lý Di tích Quận Tân Bình",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-08-20",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh mặt tiền chính điện cổ tự Chùa Giác Lâm",
        "Không gian kiến trúc gỗ và hệ thống hoành phi, câu đối chạm khắc bên trong Chùa Giác Lâm"
      ],
      "en": [
        "Main Hall Facade of Historic Giac Lam Pagoda",
        "Wooden Column Architecture and Carved Lacquered Plaques Inside Giac Lam Pagoda"
      ],
      "zh": [
        "觉林古寺大雄宝殿正面全景",
        "觉林寺内部木构建筑与雕花匾联景观"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Bảo Tháp Xá Lợi 7 Tầng Lục Giác",
          "description": "Ngọn bảo tháp lục giác cao vút tôn trí xá lợi Phật ở góc trước sân chùa, nổi bật với 7 tầng lan can đá và mái cong.",
          "cameraPos": [
            -20,
            12,
            18
          ],
          "targetPos": [
            -11.2,
            6.5,
            7.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Cây Bồ Đề Cổ Thụ Rễ Phụ (1953)",
          "description": "Cây bồ đề cổ thụ rợp bóng với chùm rễ phụ buông rủ bên phải sân trước được chiết từ cây bồ đề thiêng Sri Lanka.",
          "cameraPos": [
            20,
            9.5,
            18
          ],
          "targetPos": [
            12.2,
            3.5,
            10.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Bố Cục 3 Gian Chữ Tam & Mái Ngói Liệt",
          "description": "Tiền đường, Chính điện và Nhà Tổ nối tiếp theo trục dọc, lợp ngói âm dương võng cong cổ kính chuẩn mực Nam Bộ.",
          "cameraPos": [
            16,
            13,
            16
          ],
          "targetPos": [
            2.5,
            4.5,
            -1.8
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hệ 98 Cột Gỗ Lim & Hoành Phi Câu Đối",
          "description": "Không gian nội thất dày đặc cột gỗ lim trên chân tảng đá xanh nối bằng kỹ thuật xuyên trính chạm trổ tùng hạc.",
          "cameraPos": [
            12,
            5.8,
            8.5
          ],
          "targetPos": [
            2.5,
            2.2,
            1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Chính Điện Phật A Di Đà & Thập Bát La Hán",
          "description": "18 pho tượng La Hán gỗ mít thếp vàng sắp thành hai hàng trang nghiêm chầu về tượng Phật A Di Đà tại trung tâm.",
          "cameraPos": [
            -6,
            5.2,
            6.5
          ],
          "targetPos": [
            2.5,
            2,
            -3.2
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "HCM-DT-012",
    "officialName": "Hội quán Nghĩa An",
    "folkName": "Miếu Quan Đế / Chùa Ông Chợ Lớn",
    "identifierCode": "HCM-Q5-KTNT-012",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.7533,
      "lng": 106.6601
    },
    "vn2000": {
      "x": 1189206.18,
      "y": 599538.36,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "678",
      "street": "Nguyễn Trãi",
      "ward": "Phường 11",
      "district": "Quận 5",
      "city": "Thành phố Hồ Chí Minh"
    },
    "summary": "Công trình kiến trúc tôn giáo tiêu biểu của cộng đồng người Hoa gốc Triều Châu tại khu vực Chợ Lớn. Hội quán nổi tiếng với nghệ thuật chạm khắc gỗ sơn son thiếp vàng tinh mỹ và tượng ngựa Xích Thố oai nghiêm.",
    "chronology": "Đầu thế kỷ XIX (xây dựng) - 1902 (trùng tu lớn)",
    "commencementYear": 1820,
    "architect": "Nghệ nhân điêu khắc Triều Châu và nghệ nhân gốm Cây Mai",
    "milestones": [
      {
        "year": "1820",
        "event": "Khởi dựng miếu thờ Quan Thánh Đế Quân của bang Triều Châu"
      },
      {
        "year": "1902",
        "event": "Trùng tu lớn, bổ sung quần thể tượng gốm Cây Mai trên nóc"
      },
      {
        "year": "1993",
        "event": "Bộ Văn hóa Thông tin xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      },
      {
        "year": "2023",
        "event": "Tục chui bụng ngựa Xích Thố cầu may mắn dịp Rằm tháng Giêng thu hút hàng chục ngàn người"
      }
    ],
    "architecturalStyle": "Kiến trúc Đền miếu truyền thống Triều Châu (Mái chữ Đinh cong vút, rồng cuộn khảm gốm men)",
    "conservationStatus": "Good",
    "conservationNotes": "Bộ hoành phi chạm nổi điển tích Tam Quốc và các tượng gốm men xanh ngọc Cây Mai được bảo toàn nguyên vẹn.",
    "materials": [
      "Gỗ căm xe chạm lộng",
      "Gốm men Cây Mai Chợ Lớn",
      "Gạch tàu đỏ",
      "Đá granite chạm khắc"
    ],
    "dimensionsDescription": "Tổng diện tích hơn 2.000m² gồm sân tiền cảnh, tiền điện, sân thiên tỉnh và chính điện thờ Quan Công.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/9/98/Nghia_An_Hoi_Quan_Pagoda_%2810018215816%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f2/Nghia_An_Hoi_Quan_Pagoda_%2810018333403%29.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Hội quán Nghĩa An - Tinh hoa nghệ thuật điêu khắc gỗ Triều Châu",
        "duration": "04:05",
        "transcript": "Tọa lạc giữa trung tâm Chợ Lớn, Hội quán Nghĩa An là trung tâm tín ngưỡng gắn kết bang Triều Châu. Nghệ thuật chạm khắc bao lam với hàng trăm chi tiết sơn thiếp vàng lộng lẫy và tượng ngựa Xích Thố sừng sững..."
      },
      "en": {
        "title": "Nghia An Assembly Hall - Chaozhou cultural treasure",
        "duration": "03:25",
        "transcript": "Built in the 19th century by the Chaozhou community in Cho Lon, this magnificent assembly hall features exquisite woodcarvings and ceramic roofs from ancient Cay Mai kilns..."
      },
      "fr": {
        "title": "Maison de l’Assemblée de Nghia An",
        "duration": "03:40",
        "transcript": "Reflet de l’artisanat d’art Teochew au cœur de Cho Lon, ce sanctuaire dédié au général Guan Yu brille par ses boiseries dorées à la feuille..."
      }
    },
    "openingHours": "07:00 - 17:30 (Mở cửa hàng ngày)",
    "ticketPrices": "Vào cửa tự do",
    "regulations": [
      "Không chụp ảnh với đèn flash trực tiếp vào tượng thờ chính diện",
      "Giữ sự trật tự, tôn nghiêm khi thực hiện nghi thức tín ngưỡng"
    ],
    "managementUnit": "Ban Quản trị Hội quán Nghĩa An (Hội đồng hương Triều Châu TP.HCM)",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 43-VH/QĐ",
    "submittedByUnit": "Ban Quản lý Di tích Quận 5",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-08-15",
    "photoCaptionsByLang": {
      "vi": [
        "Kiến trúc mặt tiền và nghệ thuật trang trí gốm sứ trên mái Hội quán Nghĩa An (Chùa Ông)",
        "Không gian điện thờ Quan Thánh Đế Quân và nghệ thuật chạm gỗ thếp vàng tại Hội quán Nghĩa An"
      ],
      "en": [
        "Facade and Ceramic Roof Ornamentation of Nghia An Assembly Hall",
        "Sanctuary and Gilded Woodcarvings Inside Nghia An Assembly Hall"
      ],
      "zh": [
        "义安会馆（关帝庙）正面建筑与屋脊嵌瓷艺术",
        "义安会馆正殿空间与贴金木雕艺术"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Mái Ngói Lưu Ly Xanh Ngọc & Gốm Cây Mai",
          "description": "Bộ mái cong Triều Châu phủ ngói ống men xanh ngọc bích cùng hàng tượng tiểu cảnh gốm sứ Cây Mai rực rỡ trên bờ nóc.",
          "cameraPos": [
            15,
            12,
            18
          ],
          "targetPos": [
            0,
            6.8,
            -1
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Sân Thiên Tỉnh & Nhang Vòng Treo Cao",
          "description": "Khoảng giếng trời thông thoáng giữa Tiền điện và Chính điện đón ánh sáng tự nhiên rọi xuống sân đá và nhang vòng.",
          "cameraPos": [
            8,
            9.5,
            8
          ],
          "targetPos": [
            0,
            2.5,
            0.4
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Tượng Ngựa Xích Thố Đỏ Rực",
          "description": "Pho tượng ngựa Xích Thố tạc gỗ sơn son bóng lộng đặt tại Tiền điện bên trái, gắn liền với lễ hội chui bụng ngựa cầu may.",
          "cameraPos": [
            -11,
            4.5,
            11
          ],
          "targetPos": [
            -5.2,
            1.8,
            5.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Chính Điện Quan Thánh & Bao Lam Thếp Vàng",
          "description": "Khám thờ Quan Công uy nghi sau lớp bao lam gỗ chạm lộng tinh xảo và chiếc lư hương đồng cổ.",
          "cameraPos": [
            4.5,
            5.2,
            2
          ],
          "targetPos": [
            0,
            2.2,
            -7.8
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Đại Hồng Chung Cổ & Trống Lễ Hội",
          "description": "Chuông đồng lớn treo trên giá gỗ bên cánh phải cùng chiếc trống lễ hội uy nghi.",
          "cameraPos": [
            11,
            5,
            2.5
          ],
          "targetPos": [
            5.8,
            2.2,
            -4.2
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "BRVT-DT-001",
    "officialName": "Bạch Dinh - Villa Blanche",
    "folkName": "Dinh Bảo Đại / Dinh Ông Thượng / Villa Blanche Vũng Tàu",
    "identifierCode": "BRVT-VT-KTNT-001",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.3492,
      "lng": 107.0715
    },
    "vn2000": {
      "x": 1144664.9,
      "y": 644728.66,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Số 4 - 6",
      "street": "Trần Phú",
      "ward": "Phường 1",
      "district": "TP. Vũng Tàu",
      "city": "Tỉnh Bà Rịa - Vũng Tàu"
    },
    "summary": "Dinh thự nghỉ dưỡng mùa hè của Toàn quyền Đông Dương Paul Doumer xây dựng từ năm 1898 trên sườn Núi Lớn ở độ cao 27,7m so với mực nước biển. Công trình mang kiến trúc Tân Cổ điển Pháp sang trọng, kết nối trực tiếp với dòng chảy kiến trúc Pháp tại Nhà hát Thành phố và Bưu điện Trung tâm Sài Gòn.",
    "chronology": "1898 (khởi công) - 1902 (hoàn thành dưới thời Toàn quyền Paul Doumer)",
    "commencementYear": 1898,
    "architect": "Kiến trúc sư công chính Pháp tại Đông Dương (Thời Paul Doumer)",
    "milestones": [
      {
        "year": "1898",
        "event": "Toàn quyền Paul Doumer phê duyệt xây dựng Villa Blanche trên nền pháo đài Phước Thắng cổ"
      },
      {
        "year": "1907 - 1916",
        "event": "Nơi giam lỏng vua Thành Thái trước khi đày sang đảo Réunion"
      },
      {
        "year": "1992",
        "event": "Bộ Văn hóa - Thông tin công nhận Di tích Lịch sử - Văn hóa Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc Tân Cổ điển Pháp (French Neoclassical Villa) 3 tầng lợp ngói đỏ Marseille và phù điêu gốm sứ Hy Lạp cổ",
    "conservationStatus": "Good",
    "conservationNotes": "Tòa dinh thự trắng muốt giữa rừng sứ cổ thụ cùng bộ sưu tập gốm sứ cổ Hòn Cau được bảo tồn nguyên vẹn.",
    "materials": [
      "Tường gạch vữa vôi trắng",
      "Ngói Marseille Pháp",
      "Đá hoa cương",
      "Phù điêu gốm men màu châu Âu"
    ],
    "dimensionsDescription": "Cao 3 tầng (19m), dài 28m, rộng 15m tọa lạc trên sườn Núi Lớn hướng thẳng ra Bãi Trước Vũng Tàu.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/9/91/Vung_Tau_Bach_Dinh.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/6/6b/VN-vungtau-bach-dinh-1.jpg"
    ],
    "has3D": true,
    "model3DType": "bim_cad",
    "model3DUrl": "/dinh-bao-dai.glb",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Bạch Dinh (Villa Blanche) - Tuyệt tác kiến trúc Pháp trên sườn Núi Lớn Vũng Tàu",
        "duration": "04:20",
        "transcript": "Tọa lạc ở độ cao gần 28 mét trên sườn Núi Lớn nhìn ra biển Bãi Trước, Bạch Dinh được Toàn quyền Paul Doumer cho khởi dựng năm 1898 cùng thời kỳ với Nhà hát Thành phố Sài Gòn. Sự đồng điệu trong ngôn ngữ Tân Cổ điển Pháp giữa Bạch Dinh và các công trình trung tâm Quận 1 tạo nên trục di sản kiến trúc đô thị - nghỉ dưỡng Đông Dương độc đáo bậc nhất vùng Đông Nam Bộ..."
      },
      "en": {
        "title": "Villa Blanche (White Palace) - French Neoclassical clifftop residence in Vung Tau",
        "duration": "03:50",
        "transcript": "Perched on Big Mountain overlooking Front Beach, Villa Blanche was commissioned in 1898 by Governor-General Paul Doumer as an imperial summer retreat linked closely to colonial Saigon..."
      },
      "fr": {
        "title": "Villa Blanche du Cap Saint-Jacques",
        "duration": "04:00",
        "transcript": "Édifiée en 1898 sous Paul Doumer, la Villa Blanche domine la baie de Vung Tau par son élégance néoclassique..."
      }
    },
    "openingHours": "07:00 - 17:00 (Mở cửa hàng ngày)",
    "ticketPrices": "15.000 VNĐ/lượt",
    "regulations": [
      "Không chạm tay vào các phù điêu gốm cổ và hiện vật gốm sứ trục vớt Hòn Cau",
      "Giữ gìn vệ sinh cảnh quan rừng hoa sứ cổ thụ quanh dinh thự"
    ],
    "managementUnit": "Bảo tàng Tỉnh Bà Rịa - Vũng Tàu",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 983/QĐ-BVHTT",
    "submittedByUnit": "Sở Văn hóa và Thể thao Tỉnh Bà Rịa - Vũng Tàu",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-10-15",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh kiến trúc Bạch Dinh (Villa Blanche) bên sườn núi Lớn, thành phố Vũng Tàu",
        "Chi tiết phù điêu cổ điển châu Âu và không gian trưng bày cổ vật bên trong Bạch Dinh"
      ],
      "en": [
        "Exterior Architecture of Bach Dinh (Villa Blanche) on Big Mountain Slope, Vung Tau",
        "European Classical Bas-reliefs and Antique Exhibition Hall Inside Bach Dinh"
      ],
      "zh": [
        "头顿市大山山麓白宫（布兰奇别墅）建筑全景",
        "白宫欧式古典浮雕细节与内部古董展厅"
      ]
    },
    "config3D": {
      "mode": "glb_only",
      "glbUrl": "/dinh-bao-dai.glb",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        24,
        18,
        30
      ],
      "cameraTarget": [
        0,
        6.5,
        -1.5
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Mặt Tiền Vòm Cuốn Tân Cổ Điển & Mái Marseille",
          "description": "Tòa biệt thự 3 tầng tường trắng ngà với hành lang vòm bán nguyệt Pháp, lan can lục bình đá và mái ngói đỏ Marseille.",
          "cameraPos": [
            16,
            13,
            22
          ],
          "targetPos": [
            0,
            7.5,
            -1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Trận Địa 19 Khẩu Thần Công Hướng Biển",
          "description": "Dãy 19 khẩu thần công đặt dọc lan can đá phía trước nhìn thẳng xuống vịnh Bãi Trước Vũng Tàu.",
          "cameraPos": [
            12,
            5.5,
            18
          ],
          "targetPos": [
            0,
            1.5,
            10.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "8 Tượng Bán Thân Hy Lạp - La Mã Trên Diềm Mái",
          "description": "Chuỗi 8 hốc tròn gắn tượng bán thân gốm sứ men màu châu Âu tô điểm diềm thượng tầng 3 của dinh thự.",
          "cameraPos": [
            -10,
            13.5,
            13
          ],
          "targetPos": [
            0,
            11.2,
            2.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Phòng Trưng Bày Gốm Sứ Cổ Hòn Cau (Khang Hy)",
          "description": "Nội thất tầng 3 trưng bày bộ sưu tập bình gốm sứ men lam Khang Hy trục vớt từ tàu đắm vùng biển Hòn Cau.",
          "cameraPos": [
            6,
            10.5,
            7
          ],
          "targetPos": [
            0,
            9.2,
            -3.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Cầu Thang Xoắn Gỗ Cổ & Rừng Hoa Sứ Núi Lớn",
          "description": "Nội thất cầu thang gỗ xoắn tầng 2 hòa quyện giữa sắc hoa sứ trắng cổ thụ bao bọc toàn khu dinh thự.",
          "cameraPos": [
            -16,
            8.5,
            12
          ],
          "targetPos": [
            -4.2,
            6.2,
            -2.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "BRVT-DT-002",
    "officialName": "Quần thể kiến trúc Nhà Lớn Long Sơn",
    "folkName": "Đền Ông Trần Long Sơn",
    "identifierCode": "BRVT-LS-KTNT-002",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.4536,
      "lng": 107.1103
    },
    "vn2000": {
      "x": 1156232.42,
      "y": 648929.21,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Thôn 5",
      "street": "Đường vào Đảo Long Sơn",
      "ward": "Xã đảo Long Sơn",
      "district": "TP. Vũng Tàu",
      "city": "Tỉnh Bà Rịa - Vũng Tàu"
    },
    "summary": "Quần thể kiến trúc gỗ cổ truyền rộng hơn 2ha do Ông Trần (Lê Văn Mưu) cùng cư dân khai hoang dựng lập từ năm 1910 trên đảo Long Sơn. Công trình kết tinh nghệ thuật mộc truyền thống Nam Bộ, kết nối mạch nguồn văn hóa mở cõi với Tổ đình Giác Lâm (TP.HCM) và Nhà cổ Trần Công Vàng (Bình Dương).",
    "chronology": "1910 (khởi dựng khu Đền thờ) - 1929 (hoàn thiện quần thể nhà hội, trường học, lầu dài)",
    "commencementYear": 1910,
    "architect": "Ông Trần (Lê Văn Mưu) và các nghệ nhân mộc cổ truyền Nam Bộ",
    "milestones": [
      {
        "year": "1900",
        "event": "Ông Lê Văn Mưu đưa gia quyến đến khai khẩn vùng đất đảo Long Sơn"
      },
      {
        "year": "1910 - 1929",
        "event": "Xây dựng hoàn chỉnh 3 khu phức hợp: Khu Đền thờ, Khu Nhà hội - lầu dài và Khu Trường học - chợ"
      },
      {
        "year": "1991",
        "event": "Bộ Văn hóa - Thông tin xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc cổ truyền gỗ Nam Bộ (Bố cục chữ Khẩu & trùng thiềm điệp ốc liên hoàn trên địa hình dốc núi Nứa)",
    "conservationStatus": "Good",
    "conservationNotes": "Hệ khung cột gỗ quý, ngói âm dương và bộ sưu tập tủ thờ cẩn xà cừ hơn 100 năm tuổi được cộng đồng gìn giữ nghiêm cẩn.",
    "materials": [
      "Gỗ căm xe và gỗ dầu cổ thụ",
      "Ngói âm dương đất nung",
      "Gạch tàu lục giác",
      "Xà cừ khảm trai"
    ],
    "dimensionsDescription": "Khuôn viên rộng 2ha chia làm 3 phân khu giật cấp: Khu Đền thờ, Khu Nhà hội - nhà khách và Khu sinh hoạt cộng đồng.",
    "photos": [
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Nh%C3%A0_L%E1%BB%9Bn_Long_S%C6%A1n.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/64/Cau_Long_son%2C_ba_ria_vung_tau_-_panoramio.jpg"
    ],
    "has3D": true,
    "model3DType": "bim_cad",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Nhà Lớn Long Sơn - Tinh hoa kiến trúc gỗ và văn hóa mở cõi Nam Bộ",
        "duration": "04:35",
        "transcript": "Được xây dựng hoàn toàn bằng gỗ quý và gạch ngói truyền thống từ năm 1910 đến 1929, Nhà Lớn Long Sơn là một bảo tàng sống về kiến trúc dân gian Nam Bộ. Khi đặt cạnh Chùa Giác Lâm (1744) tại TP.HCM và Nhà cổ Trần Công Vàng tại Bình Dương, chúng ta thấy rõ sự kế thừa kỹ thuật kết cấu xuyên trính và chạm khắc gỗ điêu luyện của lưu dân phương Nam..."
      },
      "en": {
        "title": "Long Son Big House Complex - Vernacular Southern Vietnamese timber architecture",
        "duration": "03:55",
        "transcript": "Built between 1910 and 1929 by Master Le Van Muu, the Long Son Big House complex spans two hectares of interconnected traditional wooden halls and tiled courtyards..."
      },
      "fr": {
        "title": "Le Grand Sanctuaire de Long Son",
        "duration": "03:50",
        "transcript": "Ensemble architectural en bois précieux érigé au début du XXe siècle sur l’île de Long Son..."
      }
    },
    "openingHours": "07:00 - 17:00 (Mở cửa miễn phí)",
    "ticketPrices": "Vào cửa tự do",
    "regulations": [
      "Trang phục lịch sự, tháo giày dép trước khi bước lên sàn gỗ khu Đền thờ",
      "Tôn trọng nếp sống văn hóa tín ngưỡng Ông Trần của cư dân bản địa"
    ],
    "managementUnit": "Ban Quản lý Di tích Nhà Lớn Long Sơn",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 1371/QĐ-BVHTT",
    "submittedByUnit": "Sở Văn hóa và Thể thao Tỉnh Bà Rịa - Vũng Tàu",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-10-12",
    "photoCaptionsByLang": {
      "vi": [
        "Toàn cảnh quần thể kiến trúc gỗ cổ truyền Nhà Lớn Long Sơn (Đền Ông Trần), Vũng Tàu",
        "Không gian Nhà Thánh và các gian nhà cổ bảo tồn di sản tín ngưỡng tại Nhà Lớn Long Sơn"
      ],
      "en": [
        "Traditional Timber Architectural Complex of Long Son Big House, Vung Tau",
        "Sanctuary Hall and Preserved Heritage Timber Pavilions at Long Son Big House"
      ],
      "zh": [
        "头顿市龙山大屋传统木构建筑群全景",
        "龙山大屋圣殿空间与传统木构古建筑群"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Chính Điện (Nhà Thánh)",
          "description": "Khu Nhà Thánh 3 nếp trùng thiềm điệp ốc (Tiền điện – Trung điện – Hậu điện) với hệ cửa bức bàn gỗ căm xe, lan can con tiện, hương án, 6 tủ thờ cẩn ốc xà cừ và hoành phi câu đối sơn son thếp vàng (không đặt tượng thờ theo đúng tín ngưỡng Đạo Ông Trần).",
          "cameraPos": [
            1.2,
            6.2,
            -0.8
          ],
          "targetPos": [
            1.2,
            3.8,
            -8.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Lầu Đôi & Khu Nhà Lồng",
          "description": "Cặp Lầu Đôi 2 tầng (Lầu Tiên – Lầu Cấm) và Nhà Long Đình chồng diêm nối liền mạch qua hệ hành lang gỗ có mái ngói âm dương, lan can con tiện dẫn thẳng vào dãy Nhà Lồng phía sau.",
          "cameraPos": [
            12.5,
            7.6,
            8.8
          ],
          "targetPos": [
            1.2,
            4.2,
            -0.4
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Sân Đền, Đỉnh Hương & Hàng Lu Nước Mưa",
          "description": "Sân đền lát đá xanh Núi Nứa rộng thoáng với Đỉnh Hương Đá chạm khắc ở trung tâm, cầu thang đá 3 lối đi và hàng lu nước mưa (khạp da bò) xếp ngay ngắn dọc thềm nhà.",
          "cameraPos": [
            7.8,
            5.4,
            14.2
          ],
          "targetPos": [
            1.2,
            1.8,
            6.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hậu Điện & Khu Bếp Nhà Lò",
          "description": "Khu Hậu Điện nối liền Nhà Lò cổ truyền có bếp lò xây gạch, nồi đồng lớn cùng làn khói bếp mỏng bay nhẹ lên trời trên nền triền Núi Nứa (Ngọa Long) và lối bậc thang đá xanh lên Lăng Mộ Ông Trần.",
          "cameraPos": [
            -16.2,
            6.8,
            -2.2
          ],
          "targetPos": [
            -9.4,
            3.6,
            -10.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Nhà Ghe Sấm (Di Vật Khai Hoang 1900)",
          "description": "Nhà che bên trái sân đền căn chỉnh vuông góc với trục sân chính, bảo tồn nguyên vẹn chiếc Ghe Sấm thân ghe bầu lớn dài với phần mũi ghe cong truyền thống đặt trên đà gỗ căm xe.",
          "cameraPos": [
            -4.2,
            3.8,
            13.2
          ],
          "targetPos": [
            -10.6,
            1.9,
            8.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f6",
          "name": "Cổng & Hàng Rào Trụ Đá Không Khóa Cửa",
          "description": "Hàng rào trụ đá xanh thấp gắn đèn lồng cổ và Cổng chính mở rộng không cánh khóa nhìn ra trục đường chính phía trước — biểu trưng tinh thần hiếu khách \"mở cửa suốt ngày đêm đãi khách thập phương\" của Nhà Lớn Long Sơn.",
          "cameraPos": [
            1.2,
            4.8,
            22.4
          ],
          "targetPos": [
            1.2,
            2.1,
            13.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "BRVT-DT-003",
    "officialName": "Khu di tích Địa đạo Long Phước",
    "folkName": "Địa đạo Long Phước Bà Rịa",
    "identifierCode": "BRVT-BR-LS-003",
    "rankingLevel": "National",
    "type": "History",
    "gps": {
      "lat": 10.5289,
      "lng": 107.2244
    },
    "vn2000": {
      "x": 1164619.29,
      "y": 661384.62,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Ấp Bắc",
      "street": "Đường 30/4",
      "ward": "Xã Long Phước",
      "district": "TP. Bà Rịa",
      "city": "Tỉnh Bà Rịa - Vũng Tàu"
    },
    "summary": "Hệ thống địa đạo chiến đấu liên hoàn tỏa khắp 5 ấp của xã Long Phước (TP. Bà Rịa), kết nối lịch sử quân sự chặt chẽ với Địa đạo Củ Chi (TP.HCM) và Địa đạo Tam Giác Sắt (Bình Dương) tạo thành thế trận lòng đất Đông Nam Bộ bất khả xâm phạm.",
    "chronology": "1948 (khởi đào hầm bí mật) - 1963 (phát triển thành mạng lưới địa đạo xương sống liên ấp)",
    "commencementYear": 1948,
    "architect": "Quân và dân xã anh hùng Long Phước (Bà Rịa)",
    "milestones": [
      {
        "year": "1948",
        "event": "Người dân Long Phước bắt đầu đào các cụm hầm bí mật nối liền giữa các xóm ấp"
      },
      {
        "year": "1963",
        "event": "Mở rộng thành hệ thống đường xương sống cách mặt đất 3m - 6m kèm công sự chiến đấu và hầm cứu thương"
      },
      {
        "year": "1990",
        "event": "Bộ Văn hóa xếp hạng Di tích Lịch sử Cách mạng cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc quân sự ngầm trong tầng đất cát pha đất sét đá ong (Đường xương sống, ụ chiến đấu nổi và hầm cứu thương)",
    "conservationStatus": "Good",
    "conservationNotes": "Cụm địa đạo ấp Bắc đã được tôn tạo, gia cố nắp hầm và chiếu sáng phục vụ tham quan giáo dục truyền thống.",
    "materials": [
      "Đất sét pha đá ong tự nhiên",
      "Tre tầm vông và gỗ rừng gia cố nắp hầm"
    ],
    "dimensionsDescription": "Đường hầm sâu từ 2,5m đến 6m, lòng hầm cao 1,5m - 1,6m, rộng 0,7m - 0,8m nối thông các ụ chiến đấu.",
    "photos": [
      "/images/heritage/BRVT-DT-003-1.jpg",
      "/images/heritage/BRVT-DT-003-2.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Địa đạo Long Phước - Pháo đài ngầm kiên cường cửa ngõ Đông Nam Bộ",
        "duration": "04:45",
        "transcript": "Cùng ra đời từ năm 1948 như Địa đạo Củ Chi và Địa đạo Tây Nam Bến Cát, Địa đạo Long Phước tại Bà Rịa có nét đặc thù riêng về địa chất và kích thước lòng hầm cao hơn (tới 1,6m) giúp cơ động chiến đấu nhanh giữa các ấp. Ba hệ thống địa đạo Củ Chi - Tam Giác Sắt - Long Phước đã tạo nên vành đai pháo đài ngầm huyền thoại bao quanh Sài Gòn..."
      },
      "en": {
        "title": "Long Phuoc Tunnels - Subterranean tactical stronghold of Ba Ria",
        "duration": "04:00",
        "transcript": "Constructed in 1948 and expanded in 1963, Long Phuoc Tunnels interconnected five hamlets with underground medical stations, command posts, and fighting bunkers..."
      },
      "fr": {
        "title": "Les Tunnels historiques de Long Phuoc à Ba Ria",
        "duration": "04:05",
        "transcript": "Réseau souterrain stratégique relié à l’histoire militaire de Cu Chi et du Triangle de Fer..."
      }
    },
    "openingHours": "07:30 - 17:00 (Mở cửa hàng ngày)",
    "ticketPrices": "Miễn phí tham quan học tập",
    "regulations": [
      "Đi theo hướng dẫn viên khi xuống tham quan nhánh hầm ngầm",
      "Giữ gìn tôn nghiêm tại Đền tưởng niệm Liệt sĩ Long Phước"
    ],
    "managementUnit": "Ban Quản lý Di tích TP. Bà Rịa",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 09/VH-QĐ của Bộ Văn hóa",
    "submittedByUnit": "Sở Văn hóa và Thể thao Tỉnh Bà Rịa - Vũng Tàu",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-10-18",
    "photoCaptionsByLang": {
      "vi": [
        "Cổng vào và khu vực bia tưởng niệm Khu di tích lịch sử Địa đạo Long Phước, Bà Rịa",
        "Cấu trúc cửa hầm bí mật và giao thông hào chiến đấu tại Khu di tích Địa đạo Long Phước"
      ],
      "en": [
        "Entrance Gate and Memorial Monument of Long Phuoc Tunnels Historical Site, Ba Ria",
        "Secret Tunnel Entrance and Combat Trenches at Long Phuoc Tunnels"
      ],
      "zh": [
        "巴地龙福地道历史遗迹区入口与纪念碑广场",
        "龙福地道秘密洞口与作战交通壕结构"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        24,
        19,
        28
      ],
      "cameraTarget": [
        0,
        2,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Mạng Đường Hầm Địa Đạo Uốn Lượn 2 Tầng",
          "description": "Sa bàn cắt dọc 2 tầng đường hầm uốn lượn tự nhiên sâu 3m–6m trong lớp đất đỏ bazan vững chãi vùng Bà Rịa.",
          "cameraPos": [
            21,
            12,
            23
          ],
          "targetPos": [
            0,
            1.8,
            2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Hầm Chữ A Gia Cố Gỗ Chống Bom Pháo",
          "description": "Hệ khung gỗ chữ A kết hợp giằng ngang chịu lực giúp bảo vệ an toàn trước sức công phá pháo kích hạng nặng.",
          "cameraPos": [
            -12,
            6,
            18
          ],
          "targetPos": [
            -6.5,
            3.2,
            8.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Phòng Họp Chi Bộ & Đèn Dầu Ngầm",
          "description": "Khoang hầm chỉ huy ngầm nối thẳng xuống đường hầm xương sống qua ống tụt thông tầng.",
          "cameraPos": [
            8,
            5.5,
            19
          ],
          "targetPos": [
            4,
            2.8,
            8.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Hầm Quân Y Dã Chiến (Mặt Cắt Bên +X)",
          "description": "Khoang hầm cứu thương tầng sâu trang bị sập tre và tủ y tế phục vụ thương bệnh binh.",
          "cameraPos": [
            22,
            2.5,
            2
          ],
          "targetPos": [
            10.4,
            -2.2,
            -2.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Bụi Tre Tầm Vông, Ụ Mối & Nắp Hầm Bí Mật",
          "description": "Mặt đất phía trên phủ bụi tre tầm vông và ụ mối che giấu hoàn hảo nắp hầm bí mật và công sự cá nhân.",
          "cameraPos": [
            -11,
            15,
            14
          ],
          "targetPos": [
            0,
            9,
            2.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "BD-DT-001",
    "officialName": "Nhà cổ Trần Công Vàng",
    "folkName": "Nhà cổ 5 gian Thủ Dầu Một",
    "identifierCode": "BD-TDM-KTNT-001",
    "rankingLevel": "National",
    "type": "Architecture",
    "gps": {
      "lat": 10.9804,
      "lng": 106.6519
    },
    "vn2000": {
      "x": 1214324.32,
      "y": 598566.9,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Số 18",
      "street": "Bạch Đằng",
      "ward": "Phường Phú Cường",
      "district": "TP. Thủ Dầu Một",
      "city": "Tỉnh Bình Dương"
    },
    "summary": "Đỉnh cao nghệ thuật kiến trúc nhà gỗ chạm khắc cổ truyền Nam Bộ bên dòng sông Sài Gòn, xây dựng giai đoạn 1889 - 1892. Ngôi nhà nổi tiếng với kết cấu nhà rường chữ Đinh 5 gian 2 chái cùng hàng trăm bức chạm lộng Tứ linh, Mai - Lan - Cúc - Trúc tinh xảo của làng nghề mộc Phú Cường - Thủ Dầu Một.",
    "chronology": "1889 (khởi công) - 1892 (hoàn thành sau 3 năm chạm khắc thủ công)",
    "commencementYear": 1889,
    "architect": "Nghệ nhân mộc cổ truyền Phú Cường - Thủ Dầu Một & Huế",
    "milestones": [
      {
        "year": "1889 - 1892",
        "event": "Ông Trần Công Vàng thuê thợ mộc tài hoa dựng nhà gỗ 5 gian 2 chái suốt 3 năm ròng"
      },
      {
        "year": "1993",
        "event": "Bộ Văn hóa - Thông tin xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc Nhà rường gỗ cổ truyền Nam Bộ (5 gian 2 chái, mái ngói âm dương, chạm lộng sơn son thếp vàng)",
    "conservationStatus": "Good",
    "conservationNotes": "Hệ thống 60 cột gỗ căm xe, gỗ gõ đỏ cùng các bao lam, hoành phi, liễn đối khảm ốc xà cừ còn nguyên vẹn sau hơn 130 năm.",
    "materials": [
      "Gỗ căm xe & gỗ gõ đỏ quý hiếm",
      "Ngói âm dương cổ",
      "Đá xanh bó nền",
      "Ốc xà cừ khảm trai"
    ],
    "dimensionsDescription": "Diện tích 332m² với 60 cột gỗ tròn đặt trên chân tảng đá xanh, chia làm 5 gian 2 chái thoáng mát.",
    "photos": [
      "/images/heritage/BD-DT-001-1.jpg",
      "/images/heritage/BD-DT-001-2.jpg"
    ],
    "has3D": true,
    "model3DType": "bim_cad",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Nhà cổ Trần Công Vàng - Đỉnh cao nghệ thuật chạm khắc gỗ Thủ Dầu Một",
        "duration": "04:15",
        "transcript": "Tọa lạc bên bờ sông Sài Gòn thuộc phường Phú Cường, TP. Thủ Dầu Một, Nhà cổ Trần Công Vàng (1889 - 1892) là kiệt tác của nghề mộc truyền thống Bình Dương. Khi kết nối liên vùng với Chùa Giác Lâm (TP.HCM) và Nhà Lớn Long Sơn (Bà Rịa - Vũng Tàu), du khách sẽ chiêm ngưỡng trọn vẹn mạch nguồn kiến trúc gỗ cổ truyền Đông Nam Bộ..."
      },
      "en": {
        "title": "Tran Cong Vang Ancient House - Masterpiece of Binh Duong woodcarving",
        "duration": "03:45",
        "transcript": "Built between 1889 and 1892 in Thu Dau Mot, this 60-pillar wooden residence exemplifies the pinnacle of Southern Vietnamese carpentry and openwork relief carving..."
      },
      "fr": {
        "title": "Ancienne Maison Tran Cong Vang à Thu Dau Mot",
        "duration": "03:50",
        "transcript": "Chef-d’œuvre de la sculpture sur bois traditionnelle de Binh Duong érigé en 1889 au bord de la rivière de Saïgon..."
      }
    },
    "openingHours": "08:00 - 17:00 (Mở cửa hàng ngày)",
    "ticketPrices": "20.000 VNĐ/khách",
    "regulations": [
      "Không sờ tay lên các bức chạm lộng gỗ thếp vàng và liễn đối cẩn xà cừ",
      "Đi nhẹ, nói khẽ trong không gian thờ tự truyền thống của gia tộc"
    ],
    "managementUnit": "Bảo tàng Tỉnh Bình Dương & Gia tộc họ Trần",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 43-VH/QĐ của Bộ Văn hóa - Thông tin",
    "submittedByUnit": "Sở Văn hóa, Thể thao và Du lịch Tỉnh Bình Dương",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-10-16",
    "photoCaptionsByLang": {
      "vi": [
        "Mặt tiền nhà rường truyền thống Nam Bộ 3 gian 2 chái tại Nhà cổ Trần Công Vàng",
        "Nghệ thuật chạm khắc bao lam, liễn đối và hệ khung cột gỗ quý bên trong Nhà cổ Trần Công Vàng"
      ],
      "en": [
        "Southern Traditional Timber House Facade of Tran Cong Vang Ancient House",
        "Intricate Woodcarvings, Parallel Couplets and Timber Pillar Frame Inside Tran Cong Vang House"
      ],
      "zh": [
        "陈公黄古宅南部传统木结构正面景观",
        "陈公黄古宅内部木雕花罩、楹联与珍贵木柱框架"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        26,
        21,
        35
      ],
      "cameraTarget": [
        0,
        5,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Kiến Trúc Nhà Rường 5 Gian 2 Chái Chữ Đinh",
          "description": "Toàn cảnh ngôi nhà gỗ cổ bên sông Sài Gòn với hệ mái ngói âm dương võng nhẹ và nền đá xanh vững chắc.",
          "cameraPos": [
            18,
            11,
            20
          ],
          "targetPos": [
            0,
            3.8,
            1.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Hệ 36 Cột Gỗ Căm Xe & Chân Tảng Đá Hoa Sen",
          "description": "Mạng cột gỗ tròn bóng loáng tỳ trên chân tảng đá xanh chạm hoa sen nâng đỡ toàn bộ hệ kèo đấm truyền thống.",
          "cameraPos": [
            -10,
            4.8,
            13
          ],
          "targetPos": [
            0,
            2.4,
            3.2
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Bao Lam Chạm Lộng Tứ Linh Thếp Vàng",
          "description": "Các bức bao lam, hoành phi chạm lộng tinh xảo đề tài Long - Lân - Quy - Phụng của thợ mộc Thủ Dầu Một.",
          "cameraPos": [
            6,
            5.2,
            10
          ],
          "targetPos": [
            0,
            3.8,
            2.8
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Tủ Thờ Gia Tiên & Bình Phong Cẩn Xà Cừ",
          "description": "Bức bình phong gỗ và tủ thờ khảm ốc xà cừ lấp lánh đặt tại gian chính giữa trang nghiêm.",
          "cameraPos": [
            -4,
            4,
            9.5
          ],
          "targetPos": [
            0,
            1.7,
            1.8
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Gian Khách Trường Kỷ & Vườn Bonsai Kiểng Cổ",
          "description": "Bộ trường kỷ khảm trai tiếp khách hai bên gian thờ nối ra sân gạch tàu viền hàng rào kiểng.",
          "cameraPos": [
            13,
            6.2,
            6
          ],
          "targetPos": [
            4.6,
            1.8,
            2.5
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  },
  {
    "id": "BD-DT-002",
    "officialName": "Khu di tích Địa đạo Tam Giác Sắt - Tây Nam Bến Cát",
    "folkName": "Địa đạo Tây Nam Bến Cát (An Tây - An Điền - Phú An)",
    "identifierCode": "BD-BC-LS-002",
    "rankingLevel": "National",
    "type": "History",
    "gps": {
      "lat": 11.0956,
      "lng": 106.5512
    },
    "vn2000": {
      "x": 1227035.89,
      "y": 587526.76,
      "zone": "3_degree",
      "centralMeridian": "105°45'"
    },
    "address": {
      "houseNumber": "Ấp An Thành",
      "street": "ĐT 744 (Ven sông Sài Gòn)",
      "ward": "Xã An Tây",
      "district": "TP. Bến Cát",
      "city": "Tỉnh Bình Dương"
    },
    "summary": "Mắt xích chiến lược nối liền trực tiếp với Địa đạo Củ Chi (TP.HCM) qua dòng sông Sài Gòn. Được khởi đào từ năm 1948 tại 3 xã An Tây, An Điền, Phú An với tổng chiều dài hơn 100km đường hầm 2 - 3 tầng, tạo nên \"Vành đai đỏ Tam Giác Sắt\" lừng lẫy.",
    "chronology": "1948 (khởi đào tại 3 xã Tây Nam Bến Cát) - 1967 (đánh bại chiến dịch Cedar Falls)",
    "commencementYear": 1948,
    "architect": "Quân và dân 3 xã Tây Nam Bến Cát (An Tây - An Điền - Phú An)",
    "milestones": [
      {
        "year": "1948",
        "event": "Khởi đào các tuyến địa đạo liên xã đầu tiên bằng cuốc chim và ki xúc đất"
      },
      {
        "year": "1961 - 1967",
        "event": "Phát triển trên 100km địa đạo nhiều tầng nối thông qua bến vượt sông Sài Gòn sang Địa đạo Củ Chi"
      },
      {
        "year": "1996",
        "event": "Bộ Văn hóa - Thông tin xếp hạng Di tích Lịch sử cấp Quốc gia"
      }
    ],
    "architecturalStyle": "Kiến trúc quân sự ngầm nhiều tầng (Đường xương sống rộng 0,8m - 1,0m, nắp hầm chống pháo và ụ chiến đấu liên hoàn)",
    "conservationStatus": "Good",
    "conservationNotes": "Khuôn viên rộng 23ha có đền tưởng niệm, sa bàn mô phỏng trận càn Cedar Falls và đoạn hầm phục dựng trải nghiệm.",
    "materials": [
      "Đất sét đá ong Bến Cát nén chặt",
      "Khung gỗ rừng chống hầm"
    ],
    "dimensionsDescription": "Tổng mạng lưới dài hơn 100km, sâu cách mặt đất từ 4m đến 9m với hệ thống ụ chiến đấu cách nhau 15m.",
    "photos": [
      "/images/heritage/BD-DT-002-1.jpg",
      "/images/heritage/BD-DT-002-2.jpg"
    ],
    "has3D": true,
    "model3DType": "photogrammetry",
    "model3DUrl": "",
    "hasVR360": true,
    "audioGuide": {
      "vn": {
        "title": "Địa đạo Tam Giác Sắt - Mắt xích chiến lược nối liền Địa đạo Củ Chi qua sông Sài Gòn",
        "duration": "04:50",
        "transcript": "Chỉ cách Địa đạo Củ Chi một con sông Sài Gòn, Địa đạo Tây Nam Bến Cát (mệnh danh là Tam Giác Sắt gồm 3 xã An Tây, An Điền, Phú An) là người anh em song sinh cùng ra đời năm 1948. Với hơn 100km đường hầm ngầm sâu tới 9m, nơi đây kết nối trực tiếp với Củ Chi (TP.HCM) và Địa đạo Long Phước (Bà Rịa - Vũng Tàu) tạo thành thế trận chiến tranh nhân dân liên vùng kỳ vĩ..."
      },
      "en": {
        "title": "Iron Triangle Tunnels (Tay Nam Ben Cat) - Strategic twin of Cu Chi Tunnels",
        "duration": "04:10",
        "transcript": "Located just across the Saigon River from Cu Chi, the Iron Triangle Tunnels of Ben Cat (Binh Duong) stretched over 100km underground, forming a unified inter-regional defense network..."
      },
      "fr": {
        "title": "Tunnels du Triangle de Fer à Ben Cat (Binh Duong)",
        "duration": "04:15",
        "transcript": "Situé sur la rive opposée de la rivière de Saïgon face à Cu Chi, ce réseau de 100 km de galeries constituait le bastion du Triangle de Fer..."
      }
    },
    "openingHours": "07:30 - 17:00 (Mở cửa tất cả các ngày trong tuần)",
    "ticketPrices": "Miễn phí tham quan",
    "regulations": [
      "Tuân thủ hướng dẫn an toàn khi trải nghiệm các đoạn hầm ngầm phục dựng",
      "Giữ gìn trang nghiêm tại khu vực Đền tưởng niệm"
    ],
    "managementUnit": "Ban Quản lý Di tích Tỉnh Bình Dương",
    "dossierStatus": "approved_published",
    "decisionDecreeNumber": "Quyết định số 776/QĐ-BVHTT",
    "submittedByUnit": "Sở Văn hóa, Thể thao và Du lịch Tỉnh Bình Dương",
    "expertReviews": [],
    "visibility": "published",
    "updatedAt": "2026-10-19",
    "photoCaptionsByLang": {
      "vi": [
        "Tượng đài chiến thắng và không gian tưởng niệm Khu di tích lịch sử Địa đạo Tam Giác Sắt",
        "Hệ thống hầm địa đạo và không gian tái hiện căn cứ kháng chiến vùng Tam Giác Sắt – Bến Cát"
      ],
      "en": [
        "Victory Monument and Memorial Grounds of the Iron Triangle Tunnels Historical Site",
        "Underground Tunnel System and Reconstructed Resistance Base at Iron Triangle – Ben Cat"
      ],
      "zh": [
        "铁三角地道历史遗迹区胜利纪念碑与纪念园区",
        "铁三角—滨吉抗战根据地地下通道与复原景观"
      ]
    },
    "config3D": {
      "mode": "interactive_3d_museum",
      "glbUrl": "",
      "scale": 1,
      "rotationY": 0,
      "cameraPos": [
        24,
        19,
        28
      ],
      "cameraTarget": [
        0,
        2,
        0
      ],
      "hotspots": [
        {
          "id": "f1",
          "name": "Vành Đai Đỏ Bên Sông Sài Gòn & Rừng Cao Su",
          "description": "Toàn cảnh sa bàn mặt cắt địa đạo Tam Giác Sắt đối diện bờ sông Sài Gòn uốn lượn với hàng cao su Bến Cát thẳng tắp.",
          "cameraPos": [
            20,
            14,
            24
          ],
          "targetPos": [
            -1,
            2.5,
            1
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f2",
          "name": "Hầm Chỉ Huy & Sa Bàn Tác Chiến 3D",
          "description": "Phòng chỉ huy ngầm tầng 1 với bàn sa bàn tác chiến và máy vô tuyến chỉ đạo đánh bại trận càn Cedar Falls.",
          "cameraPos": [
            -4,
            6.2,
            19
          ],
          "targetPos": [
            -2.2,
            3,
            8.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f3",
          "name": "Kho Vũ Khí Ngầm Tây Nam Bến Cát",
          "description": "Kho cất giữ súng bộ binh và hòm đạn chiến đấu ẩn sâu dưới tầng đất đỏ sét pha sỏi.",
          "cameraPos": [
            14,
            5.5,
            18
          ],
          "targetPos": [
            7.8,
            2.8,
            8.6
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f4",
          "name": "Bếp Hoàng Cầm & Ống Tản Khói Ngầm",
          "description": "Hệ bếp nấu ăn ngầm dẫn khói qua đường ống uốn lượn xuyên đất khiến máy bay trinh sát không thể phát hiện.",
          "cameraPos": [
            5,
            1.2,
            19
          ],
          "targetPos": [
            1.2,
            -3.5,
            8.5
          ],
          "thumbnailUrl": ""
        },
        {
          "id": "f5",
          "name": "Cửa Thoát Hiểm Ven Sông & Giao Thông Hào",
          "description": "Ngách hầm sâu mở thẳng ra bến thuyền sông Sài Gòn kết nối trực tiếp sang Địa đạo Củ Chi.",
          "cameraPos": [
            -18,
            6.5,
            16
          ],
          "targetPos": [
            -9.2,
            1.8,
            7
          ],
          "thumbnailUrl": ""
        }
      ]
    }
  }
];

export const HERITAGE_SITES: HeritageSite[] = DEFAULT_HERITAGE_SITES;
