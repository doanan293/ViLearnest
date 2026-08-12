const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();

// Set 16:9 layout (10 x 5.625 inches)
pptx.layout = "LAYOUT_16x9";
pptx.title = "Kiểm thử API tự động với Bruno trên hệ thống LMS";
pptx.author = "Báo cáo Bài tập lớn - Andv-LMS API Testing";

// Color Palette
const COLORS = {
	PRIMARY: "0B1354",    // Deep Navy
	SECONDARY: "1E2761",  // Slate Navy
	BG_LIGHT: "F8F9FD",   // Off-white / Ice Blue
	WHITE: "FFFFFF",
	ACCENT_GOLD: "E5A93B",// Tech Gold
	ACCENT_PURPLE: "7B61FF", // Tech Purple
	CARD_BG: "FFFFFF",
	CARD_BORDER: "CBD5E0",
	TEXT_DARK: "1A202C",
	TEXT_MUTED: "4A5568",
	SUCCESS_GREEN: "2E7D32",
	ERROR_RED: "C62828"
};

const IMAGES_DIR = path.join(__dirname, "../docs/report/images");

// Natural Dimensions of Report PNG Images
const IMAGE_SIZES = {
	"hinh-homepage.png": { w: 1918, h: 943 },
	"hinh-1-kientruc-andv-lms.png": { w: 2265, h: 1323 },
	"hinh-2-sosanh-bruno-postman.png": { w: 924, h: 533 },
	"hinh-3-flowchart-bruno-cli.png": { w: 862, h: 813 },
	"hinh-4-sequence-stripe-webhook.png": { w: 974, h: 668 },
	"hinh-5-do-bao-phu-api.png": { w: 904, h: 593 },
	"hinh-6-giao-dien-bruno-desktop.png": { w: 1918, h: 1032 },
	"hinh-7-ket-qua-bruno-cli.png": { w: 684, h: 929 }
};

// Calculate maximum fitted bounds preserving natural aspect ratio (No stretching, Maximum Size)
function getFittedImageBounds(imageName, maxW = 9.2, maxH = 4.25, centerY = 3.25, centerX = 5.0) {
	const size = IMAGE_SIZES[imageName] || { w: 16, h: 9 };
	const aspect = size.w / size.h;
	const maxAspect = maxW / maxH;

	let w, h;
	if (aspect > maxAspect) {
		w = maxW;
		h = maxW / aspect;
	} else {
		h = maxH;
		w = maxH * aspect;
	}

	const x = centerX - w / 2;
	const y = centerY - h / 2;

	return { x, y, w, h };
}

function addSlideBackground(slide) {
	slide.background = { color: COLORS.BG_LIGHT };
}

function addHeader(slide, titleText, categoryText = "BÁO CÁO BÀI TẬP LỚN") {
	addSlideBackground(slide);
	
	// Category badge
	slide.addText(categoryText.toUpperCase(), {
		x: 0.6,
		y: 0.22,
		w: 8.8,
		h: 0.2,
		fontSize: 9,
		bold: true,
		color: COLORS.ACCENT_PURPLE,
		fontFace: "Arial"
	});

	// Title text
	slide.addText(titleText, {
		x: 0.6,
		y: 0.42,
		w: 8.8,
		h: 0.42,
		fontSize: 19,
		bold: true,
		color: COLORS.PRIMARY,
		fontFace: "Arial",
		valign: "top"
	});
}

function addFooter(slide, slideNum) {
	slide.addText(`Báo cáo Bài tập lớn: Kiểm thử API tự động với Bruno trên hệ thống LMS   |   Slide ${slideNum} / 18`, {
		x: 0.6,
		y: 5.35,
		w: 8.8,
		h: 0.22,
		fontSize: 8.5,
		color: "718096",
		fontFace: "Arial"
	});
}

// ----------------------------------------------------
// SLIDE 1: Title Slide (Student Assignment Tone)
// ----------------------------------------------------
const slide1 = pptx.addSlide();
addSlideBackground(slide1);

// Category Badge
slide1.addText("BÁO CÁO BÀI TẬP LỚN MÔN HỌC", {
	x: 0.8, y: 1.0, w: 8.4, h: 0.3,
	fontSize: 11, bold: true, color: COLORS.ACCENT_PURPLE, fontFace: "Arial"
});

// Main Title in Primary Deep Navy
slide1.addText("KIỂM THỬ API TỰ ĐỘNG VỚI BRUNO\nTRÊN HỆ THỐNG LMS", {
	x: 0.8, y: 1.35, w: 8.4, h: 1.5,
	fontSize: 28, bold: true, color: COLORS.PRIMARY, fontFace: "Arial", lineSpacing: 34
});

// Accent line under title
slide1.addShape(pptx.shapes.RECTANGLE, {
	x: 0.8, y: 2.95, w: 2.5, h: 0.05,
	fill: { color: COLORS.ACCENT_GOLD }
});

