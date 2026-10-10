// CONSULTORIA — JavaScript

function iniciarExploracao(plano) {
  const planos = {
    mensal: { nome: "Mensal", preco: 149.97 },
    trimestral: { nome: "Trimestral", preco: 139.97 },
    semestral: { nome: "Semestral", preco: 129.97 },
    anual: { nome: "Anual", preco: 109.97 },
  };

  const selecionado = planos[plano];
  if (!selecionado) return;

  const nome = prompt("Seu nome completo:");
  if (!nome) return;

  const email = prompt("Seu email:");
  if (!email) return;

  const telefone = prompt("Seu WhatsApp (com DDD):");
  if (!telefone) return;

  const experiencia = prompt("Descreva brevemente sua experiência com corrida:");

  let mensagem = `INSCRIÇÃO - PLANO ${selecionado.nome.toUpperCase()}%0D%0A%0D%0A`;
  mensagem += `Nome: ${nome}%0D%0A`;
  mensagem += `Email: ${email}%0D%0A`;
  mensagem += `WhatsApp: ${telefone}%0D%0A`;
  mensagem += `Plano: ${selecionado.nome} — R$ ${selecionado.preco.toFixed(2)}%0D%0A`;
  if (experiencia) {
    mensagem += `%0D%0AExperiência:%0D%0A${encodeURIComponent(experiencia)}%0D%0A`;
  }
  mensagem += `%0D%0AAguardo retorno para iniciar avaliação.`;

  const mailto = `mailto:consultoria@boracorrerclub.com?subject=Inscrição - Plano ${selecionado.nome}&body=${mensagem}`;
  window.location.href = mailto;

  alert("Obrigado! Você será redirecionado para enviar o email de inscrição.");
}
