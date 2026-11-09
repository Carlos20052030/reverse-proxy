import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function Contact() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    setToast(null);

    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

      setToast({ message: 'Mensagem enviada com sucesso!', type: 'success' });
      form.reset();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erro ao enviar mensagem', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-dismiss toast after 5 seconds
  if (toast) {
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <>
      <Helmet>
        <title>Contato — Nuntix</title>
        <meta name="description" content="Entre em contato com a equipe da Nuntix. Estamos aqui para ajudar." />
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
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium">Início</Link>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium">Entrar</Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm">Começar Grátis</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Contact Section */}
        <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Fale conosco
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Tem dúvidas, sugestões ou precisa de ajuda? Preencha o formulário abaixo ou chame a gente no WhatsApp.
              </p>
            </div>

            {/* Toast */}
            {toast && (
              <div className={`mb-6 p-4 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`} role="alert">
                {toast.message}
              </div>
            )}

            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Enviar mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Conte-nos como podemos ajudar..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>

            {/* WhatsApp Button */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378 9.86 9.86 0 01-.397-.272 9.65 9.65 0 01-1.725-1.79 9.92 9.92 0 01-.218-.547c0-.297.083-.547.198-.746.115-.198.347-.57.822-.915.5-.372.997-.614 1.397-.646.4-.04.746-.073 1.12-.073h.01c.164 0 .314.015.458.045.198.06.52.253 1.07.719 1.307 1.104 1.904 2.34 1.934 2.507.03.164.045.314.045.482 0 .18-.03.36-.074.515a2.07 2.07 0 01-.57.94 2.6 2.6 0 01-1.214.916c-.4.173-.883.306-1.364.446-.48.14-.987.174-1.52.174-.272 0-.543-.01-.84-.045zm5.786-18.473A11.896 11.896 0 0012.01 0C5.393 0 .077 5.317.077 11.934c0 1.85.389 3.63 1.094 5.274L0 24l6.294-1.68a12.18 12.18 0 005.384 1.07c6.62 0 11.934-5.317 11.934-11.934a11.896 11.896 0 00-5.976-10.693z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Prefere WhatsApp?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Clique no botão abaixo para falar direto com a gente</p>
                </div>
                <a
                  href="https://wa.me/5564981125984"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378 9.86 9.86 0 01-.397-.272 9.65 9.65 0 01-1.725-1.79 9.92 9.92 0 01-.218-.547c0-.297.083-.547.198-.746.115-.198.347-.57.822-.915.5-.372.997-.614 1.397-.646.4-.04.746-.073 1.12-.073h.01c.164 0 .314.015.458.045.198.06.52.253 1.07.719 1.307 1.104 1.904 2.34 1.934 2.507.03.164.045.314.045.482 0 .18-.03.36-.074.515a2.07 2.07 0 01-.57.94 2.6 2.6 0 01-1.214.916c-.4.173-.883.306-1.364.446-.48.14-.987.174-1.52.174-.272 0-.543-.01-.84-.045zm5.786-18.473A11.896 11.896 0 0012.01 0C5.393 0 .077 5.317.077 11.934c0 1.85.389 3.63 1.094 5.274L0 24l6.294-1.68a12.18 12.18 0 005.384 1.07c6.62 0 11.934-5.317 11.934-11.934a11.896 11.896 0 00-5.976-10.693z" />
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </main>

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
                  <li><Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Início</Link></li>
                  <li><a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Funcionalidades</a></li>
                  <li><a href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Preços</a></li>
                  <li><a href="/docs" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Documentação</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Empresa</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><a href="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sobre</a></li>
                  <li><a href="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</a></li>
                  <li><a href="/careers" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Carreiras</a></li>
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
                <a href="/cookies" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}