// Subtitle
slide1.addText("Đồ án môn học: Nghiên cứu giải pháp Git-friendly workflow & Thử nghiệm thực thi trên Andv-LMS", {
	x: 0.8, y: 3.15, w: 8.4, h: 0.4,
	fontSize: 13, color: COLORS.TEXT_MUTED, fontFace: "Arial"
});

// Metadata Card
slide1.addShape(pptx.shapes.RECTANGLE, {
	x: 0.8, y: 3.85, w: 8.4, h: 1.1,
	fill: { color: COLORS.WHITE },
	line: { color: COLORS.CARD_BORDER, width: 1 }
});

slide1.addText([
	{ text: "Sinh viên thực hiện: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Nhóm nghiên cứu Andv-LMS   ", options: { color: COLORS.TEXT_DARK } },
	{ text: "|   Môn học / Đồ án: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Kiểm thử phần mềm & API Test\n", options: { color: COLORS.TEXT_DARK } },
	{ text: "Công nghệ ứng dụng: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Bruno CLI/Desktop, Fastify, Better Auth, Stripe Webhook, S3 Storage", options: { color: COLORS.ACCENT_PURPLE, bold: true } }
], {
	x: 1.0, y: 3.95, w: 8.0, h: 0.9,
	fontSize: 11, fontFace: "Arial", lineSpacing: 18
});

// ----------------------------------------------------
// SLIDE 2: Agenda (Mục lục)
// ----------------------------------------------------
const slide2 = pptx.addSlide();
addHeader(slide2, "Mục lục Báo cáo Bài tập lớn", "TỔNG QUAN NỘI DUNG");
addFooter(slide2, 2);

const agendaItems = [
	{ num: "01", title: "Đặt vấn đề & Bối cảnh kiểm thử API", desc: "Nhu cầu bảo vệ hợp đồng dữ liệu & rủi ro trong LMS" },
	{ num: "02", title: "Giải pháp Bruno & Workflow Git-friendly", desc: "So sánh Bruno với Postman/Insomnia & Bru Markup" },
	{ num: "03", title: "Thiết kế Bộ kiểm thử API cho Andv-LMS", desc: "4 nguyên tắc thiết kế & 14 nhóm collection nghiệp vụ" },
	{ num: "04", title: "Thực nghiệm & Đánh giá Kết quả", desc: "Quy trình CLI/Desktop, 100% Pass & Route coverage" },
	{ num: "05", title: "Kết luận & Hướng phát triển", desc: "Tổng kết đóng góp, hạn chế & hướng mở rộng CI/CD" }
];

agendaItems.forEach((item, idx) => {
	const row = Math.floor(idx / 2);
	const col = idx % 2;
	const posX = 0.6 + col * 4.4;
	const posY = 1.05 + row * 1.45;

	if (idx === 4) {
		slide2.addShape(pptx.shapes.RECTANGLE, {
			x: 2.8, y: 3.95, w: 4.4, h: 1.15,
			fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1.5 }
		});
		slide2.addText(item.num, {
			x: 3.0, y: 4.1, w: 0.7, h: 0.5,
			fontSize: 22, bold: true, color: COLORS.ACCENT_PURPLE, fontFace: "Arial"
		});
		slide2.addText(item.title, {
			x: 3.7, y: 4.05, w: 3.3, h: 0.35,
			fontSize: 12.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
		});
		slide2.addText(item.desc, {
			x: 3.7, y: 4.4, w: 3.3, h: 0.5,
			fontSize: 9.5, color: COLORS.TEXT_MUTED, fontFace: "Arial"
		});
	} else {
		slide2.addShape(pptx.shapes.RECTANGLE, {
			x: posX, y: posY, w: 4.2, h: 1.25,
			fill: { color: COLORS.CARD_BG }, line: { color: COLORS.CARD_BORDER, width: 1 }
		});
		slide2.addText(item.num, {
			x: posX + 0.2, y: posY + 0.18, w: 0.6, h: 0.5,
			fontSize: 22, bold: true, color: COLORS.ACCENT_GOLD, fontFace: "Arial"
		});
		slide2.addText(item.title, {
			x: posX + 0.8, y: posY + 0.12, w: 3.2, h: 0.4,
			fontSize: 12, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
		});
		slide2.addText(item.desc, {
			x: posX + 0.8, y: posY + 0.52, w: 3.2, h: 0.6,
			fontSize: 9.5, color: COLORS.TEXT_MUTED, fontFace: "Arial"
		});
	}
});

// ----------------------------------------------------
// SLIDE 3: Problem & LMS Context (Maximum Prominent Figure)
// ----------------------------------------------------
const slide3 = pptx.addSlide();
addHeader(slide3, "Bối cảnh & Tính cấp thiết của Kiểm thử API trong LMS", "1. TỔNG QUAN GIẢI PHÁP");
addFooter(slide3, 3);

