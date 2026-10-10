// Ordem padrão dos tamanhos
export const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG", "XXG", "UNICO"];

// Função para ordenar tamanhos na ordem padrão
export function sortSizes(sizes: string[]): string[] {
  return sizes.sort((a, b) => {
    const indexA = DEFAULT_SIZES.indexOf(a);
    const indexB = DEFAULT_SIZES.indexOf(b);

    // Se ambos estão na lista padrão, ordena pela posição
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // Se apenas A está na lista, A vem primeiro
    if (indexA !== -1) return -1;

    // Se apenas B está na lista, B vem primeiro
    if (indexB !== -1) return 1;

    // Se nenhum está na lista, mantém ordem alfabética
    return a.localeCompare(b);
  });
}
