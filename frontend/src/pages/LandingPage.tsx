import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const features = [
  {
    title: 'API Gateway',
    description: 'Gerencie, proteja e monitore suas APIs com rate limiting, autenticação JWT, transformação de requisições e logs estruturados.',
    icon: '🔌',
  },
  {
    title: 'Webhooks Escaláveis',
    description: 'Entrega garantida com retry exponencial, dead-letter queue, assinatura HMAC e dashboard de observabilidade em tempo real.',
    icon: '🔗',
  },
  {
    title: 'Billing Integrado',
    description: 'Cobrança recorrente nativa com Stripe, gestão de planos, uso por API keys, faturas automáticas e portal do cliente.',
    icon: '💳',
  },
];

const plans = [
  {
    name: 'Free',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para projetos pessoais e testes',
    features: [
      'Até 10.000 requisições/mês',
      'Até 5 API Keys',
      'Webhooks básicos (100/mês)',
      'Dashboard de métricas',
      'Suporte comunitário',
    ],
    cta: 'Começar Grátis',
    variant: 'outline',
    popular: false,
  },
  {
    name: 'Pro',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para equipes em crescimento',
    features: [
      'Até 1.000.000 requisições/mês',
      'API Keys ilimitadas',
      'Webhooks ilimitados + DLQ',
      'Rate limiting avançado',
      'Billing & faturas automáticas',
      'Suporte prioritário por email',
      'SLA 99.9%',
    ],
    cta: 'Assinar Pro',
    variant: 'primary',
    popular: true,
  },
];

function FeatureCard({ title, description, icon }: typeof features[0]) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-300">
      <div className="text-4xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, variant, popular }: typeof plans[0]) {
  return (
    <div className={`relative rounded-2xl p-8 border transition-all duration-300 ${
      variant === 'primary'
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-sm font-semibold rounded-full">
          Mais Popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{name}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
        <span className="text-gray-500 dark:text-gray-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-8" role="list">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          variant === 'primary'
            ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
            : 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-2 border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'smooth';
    return () => {
      html.style.scrollBehavior = originalScrollBehavior;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Nuntix — API Gateway, Webhooks & Billing Unificados</title>
        <meta name="description" content="Plataforma completa para gerenciar APIs, webhooks escaláveis e billing integrado. Comece grátis em minutos." />
        <meta name="theme-color" content="#2563eb" />
        <meta property="og:title" content="Nuntix — API Gateway, Webhooks & Billing Unificados" />
        <meta property="og:description" content="Plataforma completa para gerenciar APIs, webhooks escaláveis e billing integrado. Comece grátis em minutos." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nuntix — API Gateway, Webhooks & Billing Unificados" />
        <meta name="twitter:description" content="Plataforma completa para gerenciar APIs, webhooks escaláveis e billing integrado." />
        <link rel="canonical" href="https://nuntix.com/" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Nuntix',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Cloud',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
            },
            description: 'Plataforma completa para gerenciar APIs, webhooks escaláveis e billing integrado.',
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">📡</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Nuntix</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium">Funcionalidades</a>
                <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium">Preços</a>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium">Entrar</Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm">Começar Grátis</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 mb-8">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">🚀 Novo: Billing integrado com Stripe</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Sua API, sob controle total.
                <br />
                <span className="text-primary-600 dark:text-primary-400">Gateway, Webhooks & Billing.</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Gerencie APIs, entregue webhooks com garantia e cobre clientes — tudo em uma plataforma unificada.
                Deploy em minutos, escale sem limites.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Começar Grátis →
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200"
                >
                  Ver Funcionalidades
                </a>
              </div>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                Sem cartão de crédito • Cancelamento a qualquer momento • {plans[0].features[0]}
              </p>
            </div>

            {/* Hero Visual - Abstract illustration */}
            <div className="mt-16 relative" aria-hidden="true">
              <div className="max-w-5xl mx-auto aspect-[16/9] bg-gradient-to-br from-primary-50 via-white to-gray-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="font-mono text-sm text-gray-400 dark:text-gray-500 mb-4">Terminal</div>
                    <pre className="text-left bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-700 text-green-400 font-mono text-sm overflow-x-auto max-w-md">
{`$ nuntix deploy --env production
✓ API Gateway configurado
✓ Rate limiting: 1000 req/min
✓ Webhooks: HMAC-SHA256 enabled
✓ Billing: Stripe connected
✓ SSL/TLS: Auto-provisioned

🚀 Deploy completo em 47s
📊 Dashboard: https://dash.nuntix.com`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Tudo que você precisa para APIs em produção
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Três pilares fundamentais, zero configuração complexa. Foque no seu produto, não na infraestrutura.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Preços simples e transparentes
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Comece grátis. Pague apenas quando crescer. Sem surpresas.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <PricingCard key={index} {...plan} />
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-600 dark:text-gray-400">
                Precisa de mais volume ou recursos enterprise?
                <Link to="/contato" className="text-primary-600 dark:text-primary-400 font-medium hover:underline ml-2">
                  Fale conosco
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
              Junte-se a desenvolvedores que já confiam no Nuntix para suas APIs em produção.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors shadow-lg"
            >
              Criar conta gratuita
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl" aria-hidden="true">📡</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Nuntix</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                  Plataforma unificada para API Gateway, Webhooks escaláveis e Billing integrado.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produto</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Funcionalidades</a></li>
                  <li><a href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Preços</a></li>
                  <li><Link to="/docs" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Documentação</Link></li>
                  <li><Link to="/changelog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Changelog</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Empresa</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sobre</Link></li>
                  <li><Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</Link></li>
                  <li><Link to="/careers" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Carreiras</Link></li>
                  <li><Link to="/contato" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contato</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Nuntix. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacidade</Link>
                <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Termos</Link>
                <Link to="/cookies" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}