// Subtitle Callout Line
slide3.addText("• API kết nối Next.js Frontend, Fastify Backend, PostgreSQL và dịch vụ bên ngoài (Stripe, S3 Storage)", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

// Maximum Prominent Figure Image (Homepage)
const img3Bounds = getFittedImageBounds("hinh-homepage.png", 9.2, 4.15, 3.25, 5.0);
slide3.addImage({
	path: path.join(IMAGES_DIR, "hinh-homepage.png"),
	...img3Bounds
});

// ----------------------------------------------------
// SLIDE 4: Challenges of Traditional API Tools (Prominent Comparison Figure)
// ----------------------------------------------------
const slide4 = pptx.addSlide();
addHeader(slide4, "Thách thức của Công cụ Kiểm thử API Truyền thống", "1. TỔNG QUAN GIẢI PHÁP");
addFooter(slide4, 4);

// Subtitle Callout Line
slide4.addText("• Rào cản Cloud Sync / Mất Scratchpad offline (Postman, Insomnia 8.0+) & Xung đột Git merge với tệp JSON lớn", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.ERROR_RED, fontFace: "Arial"
});

// Prominent Workflow Comparison Figure
const img4Bounds = getFittedImageBounds("hinh-2-sosanh-bruno-postman.png", 9.2, 4.15, 3.25, 5.0);
slide4.addImage({
	path: path.join(IMAGES_DIR, "hinh-2-sosanh-bruno-postman.png"),
	...img4Bounds
});

// ----------------------------------------------------
// SLIDE 5: Bruno Solution & Bru Markup Plain-Text
// ----------------------------------------------------
const slide5 = pptx.addSlide();
addHeader(slide5, "Giải pháp Bruno & Định dạng Bru Markup Plain-Text", "2. GIẢI PHÁP BRUNO");
addFooter(slide5, 5);

// 3 Full-Width Card Columns
const brunoFeatures = [
	{ title: "1. 100% Offline-First", subtitle: "An toàn dữ liệu", desc: "Hoàn toàn chạy cục bộ, không yêu cầu tài khoản đám mây, bảo vệ token xác thực & webhook secrets." },
	{ title: "2. Bru Markup Plain-Text", subtitle: "Tổ chức theo thư mục", desc: "Mỗi request API là một tệp `.bru` riêng biệt nằm trực tiếp trong repository mã nguồn dự án." },
	{ title: "3. Tối ưu cho Git Review", subtitle: "Code Review dễ dàng", desc: "Mọi thay đổi URL, headers, script hay assertions đều tạo ra dòng diff rõ ràng trên Git Pull Request." }
];

brunoFeatures.forEach((item, idx) => {
	const posX = 0.6 + idx * 3.0;
	slide5.addShape(pptx.shapes.RECTANGLE, {
		x: posX, y: 1.1, w: 2.8, h: 4.0,
		fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1.5 }
	});

	slide5.addText(item.title, {
		x: posX + 0.15, y: 1.3, w: 2.5, h: 0.4,
		fontSize: 13, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
	});

	slide5.addText(item.subtitle, {
		x: posX + 0.15, y: 1.7, w: 2.5, h: 0.3,
		fontSize: 10.5, bold: true, color: COLORS.ACCENT_GOLD, fontFace: "Arial"
	});

	slide5.addText(item.desc, {
		x: posX + 0.15, y: 2.1, w: 2.5, h: 2.8,
		fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 16
	});
});

// ----------------------------------------------------
// SLIDE 6: Comparison Table
// ----------------------------------------------------
const slide6 = pptx.addSlide();
addHeader(slide6, "So sánh Bruno với Postman và Insomnia", "2. GIẢI PHÁP BRUNO");
addFooter(slide6, 6);

