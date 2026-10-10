const depoimentos = [
  {
    stars: 5,
    text: "Comecei correndo 5k em 28 minutos. Depois de certo tempo seguindo a planilha do Coach, fechei os 20k para 22:23. A diferença é treinar com consistência e progressão — não é só sair correndo. Os treinos intervalados fizeram toda a diferença.",
    name: "Victor Perrota",
    result: "20K em 22:23 • 34 anos",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
  {
    stars: 5,
    text: "Meu pace estava travado em 8min/km há mais de 1 ano. Com o acompanhamento semanal e ajustes na periodização, hoje rodo confortável em 6min/km. O segredo foi entender que volume sem qualidade não resolve — precisei treinar menos, mas melhor.",
    name: "Ana Paula Vieira",
    result: "De 8min/km para 6min/km • 41 anos",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
  },
  {
    stars: 5,
    text: "Corri minha primeira meia maratona em 2h15, mas queria baixar de 2h. A Superação me ajudou a estruturar os longões e regenerativos da forma certa. Resultado: 1h52 na Meia de Santos. A comunidade também motiva muito — treinar em grupo faz diferença.",
    name: "Thiago Lima",
    result: "21K em 1h52 • 37 anos",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
  },
];

export function DepoimentosSection() {
  return (
    <section className="pt-4 pb-16 bg-white relative overflow-hidden" id="depoimentos">
      <div className="container px-4 md:px-8 mx-auto relative z-10">
        
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 text-primary">
            Depoimentos Reais
          </span>
          <h2 className="text-4xl md:text-6xl font-heading uppercase text-black leading-tight tracking-tighter">
            O Que Dizem <span className="text-primary">Os Atletas</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-neutral-500">
            Resultados comprovados por quem vive a Superação todos os dias.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {depoimentos.map((depo, idx) => (
            <div key={idx} className="bg-gradient-to-br from-red-600 via-primary to-blue-900 p-1 rounded-[2rem] overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500 group">
              <div className="bg-white p-8 md:p-10 rounded-[1.8rem] h-full flex flex-col">
                {/* Stars */}
                <div className="text-red-600 text-lg mb-6 flex gap-1">
                  {"★".repeat(depo.stars)}
                </div>

                {/* Testimonial Text */}
                <p className="text-neutral-700 text-lg leading-relaxed mb-10 flex-1 font-medium">
                  "{depo.text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-100 shadow-sm shrink-0">
                    <img 
                      src={depo.avatar} 
                      alt={depo.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-black font-bold text-base font-heading uppercase tracking-wide">
                      {depo.name}
                    </h4>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                      {depo.result}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
            <button className="bg-black text-white font-heading uppercase tracking-widest px-10 py-5 rounded-sm hover:bg-primary transition-all shadow-2xl hover:-translate-y-1">
                Comece sua história agora
            </button>
        </div>
      </div>

      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10" />
    </section>
  );
}
