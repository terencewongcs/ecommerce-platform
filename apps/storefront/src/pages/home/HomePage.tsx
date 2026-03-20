import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import SearchBar from '../../components/SearchBar';
import CategoryGrid from '../../components/CategoryGrid';
import FeaturedProducts from '../../components/FeaturedProducts';
import Footer from '../../components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <SearchBar />
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <Footer />
    </>
  );
}