const tableData = [
	[
		{ text: "Tiêu chí", options: { bold: true, color: COLORS.WHITE, fill: COLORS.PRIMARY } },
		{ text: "Bruno", options: { bold: true, color: COLORS.WHITE, fill: COLORS.ACCENT_PURPLE } },
		{ text: "Postman", options: { bold: true, color: COLORS.WHITE, fill: COLORS.SECONDARY } },
		{ text: "Insomnia", options: { bold: true, color: COLORS.WHITE, fill: COLORS.SECONDARY } }
	],
	[
		{ text: "Quản lý Git", options: { bold: true } },
		{ text: "File .bru theo thư mục", options: { color: COLORS.SUCCESS_GREEN, bold: true } },
		{ text: "Export JSON nguyên khối", options: {} },
		{ text: "Tùy biến cấu hình", options: {} }
	],
	[
		{ text: "Độ rõ của Diff", options: { bold: true } },
		{ text: "Rõ ràng từng dòng plain-text", options: { color: COLORS.SUCCESS_GREEN, bold: true } },
		{ text: "Khó đọc diff JSON lớn", options: {} },
		{ text: "Phụ thuộc workflow", options: {} }
	],
	[
		{ text: "Lưu trữ Offline", options: { bold: true } },
		{ text: "100% Cục bộ / Offline", options: { color: COLORS.SUCCESS_GREEN, bold: true } },
		{ text: "Hạn chế (bỏ Scratchpad)", options: {} },
		{ text: "Bắt buộc tài khoản Cloud", options: {} }
	],
	[
		{ text: "Giấy phép & Chi phí", options: { bold: true } },
		{ text: "Mã nguồn mở MIT (Miễn phí)", options: { color: COLORS.SUCCESS_GREEN, bold: true } },
		{ text: "Thương mại / Giới hạn team", options: {} },
		{ text: "Thương mại dần", options: {} }
	],
	[
		{ text: "CLI Automation", options: { bold: true } },
		{ text: "Bruno CLI (bru run)", options: { color: COLORS.PRIMARY, bold: true } },
		{ text: "Newman CLI", options: {} },
		{ text: "Inso CLI", options: {} }
	],
	[
		{ text: "Khả năng Audit", options: { bold: true } },
		{ text: "Dễ truy vết lịch sử Git", options: { color: COLORS.SUCCESS_GREEN, bold: true } },
		{ text: "Phụ thuộc Workspace cloud", options: {} },
		{ text: "Phụ thuộc Cloud sync", options: {} }
	]
];

slide6.addTable(tableData, {
	x: 0.6, y: 1.05, w: 8.8, h: 4.1,
	colW: [1.8, 2.4, 2.3, 2.3],
	fontSize: 10,
	fontFace: "Arial",
	border: { pt: 0.5, color: "CBD5E0" }
});

// ----------------------------------------------------
// SLIDE 7: LMS Architecture & Boundaries (Maximum Prominent Figure)
// ----------------------------------------------------
const slide7 = pptx.addSlide();
addHeader(slide7, "Kiến trúc Hệ thống Andv-LMS & Ranh giới Kiểm thử API", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide7, 7);

// Subtitle Callout Line
slide7.addText("• Fastify REST API Backend (xác thực Better Auth & Arcjet) kết nối PostgreSQL và S3 Storage Service", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

// Maximum Prominent Figure Image (Architecture)
const img7Bounds = getFittedImageBounds("hinh-1-kientruc-andv-lms.png", 9.2, 4.15, 3.25, 5.0);
slide7.addImage({
	path: path.join(IMAGES_DIR, "hinh-1-kientruc-andv-lms.png"),
	...img7Bounds
});

// ----------------------------------------------------
// SLIDE 8: Test Suite Design Principles
// ----------------------------------------------------
const slide8 = pptx.addSlide();
addHeader(slide8, "Nguyên tắc Thiết kế Bộ Kiểm thử API cho Andv-LMS", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide8, 8);

const principles = [
	{ title: "1. Bám theo Luồng Nghiệp vụ", desc: "Kiểm thử các request theo chuỗi có trạng thái (đăng nhập -> xem khóa học -> thanh toán -> mở khóa lesson) thay vì chỉ test endpoint rời rạc." },
	{ title: "2. Tách bạch Ranh giới Trách nhiệm", desc: "Chia nhỏ collection theo thư mục: system, auth-contract, protected-routes, admin-routes, payment-workflows, edge-workflows." },
	{ title: "3. Dữ liệu Seed Tái tạo Được", desc: "Sử dụng các tài khoản và ID Bruno-owned định danh (deterministic seed) giúp bộ test chạy lặp lại tin cậy nhiều lần." },
	{ title: "4. Expected Assertions Cụ thể", desc: "Mỗi request đều có tiêu chí kiểm tra HTTP Status (200, 401, 403, 404), schema response, token và boolean state trong database." }
];

principles.forEach((item, idx) => {
	const row = Math.floor(idx / 2);
	const col = idx % 2;
	const posX = 0.6 + col * 4.5;
	const posY = 1.05 + row * 2.05;

	slide8.addShape(pptx.shapes.RECTANGLE, {
		x: posX, y: posY, w: 4.3, h: 1.95,
		fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1 }
	});

	slide8.addText(item.title, {
		x: posX + 0.2, y: posY + 0.15, w: 3.9, h: 0.35,
		fontSize: 12, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
	});

	slide8.addText(item.desc, {
		x: posX + 0.2, y: posY + 0.55, w: 3.9, h: 1.2,
		fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 15
	});
});

// ----------------------------------------------------
// SLIDE 9: Collection Overview Table
// ----------------------------------------------------
const slide9 = pptx.addSlide();
addHeader(slide9, "Tổng quan Cấu trúc Collection Bruno trong Andv-LMS", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide9, 9);

