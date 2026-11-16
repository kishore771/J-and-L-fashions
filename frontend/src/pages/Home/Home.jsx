import Hero from '../../components/Hero/Hero';
import FeaturedProducts from '../../components/FeaturedProducts/FeaturedProducts';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <FeaturedProducts />
    </div>
  );
};

export default Home;