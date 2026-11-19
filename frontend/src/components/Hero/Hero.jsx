
import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

const slides = [
  {
    id: 1,
    subtitle: 'J&L FASHION',
    title: 'Style That Speaks For You',
    description:
      'Discover timeless fashion and redefine your everyday style.',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2400&q=85',
    link: '/collections',
  },
  {
    id: 2,
    subtitle: 'NEW COLLECTION',
    title: 'Discover Your Signature Look',
    description:
      'Explore styles designed for every occasion.',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=85',
    link: '/women',
  },
  {
    id: 3,
    subtitle: 'EXPLORE MORE',
    title: 'Fashion For Every Moment',
    description:
      'Find your favorites from our latest collections.',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2400&q=85',
    link: '/men',
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  const slide = slides[currentSlide];

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url("${slide.image}")` }}
      aria-label="Featured collections"
    >
      <div className="hero-overlay">
        <div className="hero-content">
          <p className="hero-subtitle">{slide.subtitle}</p>

          <h1 className="hero-title">{slide.title}</h1>

          <p className="hero-description">
            {slide.description}
          </p>

          <Link to={slide.link} className="hero-button">
            Explore Collection
          </Link>
        </div>
      </div>

      <button
        type="button"
        className="hero-arrow hero-arrow-left"
        onClick={previousSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        className="hero-arrow hero-arrow-right"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      <div className="hero-dots">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`hero-dot ${
              currentSlide === index ? 'active' : ''
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