const collectionTable = [
	[
		{ text: "Nhóm Collection", options: { bold: true, color: COLORS.WHITE, fill: COLORS.PRIMARY } },
		{ text: "Số File .bru", options: { bold: true, color: COLORS.WHITE, fill: COLORS.PRIMARY } },
		{ text: "Mục tiêu Kiểm thử Chính", options: { bold: true, color: COLORS.WHITE, fill: COLORS.PRIMARY } }
	],
	[{ text: "system", options: { bold: true } }, { text: "2", options: { align: "center" } }, { text: "Kiểm tra backend health check & OpenAPI JSON document" }],
	[{ text: "auth-contract", options: { bold: true } }, { text: "5", options: { align: "center" } }, { text: "Kiểm tra hợp đồng session & validation email-exists" }],
	[{ text: "protected-routes", options: { bold: true } }, { text: "9", options: { align: "center" } }, { text: "Xác minh ranh giới 401 Unauthorized khi chưa đăng nhập" }],
	[{ text: "admin-routes", options: { bold: true } }, { text: "19", options: { align: "center" } }, { text: "Xác minh ranh giới 401 Unauthorized ở toàn bộ route Admin" }],
	[{ text: "auth-workflows", options: { bold: true } }, { text: "4", options: { align: "center" } }, { text: "Đăng nhập user/admin & kiểm tra session cookie" }],
	[{ text: "course-workflows", options: { bold: true } }, { text: "8", options: { align: "center" } }, { text: "Luồng xem khóa học, sidebar, lesson content & complete lesson" }],
	[{ text: "payment-workflows", options: { bold: true } }, { text: "9", options: { align: "center" } }, { text: "Stripe checkout session, signed webhook & mở khóa enrollment" }],
	[{ text: "storage-workflows", options: { bold: true } }, { text: "12", options: { align: "center" } }, { text: "Cấp presigned URL, upload media thực tế & xóa file S3" }],
	[{ text: "edge-workflows", options: { bold: true } }, { text: "25", options: { align: "center" } }, { text: "Kiểm thử invalid input, missing resource, forbidden 403" }]
];

slide9.addTable(collectionTable, {
	x: 0.6, y: 1.05, w: 8.8, h: 4.1,
	colW: [2.2, 1.2, 5.4],
	fontSize: 9.5,
	fontFace: "Arial",
	border: { pt: 0.5, color: "CBD5E0" }
});

// ----------------------------------------------------
// SLIDE 10: Auth & Authorization Testing
// ----------------------------------------------------
const slide10 = pptx.addSlide();
addHeader(slide10, "Kiểm thử Xác thực & Phân quyền Tài khoản", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide10, 10);

// Column 1: Authentication
slide10.addShape(pptx.shapes.RECTANGLE, {
	x: 0.6, y: 1.05, w: 4.3, h: 4.1,
	fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1 }
});

