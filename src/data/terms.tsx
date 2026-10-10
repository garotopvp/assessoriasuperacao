import React from "react";

export const COMPANY_INFO = {
  razaoSocial: "Andrade Pedroso e Perrota Assessoria Esportiva LTDA",
  cnpj: "62.783.203/0001-59",
  nomeFantasia: "Superação Assessoria Esportiva",
};

export const TERMS_CONTENT = (
  <div className="space-y-4 text-sm text-foreground text-left">
    <p>
      <strong>1. DO OBJETO</strong>
      <br />O presente termo tem como objeto a prestação de serviços de assessoria esportiva e
      orientação de corrida pela empresa <strong>{COMPANY_INFO.razaoSocial}</strong>, inscrita no
      CNPJ sob o nº <strong>{COMPANY_INFO.cnpj}</strong>, nome fantasia{" "}
      <strong>{COMPANY_INFO.nomeFantasia}</strong>.
    </p>

    <p>
      <strong>2. DA SAÚDE E APTIDÃO FÍSICA</strong>
      <br />
      Declaro, para os devidos fins, que estou apto(a) a praticar atividades físicas e que não
      possuo contraindicações médicas. Reconheço que é de minha inteira responsabilidade realizar
      exames médicos periódicos (check-up) antes de iniciar os treinos. Isento o SUPERACÃO
      ASSESSORIA ESPORTIVA e seus treinadores de qualquer responsabilidade sobre problemas de saúde
      pré-existentes ou mal súbitos que possam ocorrer durante a prática das atividades.
    </p>

    <p>
      <strong>3. DOS RISCOS DA ATIVIDADE</strong>
      <br />
      Estou ciente de que a prática de corrida envolve riscos inerentes à atividade, tais como
      torções, quedas e lesões musculares. Assumo total responsabilidade por minha integridade
      física durante os treinos presenciais ou realizados à distância, comprometendo-me a seguir as
      orientações dos treinadores.
    </p>

    <p>
      <strong>4. DO USO DE IMAGEM</strong>
      <br />
      Autorizo, a título gratuito, o uso da minha imagem em fotos e vídeos captados durante treinos
      e eventos do SUPERAÇÃO ASSESSORIA ESPORTIVA, para fins de divulgação nas redes sociais e
      materiais promocionais da assessoria.
    </p>

    <p>
      <strong>5. DA ASSINATURA E CANCELAMENTO</strong>
      <br />
      Estou ciente de que os planos possuem renovação de acordo com a periodicidade contratada. O
      cancelamento deve ser solicitado com antecedência mínima de 30 dias. Não haverá reembolso de
      valores referentes a períodos não utilizados por desistência do aluno.
    </p>

    <p>
      <strong>6. DISPOSIÇÕES GERAIS</strong>
      <br />
      Ao aceitar este termo, confirmo a veracidade de todas as informações prestadas no cadastro e
      concordo com as regras estabelecidas pela SUPERAÇÃO ASSESSORIA ESPORTIVA.
    </p>
  </div>
);
