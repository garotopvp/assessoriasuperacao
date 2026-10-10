import { Layout } from "@/components/layout/Layout";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PoliticaPrivacidade = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-4xl font-black mb-8">Política de Privacidade</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground italic">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introdução</h2>
            <p>
              Bem-vindo ao Superação Assessoria. Esta Política de Privacidade descreve como coletamos,
              usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossos
              serviços.
            </p>
            <p>
              Estamos comprometidos com a proteção de sua privacidade e cumprimos rigorosamente a
              Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações
              aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Dados que Coletamos</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              2.1 Dados Fornecidos por Você
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> Nome, email, senha criptografada
              </li>
              <li>
                <strong>Dados de pagamento:</strong> CPF, informações de cartão (processadas de
                forma segura pelos gateways de pagamento - não armazenamos dados completos de
                cartão)
              </li>
              <li>
                <strong>Dados de perfil:</strong> Foto, cidade, estado, informações sobre seus
                objetivos esportivos
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">
              2.2 Dados Coletados Automaticamente
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, páginas
                visitadas, tempo de permanência
              </li>
              <li>
                <strong>Cookies:</strong> Utilizamos cookies para melhorar sua experiência
              </li>
              <li>
                <strong>Dados de desempenho:</strong> Erros de aplicação, performance (via Sentry)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Como Usamos Seus Dados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processar suas compras e assinaturas</li>
              <li>Enviar confirmações de pedidos e atualizações de status</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Enviar comunicações de marketing (com seu consentimento)</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              4. Compartilhamento de Dados
            </h2>
            <p>Compartilhamos seus dados apenas com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Processadores de pagamento:</strong> Stripe, OpenPix, InfinitePay, Abacate
                Pay
              </li>
              <li>
                <strong>Provedores de infraestrutura:</strong> Vercel (hospedagem), Supabase (banco
                de dados)
              </li>
              <li>
                <strong>Ferramentas de análise:</strong> Sentry (monitoramento de erros)
              </li>
              <li>
                <strong>Autoridades legais:</strong> Quando exigido por lei
              </li>
            </ul>
            <p className="mt-4">
              <strong>Nunca vendemos seus dados pessoais a terceiros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Seus Direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los
              </li>
              <li>
                <strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados
              </li>
              <li>
                <strong>Exclusão:</strong> Solicitar a exclusão de seus dados (direito ao
                esquecimento)
              </li>
              <li>
                <strong>Portabilidade:</strong> Receber seus dados em formato estruturado
              </li>
              <li>
                <strong>Revogação de consentimento:</strong> Retirar o consentimento a qualquer
                momento
              </li>
              <li>
                <strong>Oposição:</strong> Opor-se ao tratamento de dados em determinadas situações
              </li>
            </ul>
            <p className="mt-4">
              Para exercer seus direitos, entre em contato através do email:{" "}
              <strong>contato@superacaoassessoria.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de senhas (bcrypt)</li>
              <li>Conexões HTTPS</li>
              <li>Row Level Security (RLS) no banco de dados</li>
              <li>Autenticação de dois fatores (2FA)</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades
              descritas nesta política, respeitando os prazos legais de retenção. Após esse período,
              os dados serão anonimizados ou excluídos de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para
              melhorar sua experiência. Você pode gerenciar suas preferências através das
              configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Menores de Idade</h2>
            <p>
              Nossos serviços não são direcionados a menores de 18 anos. Se você é responsável por
              um menor e acredita que ele forneceu dados pessoais, entre em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              10. Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você
              sobre mudanças significativas através de email ou aviso no site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Contato</h2>
            <p>Para dúvidas, solicitações ou reclamações relacionadas à privacidade:</p>
            <ul className="list-none space-y-2 mt-4">
              <li>
                <strong>Email:</strong> contato@superacaoassessoria.com
              </li>
              <li>
                <strong>DPO (Encarregado de Dados):</strong> [Nome do DPO]
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

export default PoliticaPrivacidade;
