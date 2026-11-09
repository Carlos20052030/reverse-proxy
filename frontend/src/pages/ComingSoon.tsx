import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ComingSoon() {
  return (
    <>
      <Helmet>
        <title>Em breve — Nuntix</title>
        <meta name="description" content="Esta página está em desenvolvimento. Volte em breve!" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-4xl" aria-hidden="true">📡</span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">Nuntix</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Em breve
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Estamos trabalhando nisso. Volte em breve!
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para a Home
          </Link>
        </div>
      </div>
    </>
  );
}