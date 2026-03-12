import Image from 'next/image'

interface PageHeroProps {
  label: string
  title: string
  description: string
  imageUrl: string
  imageAlt?: string
}

export default function PageHero({ label, title, description, imageUrl, imageAlt = '' }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-ink/60" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 section-pad">
        <div className="container-narrow">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-body text-sm font-semibold text-white/90 backdrop-blur-sm">
            {label}
          </span>
          <h1 className="mb-4 font-heading text-4xl font-extrabold leading-tight text-white md:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl font-body text-lg leading-relaxed text-white/80">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}
