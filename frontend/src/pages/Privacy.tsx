import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade — Nuntix</title>
        <meta name="description" content="Política de Privacidade do Nuntix — Como coletamos, usamos e protegemos seus dados." />
        <meta property="og:title" content="Política de Privacidade — Nuntix" />
        <meta property="og:description" content="Política de Privacidade do Nuntix — Como coletamos, usamos e protegemos seus dados." />
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Política de Privacidade</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Última atualização: 05/11/2026</p>
          </header>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Introdução</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                A Nuntix ("Nós", "Nosso", "Plataforma") valoriza a privacidade dos seus usuários ("Você", "Seu",
                "Usuário"). Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas
                informações pessoais quando você utiliza nossa plataforma de API Gateway, Webhooks e Billing.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Ao utilizar a Plataforma, você concorda com a coleta e uso de informações conforme descrito nesta
                política. Se não concordar, não deve utilizar nossos Serviços.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Informações que Coletamos</h2>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.1 Informações que Você Nos Fornece</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li><strong>Dados de conta:</strong> Nome, email, senha (hashed), empresa/função (opcional).</li>
                <li><strong>Dados de billing:</strong> Nome, endereço, CPF/CNPJ, dados de cartão (processados pela Stripe — não armazenamos números de cartão).</li>
                <li><strong>Dados de uso:</strong> APIs criadas, webhooks configurados, chaves de API, logs de requisição.</li>
                <li><strong>Comunicações:</strong> Emails de suporte, feedback, tickets.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li><strong>Logs de acesso:</strong> IP, user-agent, timestamps, endpoints acessados, códigos de resposta.</li>
                <li><strong>Métricas de uso:</strong> Volume de requisições, latência, erros, uso de quotas.</li>
                <li><strong>Cookies e tecnologias similares:</strong> Cookies essenciais para autenticação, segurança e preferências. Não usamos cookies de publicidade.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Como Usamos Suas Informações</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Usamos seus dados para:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Fornecer, manter e melhorar os Serviços.</li>
                <li>Processar transações e gerenciar assinaturas (via Stripe).</li>
                <li>Enviar comunicações transacionais (confirmações, faturas, alertas de segurança).</li>
                <li>Responder a solicitações de suporte.</li>
                <li>Detectar, prevenir e resolver problemas técnicos e de segurança.</li>
                <li>Cumprir obrigações legais e regulatórias (LGPD, etc.).</li>
                <li>Enviar atualizações de produto e marketing (com seu consentimento, opt-out disponível).</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Não vendemos seus dados pessoais. Podemos compartilhar informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li><strong>Processadores de pagamento:</strong> Stripe (para processar pagamentos e gerenciar assinaturas).</li>
                <li><strong>Provedores de infraestrutura:</strong> Hospedagem, banco de dados, email transacional (sob acordos de processamento de dados).</li>
                <li><strong>Obrigação legal:</strong> Quando exigido por lei, processo judicial ou solicitação governamental válida.</li>
                <li><strong>Proteção de direitos:</strong> Para proteger nossos direitos, privacidade, segurança ou propriedade.</li>
                <li><strong>Transações empresariais:</strong> Em caso de fusão, aquisição ou venda de ativos (com notificação prévia).</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Transferências Internacionais</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Seus dados podem ser processados em servidores localizados fora do Brasil (ex: EUA, UE). Garantimos
                que tais transferências ocorram com salvaguardas adequadas, como Cláusulas Contratuais Padrão (SCCs)
                ou decisões de adequação, em conformidade com a LGPD (Lei 13.709/2018).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Retenção de Dados</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Mantemos seus dados apenas pelo tempo necessário para:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Cumprir a finalidade para a qual foram coletados.</li>
                <li>Atender a requisitos legais, contábeis ou de relatórios (ex: notas fiscais — 5 anos no Brasil).</li>
                <li>Resolver disputas e fazer cumprir nossos acordos.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Após o encerramento da conta, os dados são anonimizados ou excluídos em até 90 dias, exceto quando
                a retenção for exigida por lei.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Seus Direitos (LGPD)</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Como titular de dados, você tem o direito de:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los.</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados.</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade.</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado, comumente usado e legível por máquina.</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com seu consentimento (exceto quando a retenção for obrigatória).</li>
                <li><strong>Informação sobre compartilhamento:</strong> Saber com quais entidades públicas ou privadas compartilhamos seus dados.</li>
                <li><strong>Revogação do consentimento:</strong> Retirar consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento baseado em legítimo interesse.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Para exercer seus direitos, entre em contato: <strong>privacy@nuntix.com</strong>. Responderemos em até 15 dias conforme LGPD.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">8. Segurança</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256).</li>
                <li>Autenticação JWT com expiração curta e refresh tokens seguros.</li>
                <li>Rate limiting, WAF e monitoramento de ameaças.</li>
                <li>Backups criptografados com retenção controlada.</li>
                <li>Acesso baseado em menor privilégio e logs de auditoria.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Embora nos esforcemos para proteger seus dados, nenhuma transmissão pela Internet ou armazenamento
                eletrônico é 100% seguro. Em caso de incidente de segurança, notificaremos você e as autoridades
                competentes conforme exigido por lei.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">9. Cookies e Tecnologias Similares</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Utilizamos cookies estritamente necessários para:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 leading-relaxed">
                <li>Autenticação e sessão (cookies HttpOnly, Secure, SameSite).</li>
                <li>Prevenção de CSRF.</li>
                <li>Preferências de idioma/tema.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>Não utilizamos cookies de publicidade, rastreamento entre sites ou analytics de terceiros.</strong>
                Você pode desativar cookies nas configurações do navegador, mas isso pode impedir o funcionamento
                correto da Plataforma.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">10. Privacidade de Crianças</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                A Plataforma não se destina a menores de 18 anos. Não coletamos intencionalmente dados de menores.
                Se tomarmos conhecimento de coleta acidental, excluiremos os dados prontamente.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">11. Alterações a Esta Política</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Podemos atualizar esta Política periodicamente. Alterações materiais serão notificadas com pelo menos
                30 dias de antecedência via email ou banner na Plataforma. A data de "Última atualização" no topo
                reflete a revisão mais recente.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">12. Contato</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Dúvidas, solicitações ou reclamações sobre esta Política ou seus dados? Nosso Encarregado de Dados
                (DPO) está à disposição:
              </p>
              <address className="not-italic text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                <p>Email: privacy@nuntix.com</p>
                <p>Assunto: "LGPD / Privacidade"</p>
                <p>Endereço: São Paulo, SP, Brasil</p>
              </address>
            </section>
          </div>

          <footer className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Esta Política de Privacidade foi atualizada em 05/11/2026.
              <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline ml-1">
                Leia também nossos Termos de Uso
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}