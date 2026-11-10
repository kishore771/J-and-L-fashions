import constructionVideo from "../../assets/videos/Under-construction.mp4";
import './UnderConstruction.css';

const UnderConstruction = () => {
  return (
    <div className="under-construction">
      <video autoPlay muted loop playsInline>
        <source src={constructionVideo} type="video/mp4" />
      </video>

      <h1>Something Stylish Is Coming</h1>
      <p>We're working on something exciting.</p>
    </div>
  );
};

export default UnderConstruction;