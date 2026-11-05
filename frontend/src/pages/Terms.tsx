import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso — Nuntix</title>
        <meta name="description" content="Termos de Uso do Nuntix — Plataforma unificada para API Gateway, Webhooks e Billing." />
        <meta property="og:title" content="Termos de Uso — Nuntix" />
        <meta property="og:description" content="Termos de Uso do Nuntix — Plataforma unificada para API Gateway, Webhooks e Billing." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <nav className="mb-8" aria-label="Breadcrumb">
          <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            ← Voltar ao Início
          </Link>
        </nav>

        <main className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
          <header className="mb-10 pb-6 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Termos de Uso</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Última atualização: 05/11/2026</p>
          </header>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Termos de Uso</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Ao acessar e utilizar a plataforma Nuntix ("Plataforma", "Nós", "Nosso"), você ("Usuário", "Você", "Seu")
                concorda em cumprir e ficar vinculado a estes Termos de Uso ("Termos"). Se você não concorda com qualquer
                parte destes termos, não deve utilizar a Plataforma.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                A Plataforma oferece serviços de API Gateway, gerenciamento de webhooks e billing integrado ("Serviços").
                Estes Termos regem seu acesso e uso dos Serviços, incluindo quaisquer atualizações ou modificações futuras.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Conta e Registro</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Para utilizar determinados recursos da Plataforma, você deve criar uma conta. Você concorda em:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Fornecer informações precisas, atuais e completas durante o registro.</li>
                <li>Manter a segurança de suas credenciais de acesso.</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.</li>
                <li>Ser responsável por todas as atividades que ocorram sob sua conta.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Uso Aceitável</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Você concorda em não utilizar a Plataforma para:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Qualquer atividade ilegal ou não autorizada.</li>
                <li>Transmitir vírus, malware ou outro código prejudicial.</li>
                <li>Interferir na segurança ou integridade da Plataforma.</li>
                <li>Realizar engenharia reversa ou tentar extrair código-fonte.</li>
                <li>Revender ou redistribuir os Serviços sem autorização por escrito.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Propriedade Intelectual</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                A Plataforma e todo o seu conteúdo original (exceto conteúdo fornecido pelos usuários), recursos e
                funcionalidade são de nossa propriedade exclusiva e são protegidos por leis de direitos autorais,
                marcas registradas e outras leis de propriedade intelectual.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Estes Termos não concedem a você nenhum direito de propriedade intelectual sobre a Plataforma.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Planos e Cobrança</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Oferecemos planos gratuitos e pagos. Ao assinar um plano pago:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Você autoriza a cobrança recorrente no método de pagamento cadastrado.</li>
                <li>Os preços podem ser alterados com aviso prévio de 30 dias.</li>
                <li>O não pagamento pode resultar na suspensão dos Serviços.</li>
                <li>Reembolsos seguem a seção "Cancelamento e Reembolso" abaixo.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                O processamento de pagamentos é realizado via Stripe, sujeito aos termos de serviço da Stripe.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Cancelamento e Reembolso</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                <strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através do painel de
                controle ou do portal do cliente Stripe. O cancelamento entra em vigor ao final do período de
                faturamento atual. Você continuará tendo acesso aos recursos do plano pago até o final desse período.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                <strong>Reembolso:</strong> Não oferecemos reembolsos parciais por períodos não utilizados. Em casos
                excepcionais (ex: cobrança duplicada, erro de processamento), entre em contato com nosso suporte em
                até 14 dias da cobrança para análise. Reembolsos são processados conforme a política da Stripe e
                podem levar de 5 a 10 dias úteis para aparecer no extrato.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Ao cancelar, seus dados serão mantidos por 90 dias para possível reativação, após os quais poderão ser
                permanentemente excluídos conforme nossa Política de Privacidade.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Em nenhuma hipótese seremos responsáveis por danos indiretos, incidentais, especiais, consequenciais
                ou punitivos, incluindo perda de lucros, dados ou oportunidades de negócio, decorrentes do uso ou
                incapacidade de usar a Plataforma.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Nossa responsabilidade total não excederá o valor pago por você nos 12 meses anteriores ao evento
                que deu origem à reclamação, ou R$ 100,00, o que for maior.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">8. Modificações aos Termos</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Podemos modificar estes Termos a qualquer momento. Alterações materiais serão notificadas com pelo
                menos 30 dias de antecedência via email ou notificação na Plataforma. O uso contínuo após a
                vigência das alterações constitui aceitação dos novos Termos.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">9. Lei Aplicável e Foro</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão
                resolvidas no foro da Comarca de São Paulo, SP, com renúncia a qualquer outro, por mais privilegiado
                que seja.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">10. Contato</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Dúvidas sobre estes Termos? Entre em contato conosco em:
              </p>
              <address className="not-italic text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                <p>Email: legal@nuntix.com</p>
                <p>Endereço: São Paulo, SP, Brasil</p>
              </address>
            </section>
          </div>

          <footer className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Estes Termos de Uso foram atualizados em 05/11/2026.
              <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline ml-1">
                Leia também nossa Política de Privacidade
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}