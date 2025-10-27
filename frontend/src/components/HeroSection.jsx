import SearchBar from './SearchBar'
import banner from '../assets/banner.jpg' // file bạn vừa đặt

export default function HeroSection() {
  return (
    <section className="relative mb-32 md:mb-48 lg:mb-56">
      {/* Banner background */}
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover"
        style={{ backgroundImage: `url(${banner})` }}
      />
      {/* Overlay tối + gradient đỏ nhẹ */}
      <div className="absolute inset-0 -z-10 bg-[#0B1220]/70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-black/40 to-transparent" />

      <div className="container pt-16 pb-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1]">
            Trải nghiệm tương lai <br />
            <span className="text-primary">Với xe điện thông minh</span>
          </h1>
          <p className="mt-4 text-white/80 max-w-xl">
            Dịch vụ cho thuê xe điện hiện đại, thân thiện môi trường và tiết kiệm chi phí.
          </p>
          <div className="mt-5">
            <a className="btn" href="#featured">Thuê xe ngay</a>
          </div>
        </div>

        {/* Search bar nổi */}
        <div className="mt-10">
          <div className="card-elev p-3 md:p-4 max-w-5xl">
            <SearchBar compact={false} />
          </div>
        </div>
      </div>
    </section>
  )
}
