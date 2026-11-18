import { Helmet } from 'react-helmet-async';

const lb = '{';
const rb = '}';

export default function Docs() {
  return (
    <>
      <Helmet>
        <title>Documentação da API — Nuntix</title>
        <meta name="description" content="Documentação completa da API Nuntix para gerenciamento de bookmarks, API Keys e Webhooks" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center py-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4" style={{ color: '#0f172a' }}>
            Documentação da API
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto" style={{ color: '#475569' }}>
            Bem-vindo à documentação da API Nuntix. Aqui você encontra tudo o que precisa para integrar
            com nossa API de gerenciamento de bookmarks, API Keys e Webhooks.
          </p>
        </header>

        {/* Authentication */}
        <section id="authentication" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Autenticação</h2>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">JWT Bearer Token</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                A API utiliza autenticação JWT (JSON Web Tokens) com access tokens de curta duração (15 min)
                e refresh tokens opacos com rotação (7 dias).
              </p>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{`Authorization: Bearer <access_token>`}
              </pre>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">API Keys (Machine-to-Machine)</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                Para integrações servidor-a-servidor, gere API Keys no dashboard. As chaves são exibidas
                apenas uma vez na criação e armazenadas com hash SHA-256.
              </p>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{`Authorization: Bearer nuntix_live_<key_id>.<secret>`}
              </pre>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Importante</h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                <li>Tokens de acesso expiram em 15 minutos</li>
                <li>Refresh tokens expiram em 7 dias e são rotacionados a cada uso</li>
                <li>Reutilização de refresh token revoga todas as sessões do usuário (RFC 9700)</li>
                <li>API Keys têm prefixo <code>nuntix_live_</code> para detecção por secret scanners</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section id="rate-limiting" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Rate Limiting</h2>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            A API implementa rate limiting em múltiplas camadas para proteger contra abuso:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Endpoint</th>
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Limite</th>
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Escopo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">POST /auth/login</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">10 req/min</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Por IP (/64 IPv6) e por email</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">POST /auth/register</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">5 req/min</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Por IP (/64 IPv6) e por email</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">POST /auth/forgot-password</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">5 req/min</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Por IP (/64 IPv6) e por email</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">POST /auth/reset-password</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">5 req/min</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Por IP (/64 IPv6) e por email</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-slate-900 dark:text-white">POST /contact</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">5 req/min</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Por IP</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Headers de Resposta</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Quando o rate limit é excedido, a API retorna <code className="font-mono">429 Too Many Requests</code>
              com headers <code className="font-mono">Retry-After</code> (segundos) e <code className="font-mono">X-RateLimit-Reset</code> (timestamp Unix).
            </p>
          </div>
        </section>

        {/* Bookmarks Endpoints */}
        <section id="bookmarks" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Bookmarks</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Gerencie seus bookmarks privados com tags. Todas as rotas requerem autenticação e retornam
            apenas dados do usuário autenticado (isolamento estrito por user_id).
          </p>

          <div className="space-y-6">
            {[
              { method: 'POST', path: '/bookmarks', desc: 'Criar um novo bookmark', auth: true },
              { method: 'GET', path: '/bookmarks', desc: 'Listar bookmarks (paginado, filtro por tag)', auth: true },
              { method: 'GET', path: '/bookmarks/{id}', desc: 'Obter um bookmark específico com tags', auth: true },
              { method: 'PUT', path: '/bookmarks/{id}', desc: 'Atualizar um bookmark', auth: true },
              { method: 'DELETE', path: '/bookmarks/{id}', desc: 'Excluir um bookmark', auth: true },
              { method: 'POST', path: '/bookmarks/{id}/tags/{tagID}', desc: 'Anexar tag a um bookmark', auth: true },
              { method: 'DELETE', path: '/bookmarks/{id}/tags/{tagID}', desc: 'Desanexar tag de um bookmark', auth: true },
            ].map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
            ))}
          </div>
        </section>

        {/* Tags Endpoints */}
        <section id="tags" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tags</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Organize seus bookmarks com tags personalizadas.
          </p>

          <div className="space-y-6">
            {[
              { method: 'POST', path: '/tags', desc: 'Criar uma nova tag', auth: true },
              { method: 'GET', path: '/tags', desc: 'Listar todas as tags do usuário', auth: true },
              { method: 'DELETE', path: '/tags/{id}', desc: 'Excluir uma tag', auth: true },
            ].map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
            ))}
          </div>
        </section>

        {/* API Keys Endpoints */}
        <section id="api-keys" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">API Keys</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Gerencie chaves de API para integrações machine-to-machine. As chaves são mostradas
            apenas uma vez na criação.
          </p>

          <div className="space-y-6">
            {[
              { method: 'POST', path: '/api-keys', desc: 'Gerar uma nova API Key (retorna chave bruta)', auth: true },
              { method: 'GET', path: '/api-keys', desc: 'Listar API Keys ativas e revogadas', auth: true },
              { method: 'DELETE', path: '/api-keys/{id}', desc: 'Revogar uma API Key', auth: true },
            ].map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
            ))}
          </div>
        </section>

        {/* Webhooks Endpoints */}
        <section id="webhooks" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Webhooks</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Configure endpoints para receber eventos do dispatcher de webhooks. Disponível no plano Pro.
          </p>

          <div className="space-y-6">
            {[
              { method: 'POST', path: '/api/webhooks/endpoints', desc: 'Criar endpoint de webhook', auth: true },
              { method: 'GET', path: '/api/webhooks/endpoints', desc: 'Listar endpoints de webhook', auth: true },
              { method: 'GET', path: '/api/webhooks/endpoints/{id}', desc: 'Obter detalhes do endpoint', auth: true },
              { method: 'DELETE', path: '/api/webhooks/endpoints/{id}', desc: 'Excluir endpoint de webhook', auth: true },
              { method: 'GET', path: '/api/webhooks/deliveries', desc: 'Listar entregas (filtro por endpoint)', auth: true },
              { method: 'POST', path: '/api/webhooks/deliveries/{id}/retry', desc: 'Reenviar entrega falhada', auth: true },
            ].map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
            ))}
          </div>
        </section>

        {/* Billing Endpoints */}
        <section id="billing" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Faturamento</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Consulte uso do plano, faça upgrade e gerencie assinatura via Stripe.
          </p>

          <div className="space-y-6">
            {[
              { method: 'GET', path: '/billing/usage', desc: 'Obter uso atual do plano (requests, webhooks)', auth: true },
              { method: 'GET', path: '/billing/checkout', desc: 'Criar sessão de checkout Stripe para upgrade', auth: true },
              { method: 'POST', path: '/billing/portal', desc: 'Abrir Stripe Customer Portal para gerenciar assinatura', auth: true },
            ].map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
            ))}
          </div>
        </section>

        {/* Error Codes */}
        <section id="errors" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Códigos de Erro</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Código</th>
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Significado</th>
                  <th className="pb-3 font-semibold text-slate-900 dark:text-white">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">400</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Bad Request - Dados inválidos</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Verifique o payload da requisição</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">401</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Unauthorized - Token inválido ou expirado</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Renove o token ou faça login novamente</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">403</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Forbidden - Acesso negado (ex: plano Free acessando feature Pro)</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Faça upgrade do plano</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">404</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Not Found - Recurso não existe ou não pertence ao usuário</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Verifique o ID do recurso (404 oculta existência)</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">429</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Too Many Requests - Rate limit excedido</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Aguarde <code className="font-mono">Retry-After</code> segundos</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-600 dark:text-red-400">500</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Internal Server Error</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">Tente novamente ou contate suporte</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Formato de Erro</h3>
            <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{lb}
  "message": "Descrição legível do erro",
  "code": "ERROR_CODE"  // opcional, para tratamento programático
{rb}
            </pre>
          </div>
        </section>

        {/* Code Examples */}
        <section id="examples" className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Exemplos de Código</h2>

          <div className="space-y-8">
            {/* Login Example */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Login e Obtenção de Tokens</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{curlExample()}
              </pre>
            </div>

            {/* Create Bookmark Example */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Criar Bookmark (com JWT)</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{createBookmarkExample()}
              </pre>
            </div>

            {/* Create Bookmark with API Key */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Criar Bookmark (com API Key)</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{createBookmarkApiKeyExample()}
              </pre>
            </div>

            {/* List Bookmarks */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Listar Bookmarks com Paginação</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{listBookmarksExample()}
              </pre>
            </div>

            {/* Check Usage */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Verificar Uso do Plano</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{checkUsageExample()}
              </pre>
            </div>

            {/* Refresh Token */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Renovar Access Token</h3>
              <pre className="bg-slate-900 text-slate-100 rounded p-4 overflow-x-auto text-sm">
{refreshTokenExample()}
              </pre>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
          <p>Precisa de ajuda? <a href="/contato" className="text-primary-600 hover:underline">Entre em contato</a></p>
        </footer>
      </div>
    </>
  );
}

// Helper functions for code examples (avoid template literal parsing issues)
function curlExample(): string {
  return `curl -X POST https://api.nuntix.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha123"}'

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "opaque_refresh_token",
  "token_type": "Bearer",
  "expires_in": 900
}`;
}

function createBookmarkExample(): string {
  return `curl -X POST https://api.nuntix.com.br/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"url": "https://example.com", "title": "Exemplo"}'

Response:
{
  "id": "uuid",
  "url": "https://example.com",
  "title": "Exemplo",
  "tags": [],
  "created_at": "2024-01-15T10:30:00Z"
}`;
}

function createBookmarkApiKeyExample(): string {
  return `curl -X POST https://api.nuntix.com.br/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nuntix_live_abc123.xyz789" \
  -d '{"url": "https://example.com"}'`;
}

function listBookmarksExample(): string {
  return `curl -X GET "https://api.nuntix.com.br/bookmarks?limit=20&cursor=abc123" \
  -H "Authorization: Bearer <access_token>"

Response:
{
  "bookmarks": [...],
  "next_cursor": "xyz789"  // null se não há mais páginas
}`;
}

function checkUsageExample(): string {
  return `curl -X GET https://api.nuntix.com.br/billing/usage \
  -H "Authorization: Bearer <access_token>"

Response:
{
  "plan": "pro",
  "period_end": "2024-12-31T23:59:59Z",
  "subscription_ends_at": "2024-12-31T23:59:59Z",
  "requests": { "used": 50000, "limit": 1000000 },
  "webhooks": { "used": 25, "limit": 100 }
}`;
}

function refreshTokenExample(): string {
  return `curl -X POST https://api.nuntix.com.br/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "opaque_refresh_token"}'

Response:
{
  "access_token": "novo_access_token",
  "refresh_token": "novo_refresh_token",
  "token_type": "Bearer",
  "expires_in": 900
}`;
}

// Helper component for endpoint cards
interface EndpointCardProps {
  method: string;
  path: string;
  desc: string;
  auth: boolean;
}

function EndpointCard({ method, path, desc, auth }: EndpointCardProps) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <span className={`${methodColors[method] || 'bg-slate-100 text-slate-700'} px-3 py-1 rounded-full text-xs font-mono font-semibold`}>
          {method}
        </span>
        <code className="font-mono text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
          {path}
        </code>
        {auth && (
          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded">
            Requer Auth
          </span>
        )}
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm">{desc}</p>
    </div>
  );
}