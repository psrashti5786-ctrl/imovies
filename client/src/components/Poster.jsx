const palettes = ['#e5383b,#6a040f', '#4361ee,#3a0ca3', '#2a9d8f,#264653', '#f77f00,#d62828', '#7209b7,#3c096c', '#06d6a0,#118ab2'];

// Shows the uploaded poster, or a colour gradient with the title
export default function Poster({ movie, style }) {
  const idx = (movie.title || '').length % palettes.length;
  const bg = movie.poster
    ? `url(${movie.poster})`
    : `linear-gradient(160deg, ${palettes[idx]})`;
  return (
    <div className="poster" style={{ backgroundImage: bg, ...style }}>
      {!movie.poster && movie.title}
    </div>
  );
}
