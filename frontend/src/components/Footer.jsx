export default function Footer() {
  return (
    // mới (thấp xuống thêm)
    <footer className="bg-[#0B1220] text-white mt-28 md:mt-32">

      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center">
              <span className="text-primary font-black text-sm">EV</span>
            </div>
            <span className="font-extrabold text-xl">EVolve</span>
          </div>
          <p className="text-white/70 mt-4 text-sm leading-6">
            Nền tảng cho thuê xe điện hiện đại – tối ưu chi phí, thân thiện môi trường,
            kết nối nhanh với hệ thống trạm của bạn.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold mb-3">Công ty</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><a href="#" className="hover:text-white">Về chúng tôi</a></li>
            <li><a href="#" className="hover:text-white">Tính năng</a></li>
            <li><a href="#" className="hover:text-white">Liên hệ</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-3">Hỗ trợ</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><a href="#" className="hover:text-white">Câu hỏi thường gặp</a></li>
            <li><a href="#" className="hover:text-white">Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
          </ul>
        </div>

        {/* Contact / Newsletter (giả lập) */}
        <div>
          <h4 className="font-semibold mb-3">Liên hệ</h4>
          <div className="text-white/80 text-sm space-y-2">
            <p>Email: hello@evolve.dev</p>
            <p>Hotline: 0123 456 789</p>
          </div>
          <form className="mt-4 flex gap-2">
            <input
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập email để nhận tin"
            />
            <button type="button" className="px-5 rounded-xl bg-primary text-white font-semibold">
              Gửi
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-sm">© {new Date().getFullYear()} EVolve. All rights reserved.</p>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <a href="#" className="hover:text-white">Facebook</a>
            <a href="#" className="hover:text-white">Instagram</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
