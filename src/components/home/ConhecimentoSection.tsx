const artigos = [
  {
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80",
    tag: "TREINO",
    title: "Como estruturar microciclos para maratonas",
    description: "A periodização correta pode reduzir o risco de lesões em até 40%.",
  },
  {
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
    tag: "EQUIPAMENTO",
    title: "A ciência por trás do Strideflow Y®",
    description: "Tecido 40% mais leve com termorregulação avançada.",
  },
  {
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80",
    tag: "PERFORMANCE",
    title: "Análise biomecânica: vale a pena?",
    description: "Estudos mostram melhoria de 3-7% na economia de corrida.",
  },
];

export function ConhecimentoSection() {
  return (
    <section className="py-24 bg-muted" id="conhecimento">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
          CONHECIMENTO
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {artigos.map((artigo, index) => (
            <article
              key={index}
              className="bg-background border border-border overflow-hidden group hover:border-primary transition-colors"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={artigo.image}
                  alt={artigo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="inline-block text-xs font-bold text-primary uppercase tracking-wide mb-3">
                  {artigo.tag}
                </span>
                <h3 className="text-lg font-bold mb-2 leading-snug">{artigo.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{artigo.description}</p>
                <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                  Ler mais →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
