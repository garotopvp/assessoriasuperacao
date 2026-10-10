import { Layout } from "@/components/layout/Layout";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermosUso = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-4xl font-black mb-8">Termos de Uso</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground italic">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o Superação Assessoria, você concorda com estes Termos de Uso e nossa
              Política de Privacidade. Se não concordar com qualquer parte destes termos, você não
              deve usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Descrição do Serviço</h2>
            <p>O Superação Assessoria é uma plataforma online que oferece:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Planos de assinatura para acesso a conteúdos exclusivos sobre corrida</li>
              <li>Loja de produtos esportivos</li>
              <li>Serviços de consultoria esportiva</li>
              <li>Comunidade de atletas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Cadastro e Conta</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">3.1 Requisitos</h3>
            <p>Para usar nossos serviços, você deve:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Não compartilhar sua conta com terceiros</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              3.2 Responsabilidades
            </h3>
            <p>
              Você é responsável por todas as atividades realizadas em sua conta. Notifique-nos
              imediatamente sobre qualquer uso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Assinaturas e Pagamentos</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">4.1 Planos</h3>
            <p>
              Oferecemos planos de assinatura mensal, trimestral, semestral e anual. Os valores e
              benefícios estão descritos na página de planos.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              4.2 Renovação Automática
            </h3>
            <p>
              Assinaturas são renovadas automaticamente ao final de cada período, a menos que você
              cancele antes da data de renovação.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">4.3 Cancelamento</h3>
            <p>
              Você pode cancelar sua assinatura a qualquer momento através do seu perfil. O
              cancelamento terá efeito ao final do período já pago.{" "}
              <strong>Não há reembolso proporcional.</strong>
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              4.4 Métodos de Pagamento
            </h3>
            <p>
              Aceitamos pagamentos via cartão de crédito e PIX através de nossos parceiros (Stripe,
              OpenPix, InfinitePay, Abacate Pay).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Política de Reembolso</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">5.1 Assinaturas</h3>
            <p>
              Não oferecemos reembolso para assinaturas já iniciadas. Você pode cancelar a qualquer
              momento, mas o valor pago será válido até o fim do período contratado.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              5.2 Produtos Físicos
            </h3>
            <p>
              Para produtos físicos (roupas, acessórios), aceitamos devoluções em até 7 dias após o
              recebimento, conforme o Código de Defesa do Consumidor. O produto deve estar sem uso,
              com etiquetas originais e na embalagem original.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              5.3 Defeitos de Fabricação
            </h3>
            <p>
              Produtos com defeito de fabricação podem ser trocados em até 90 dias após a compra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Uso Aceitável</h2>
            <p>Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o serviço para atividades ilegais</li>
              <li>Compartilhar conteúdos protegidos por direitos autorais</li>
              <li>Copiar, distribuir ou vender conteúdos exclusivos da plataforma</li>
              <li>Tentar hackear ou comprometer a segurança do sistema</li>
              <li>Criar múltiplas contas para burlar limitações</li>
              <li>Usar bots ou scripts automatizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo disponível no Superação Assessoria (textos, imagens, vídeos, logotipos,
              marcas) é de propriedade exclusiva da empresa ou de seus licenciadores e está
              protegido por leis de direitos autorais e propriedade intelectual.
            </p>
            <p>
              Você recebe uma licença limitada, não exclusiva e não transferível para acessar e usar
              o conteúdo apenas para uso pessoal e não comercial.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              8. Limitação de Responsabilidade
            </h2>
            <p>O Superação Assessoria não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lesões ou problemas de saúde decorrentes da prática de atividades físicas</li>
              <li>Resultados específicos (perda de peso, ganho de performance)</li>
              <li>Indisponibilidade temporária do serviço por manutenção ou falhas técnicas</li>
              <li>Perda de dados devido a problemas técnicos</li>
            </ul>
            <p className="mt-4">
              <strong>
                Recomendamos consultar um médico antes de iniciar qualquer programa de exercícios
                físicos.
              </strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Suspensão e Encerramento</h2>
            <p>
              Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, sem
              aviso prévio, em caso de violação destes termos ou por decisão comercial.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Modificações dos Termos</h2>
            <p>
              Podemos modificar estes Termos de Uso a qualquer momento. Notificaremos você sobre
              mudanças significativas através de email ou aviso no site. O uso contínuo dos serviços
              após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
              Quaisquer disputas serão resolvidas no foro da comarca de São Paulo/SP, com
              exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Contato</h2>
            <p>Para dúvidas ou questões relacionadas a estes termos:</p>
            <ul className="list-none space-y-2 mt-4">
              <li>
                <strong>Email:</strong> contato@superacaoassessoria.com
              </li>
              <li>
                <strong>Suporte:</strong> suporte@superacaoassessoria.com
              </li>
            </ul>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-sm">
              <strong>Superação Assessoria</strong>
              <br />
              CNPJ: 62.783.203/0001-59
              <br />
              Endereço: São Paulo - SP
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermosUso;
