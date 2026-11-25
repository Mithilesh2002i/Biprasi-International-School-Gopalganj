// School ka logo: public/logo.png. Naya (high-resolution) logo ho to usi naam se replace kar dein.
export default function Logo({ className = '', alt = 'School logo' }) {
  return <img className={className} src={`${import.meta.env.BASE_URL}logo.png`} alt={alt} draggable="false" />;
}