slide10.addText("🔑 Authentication Workflow (Better Auth)", {
	x: 0.8, y: 1.25, w: 3.9, h: 0.35,
	fontSize: 13, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

slide10.addText([
	{ text: "• Đăng nhập Tài khoản Seed: ", options: { bold: true } },
	{ text: "Gửi credentials user/admin tới `/api/auth/sign-in/email`, nhận session token.\n\n", options: {} },
	{ text: "• Đối chiếu 2 Cơ chế Session: ", options: { bold: true } },
	{ text: "Xác minh song song Direct Better Auth Session (`/api/auth/get-session`) và API V1 Session (`/api/v1/auth/session`).\n\n", options: {} },
	{ text: "• Vòng đời Quản lý Tài khoản: ", options: { bold: true } },
	{ text: "Đăng ký user mới, yêu cầu reset password OTP, trích xuất OTP runtime và đổi mật khẩu thành công.", options: {} }
], {
	x: 0.8, y: 1.7, w: 3.9, h: 3.2,
	fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 15
});

// Column 2: Authorization Boundaries
slide10.addShape(pptx.shapes.RECTANGLE, {
	x: 5.1, y: 1.05, w: 4.3, h: 4.1,
	fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_GOLD, width: 1 }
});

slide10.addText("🛡️ Authorization Boundaries (401 vs 403)", {
	x: 5.3, y: 1.25, w: 3.9, h: 0.35,
	fontSize: 13, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

slide10.addText([
	{ text: "• Ranh giới 401 Unauthorized: ", options: { bold: true, color: COLORS.ERROR_RED } },
	{ text: "Chặn 100% người dùng chưa đăng nhập khi truy cập các route protected (lesson content, profile, checkout).\n\n", options: {} },
	{ text: "• Ranh giới 403 Forbidden: ", options: { bold: true, color: COLORS.ERROR_RED } },
	{ text: "Chặn người dùng thường (Role User) khi cố tình truy cập các API Quản trị Admin (tạo khóa học, cập nhật bài học, xem danh sách user).\n\n", options: {} },
	{ text: "• Đảm bảo tính Toàn vẹn Phân quyền: ", options: { bold: true } },
	{ text: "Ngăn chặn các lỗ hổng leo thang đặc quyền (Privilege Escalation).", options: {} }
], {
	x: 5.3, y: 1.7, w: 3.9, h: 3.2,
	fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 15
});

// ----------------------------------------------------
// SLIDE 11: Course Player & Progress Workflow
// ----------------------------------------------------
const slide11 = pptx.addSlide();
addHeader(slide11, "Kiểm thử Luồng Nghiệp vụ Khóa học & Tiến độ", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide11, 11);

const courseSteps = [
	{ step: "Bước 1", title: "Khóa học Công khai", desc: "Request `get-seeded-public-course.bru` kiểm tra thông tin course, slug và danh sách chapter công khai." },
	{ step: "Bước 2", title: "Xác minh Ghi danh", desc: "Request `check-seeded-is-enrolled.bru` xác minh biến boolean `enrolled: true` của user đã mua." },
	{ step: "Bước 3", title: "Đọc Nội dung Bài học", desc: "Request `get-seeded-lesson-content.bru` kiểm tra quyền truy cập video URL, thumbnail & tài liệu." },
	{ step: "Bước 4", title: "Hoàn thành & Đọc Tiến độ", desc: "Gửi `complete-seeded-lesson.bru` và đọc lại trạng thái `lesson-progress` để xác minh dữ liệu ghi nhận thành công." }
];

courseSteps.forEach((item, idx) => {
	const posX = 0.6 + idx * 2.25;
	slide11.addShape(pptx.shapes.RECTANGLE, {
		x: posX, y: 1.1, w: 2.1, h: 4.0,
		fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1 }
	});

	slide11.addText(item.step, {
		x: posX + 0.1, y: 1.3, w: 1.9, h: 0.3,
		fontSize: 11, bold: true, color: COLORS.ACCENT_GOLD, fontFace: "Arial", align: "center"
	});

	slide11.addText(item.title, {
		x: posX + 0.1, y: 1.65, w: 1.9, h: 0.5,
		fontSize: 12, bold: true, color: COLORS.PRIMARY, fontFace: "Arial", align: "center"
	});

	slide11.addText(item.desc, {
		x: posX + 0.15, y: 2.25, w: 1.8, h: 2.6,
		fontSize: 10, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 14
	});
});

// ----------------------------------------------------
// SLIDE 12: Stripe Payment Sequence (Maximum Prominent Figure)
// ----------------------------------------------------
const slide12 = pptx.addSlide();
addHeader(slide12, "Kiểm thử Tích hợp Thanh toán Stripe & Webhook", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide12, 12);

// Subtitle Callout Line
slide12.addText("• 1. Khởi tạo Checkout Session  →  2. Tự động sinh chữ ký stripe-signature (HMAC-SHA256)  →  3. Mở khóa Enrollment", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

// Maximum Prominent Figure Image (Sequence Diagram)
const img12Bounds = getFittedImageBounds("hinh-4-sequence-stripe-webhook.png", 9.2, 4.15, 3.25, 5.0);
slide12.addImage({
	path: path.join(IMAGES_DIR, "hinh-4-sequence-stripe-webhook.png"),
	...img12Bounds
});

// ----------------------------------------------------
// SLIDE 13: S3 Storage Integration
// ----------------------------------------------------
const slide13 = pptx.addSlide();
addHeader(slide13, "Kiểm thử Tích hợp Lưu trữ Media (S3 Storage)", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide13, 13);

const storageSteps = [
	{ title: "1. Cấp Presigned URL Upload", desc: "Admin gửi request xin cấp URL upload media (cover image, thumbnail, lesson video). API trả về presigned PUT URL có thời hạn." },
	{ title: "2. Upload File thực tế lên Storage", desc: "Bruno gửi HTTP PUT request kèm binary file fixture trực tiếp tới S3/R2 Storage URL. Assertions kiểm tra HTTP Status 200/204." },
	{ title: "3. Dọn dẹp & Xóa File Media", desc: "Sau khi upload thành công, gửi request xóa file media tương ứng khỏi S3 storage để đảm bảo tài nguyên kiểm thử sạch sẽ." }
];

storageSteps.forEach((item, idx) => {
	const posY = 1.1 + idx * 1.35;
	slide13.addShape(pptx.shapes.RECTANGLE, {
		x: 0.6, y: posY, w: 8.8, h: 1.25,
		fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1 }
	});

	slide13.addText(item.title, {
		x: 0.8, y: posY + 0.15, w: 8.4, h: 0.3,
		fontSize: 12, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
	});

	slide13.addText(item.desc, {
		x: 0.8, y: posY + 0.45, w: 8.4, h: 0.7,
		fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial"
	});
});

// ----------------------------------------------------
// SLIDE 14: Edge Cases & Desktop UI (Maximum Prominent Figure)
// ----------------------------------------------------
const slide14 = pptx.addSlide();
addHeader(slide14, "Kiểm thử Trường hợp Biên & Helper Desktop", "3. THIẾT KẾ BỘ KIỂM THỬ");
addFooter(slide14, 14);

// Subtitle Callout Line
slide14.addText("• Bao phủ 25+ Edge Cases (Invalid body, Missing resources, Tampered signature) & Helper Routes (/api/v1/desktop-helpers/*)", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

// Maximum Prominent Figure Image (Desktop App UI)
const img14Bounds = getFittedImageBounds("hinh-6-giao-dien-bruno-desktop.png", 9.2, 4.15, 3.25, 5.0);
slide14.addImage({
	path: path.join(IMAGES_DIR, "hinh-6-giao-dien-bruno-desktop.png"),
	...img14Bounds
});

// ----------------------------------------------------
// SLIDE 15: Automated CLI Flowchart (Maximum Prominent Figure)
// ----------------------------------------------------
const slide15 = pptx.addSlide();
addHeader(slide15, "Quy trình Thực thi Kiểm thử Tự động với Bruno CLI", "4. THỰC NGHIỆM & ĐÁNH GIÁ");
addFooter(slide15, 15);

// Subtitle Callout Line
slide15.addText("• Thực thi tự động: `npm run test:api:full` (Seed deterministic data → `bru run` toàn bộ 14 collection → Trích xuất biến môi trường)", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

// Maximum Prominent Figure Image (CLI Flowchart)
const img15Bounds = getFittedImageBounds("hinh-3-flowchart-bruno-cli.png", 9.2, 4.15, 3.25, 5.0);
slide15.addImage({
	path: path.join(IMAGES_DIR, "hinh-3-flowchart-bruno-cli.png"),
	...img15Bounds
});

// ----------------------------------------------------
// SLIDE 16: Experimental Results & Route Coverage (Maximum Prominent 2-Figure Layout)
// ----------------------------------------------------
const slide16 = pptx.addSlide();
addHeader(slide16, "Kết quả Thực nghiệm & Mức độ Bao phủ API (Route Coverage)", "4. THỰC NGHIỆM & ĐÁNH GIÁ");
addFooter(slide16, 16);

// Subtitle Callout Line
slide16.addText("• Kết quả: 100% PASS trên toàn bộ 133+ tệp kịch bản kiểm thử `.bru` và Bao phủ 100% danh mục route backend Fastify", {
	x: 0.6, y: 0.88, w: 8.8, h: 0.28,
	fontSize: 10.5, bold: true, color: COLORS.SUCCESS_GREEN, fontFace: "Arial"
});

// Fitted Left Image: Terminal CLI Output
const img16LBounds = getFittedImageBounds("hinh-7-ket-qua-bruno-cli.png", 4.3, 4.15, 3.25, 2.75);
slide16.addImage({
	path: path.join(IMAGES_DIR, "hinh-7-ket-qua-bruno-cli.png"),
	...img16LBounds
});

// Fitted Right Image: Route Coverage Graph
const img16RBounds = getFittedImageBounds("hinh-5-do-bao-phu-api.png", 4.3, 4.15, 3.25, 7.25);
slide16.addImage({
	path: path.join(IMAGES_DIR, "hinh-5-do-bao-phu-api.png"),
	...img16RBounds
});

// ----------------------------------------------------
// SLIDE 17: Limitations & Future Development
// ----------------------------------------------------
const slide17 = pptx.addSlide();
addHeader(slide17, "Hạn chế của Đề tài & Hướng phát triển Tương lai", "5. KẾT LUẬN & HƯỚNG PHÁT TRIỂN");
addFooter(slide17, 17);

// Left Column: Limitations
slide17.addShape(pptx.shapes.RECTANGLE, {
	x: 0.6, y: 1.05, w: 4.3, h: 4.1,
	fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_GOLD, width: 1.5 }
});

slide17.addText("⚠️ Hạn chế Hiện tại của Bài tập lớn", {
	x: 0.8, y: 1.25, w: 3.9, h: 0.35,
	fontSize: 13, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

slide17.addText([
	{ text: "1. Chưa tích hợp CI/CD tự động:\n", options: { bold: true } },
	{ text: "Hiện tại việc thực thi bộ test dựa trên script npm cục bộ, chưa gắn vào GitHub Actions pipeline.\n\n", options: {} },
	{ text: "2. Phụ thuộc vào dữ liệu Seed định danh:\n", options: { bold: true } },
	{ text: "Cần đảm bảo database kiểm thử được reset/seed đúng trạng thái trước khi chạy kịch bản full.\n\n", options: {} },
	{ text: "3. Chưa mở rộng Fuzzing & Load Testing:\n", options: { bold: true } },
	{ text: "Chưa kiểm thử tải lớn (Stress test) và kiểm thử xâm nhập dữ liệu ngẫu nhiên.", options: {} }
], {
	x: 0.8, y: 1.7, w: 3.9, h: 3.2,
	fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 15
});

// Right Column: Future Directions
slide17.addShape(pptx.shapes.RECTANGLE, {
	x: 5.1, y: 1.05, w: 4.3, h: 4.1,
	fill: { color: COLORS.CARD_BG }, line: { color: COLORS.ACCENT_PURPLE, width: 1.5 }
});

slide17.addText("🚀 Hướng Mở rộng Phát triển", {
	x: 5.3, y: 1.25, w: 3.9, h: 0.35,
	fontSize: 13, bold: true, color: COLORS.PRIMARY, fontFace: "Arial"
});

slide17.addText([
	{ text: "1. Đưa Bruno CLI vào CI/CD Pipeline:\n", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Tự động kích hoạt `bru run` mỗi khi có Pull Request mới được mở trên Git.\n\n", options: {} },
	{ text: "2. Xây dựng Báo cáo HTML Tự động:\n", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Tích hợp reporter xuất file báo cáo HTML/JUnit XML chi tiết sau mỗi phiên chạy.\n\n", options: {} },
	{ text: "3. Mở rộng Fuzzing & Performance Testing:\n", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Kết hợp Bruno với k6 hoặc Locust để đánh giá hiệu năng chịu tải của API LMS.", options: {} }
], {
	x: 5.3, y: 1.7, w: 3.9, h: 3.2,
	fontSize: 10.5, color: COLORS.TEXT_DARK, fontFace: "Arial", lineSpacing: 15
});

// ----------------------------------------------------
// SLIDE 18: Conclusion & Q&A (Student Assignment Tone)
// ----------------------------------------------------
const slide18 = pptx.addSlide();
addHeader(slide18, "Tổng kết Đóng góp Chính của Bài tập lớn", "5. KẾT LUẬN & HƯỚNG PHÁT TRIỂN");
addFooter(slide18, 18);

// Summary Card Box (White background with Purple border)
slide18.addShape(pptx.shapes.RECTANGLE, {
	x: 0.6, y: 1.1, w: 8.8, h: 2.6,
	fill: { color: COLORS.WHITE },
	line: { color: COLORS.ACCENT_PURPLE, width: 1.5 }
});

slide18.addText([
	{ text: "1. Quy trình Git-Friendly Workflow hoàn chỉnh: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Quản lý kịch bản kiểm thử API bằng file plain-text `.bru` trong mã nguồn, tối ưu hóa code review trên Git.\n\n", options: { color: COLORS.TEXT_DARK } },
	{ text: "2. Khả năng Audit & Bảo mật Dữ liệu Cao: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Hoạt động 100% Offline-first, loại bỏ nguy cơ rò rỉ token/secret lên đám mây bên thứ ba.\n\n", options: { color: COLORS.TEXT_DARK } },
	{ text: "3. Bộ Kiểm thử LMS Tự động hóa Bao phủ 100%: ", options: { bold: true, color: COLORS.PRIMARY } },
	{ text: "Bao phủ đầy đủ các luồng nghiệp vụ Auth, Course Player, Stripe Webhook, S3 Storage & Edge Cases.", options: { color: COLORS.TEXT_DARK } }
], {
	x: 0.85, y: 1.25, w: 8.3, h: 2.3,
	fontSize: 11, fontFace: "Arial", lineSpacing: 16
});

// Q&A Box
slide18.addShape(pptx.shapes.RECTANGLE, {
	x: 0.6, y: 3.9, w: 8.8, h: 1.25,
	fill: { color: COLORS.WHITE },
	line: { color: COLORS.ACCENT_GOLD, width: 1.5 }
});

slide18.addText("CẢM ƠN THẦY/CÔ VÀ CÁC BẠN ĐÃ LẮNG NGHE!", {
	x: 0.8, y: 4.05, w: 8.4, h: 0.4,
	fontSize: 18, bold: true, color: COLORS.PRIMARY, fontFace: "Arial", align: "center"
});

slide18.addText("Q & A — Thảo luận & Giải đáp thắc mắc bài tập lớn", {
	x: 0.8, y: 4.5, w: 8.4, h: 0.3,
	fontSize: 12, color: COLORS.ACCENT_PURPLE, fontFace: "Arial", align: "center"
});

// Save Presentation
const outputPath = path.join(__dirname, "../docs/presentation/bruno-lms-presentation.pptx");

pptx.writeFile({ fileName: outputPath })
	.then(fileName => {
		console.log(`Successfully generated presentation: ${fileName}`);
	})
	.catch(err => {
		console.error("Error generating presentation:", err);
	});
