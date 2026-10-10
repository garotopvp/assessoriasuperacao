import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número como moeda brasileira (R$)
 * @param value - Valor em centavos ou reais
 * @param inCents - Se true, o valor está em centavos (padrão: true)
 */
export function formatCurrency(value: number, inCents: boolean = true): string {
  const valueInReais = inCents ? value / 100 : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInReais);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatName(name: string): string {
  if (!name) return "";

  const lowCaseWords = ["de", "da", "do", "das", "dos", "e", "y"];
  const words = name.toLowerCase().split(/\s+/);

  return words
    .map((word, index) => {
      if (word.length === 0) return "";

      // Sempre capitaliza a primeira palavra.
      // Capitaliza as outras se não estiverem na lista de exceções.
      if (index === 0 || !lowCaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      return word;
    })
    .join(" ");
}
