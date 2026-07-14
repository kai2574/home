import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, Terminal, KeyRound, Gauge, CreditCard, ArrowRight } from 'lucide-react'
import GlobalNavBar from '../components/shared/GlobalNavBar'
import Footer from '../components/Footer'
import { setPageMeta } from '../utils/pageMeta'

// VEN-174: /forge/docs was missing from the SPA (fell through to the generic
// shell); the VEN-145 quickstart only existed inline on the landing page. This
// renders the developer docs at the documented URL — API reference, auth header,
// rate limits, pricing and the live-verified curl/Python/JS examples.

const CURL_SNIPPET = `curl -X POST https://shizuha.com/api/forge/generate \\
  -H "X-API-Key: $FORGE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "a red fox in snow, golden hour, photorealistic"}'`

const PYTHON_SNIPPET = `import requests

resp = requests.post(
    "https://shizuha.com/api/forge/generate",
    headers={"X-API-Key": "YOUR_FORGE_KEY"},
    json={"prompt": "a red fox in snow, golden hour, photorealistic"},
    timeout=120,
)
resp.raise_for_status()          # 401 bad key · 422 bad body · 429 daily limit
print(resp.json())               # -> generated image payload`

const JS_SNIPPET = `const resp = await fetch("https://shizuha.com/api/forge/generate", {
  method: "POST",
  headers: {
    "X-API-Key": "YOUR_FORGE_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: "a red fox in snow, golden hour, photorealistic" }),
})
if (!resp.ok) throw new Error(\`Forge error \${resp.status}\`)  // 401/422/429/5xx
console.log(await resp.json())   // -> generated image payload`

// Live-verified error bodies (2026-07-03) so the docs match the real API.
const ERROR_429_SNIPPET = `HTTP/1.1 429 Too Many Requests
Retry-After: <seconds until your daily window resets>

{"detail": "Daily free limit reached (10/day). Retry after the reset, or switch to pay-as-you-go ($0.02/image)."}`

const LANGS = [
  { id: 'curl', label: 'curl', code: CURL_SNIPPET },
  { id: 'python', label: 'Python', code: PYTHON_SNIPPET },
  { id: 'js', label: 'JavaScript', code: JS_SNIPPET },
]

const ERRORS = [
  ['401', 'Unauthorized', 'Missing or invalid X-API-Key.'],
  ['422', 'Unprocessable Entity', 'Malformed body — prompt missing or wrong type.'],
  ['429', 'Too Many Requests', 'Daily free limit reached (10/day). See Retry-After.'],
  ['5xx', 'Server Error', 'Transient generation/backend error — retry with backoff.'],
]

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }
  return (
    <div className="relative rounded-lg bg-gray-900 dark:bg-black border border-gray-800 overflow-hidden">
      {label && (
        <div className="px-4 py-2 text-xs font-mono text-gray-400 border-b border-gray-800">{label}</div>
      )}
      <button
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="font-mono text-gray-100 whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

export default function ForgeDocsPage() {
  const [lang, setLang] = useState('curl')

  useEffect(() => {
    setPageMeta({
      title: 'Forge API Docs — Shizuha',
      description:
        'Shizuha Forge developer documentation: authenticate with X-API-Key, POST /api/forge/generate, rate limits (10 images/day free, then $0.02/image), and copy-paste curl, Python, and JavaScript examples.',
    })
  }, [])

  const active = LANGS.find((l) => l.id === lang) || LANGS[0]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <GlobalNavBar />

      {/* Hero */}
      <section className="pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <Terminal className="w-4 h-4" />
            Forge API Reference
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Shizuha Forge — Developer Docs
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Generate images from a single REST call — no GPU to provision, no SDK required. One
            key, one endpoint. Grab a key on the{' '}
            <Link to="/forge/signup" className="text-purple-600 dark:text-purple-400 underline">
              signup page
            </Link>{' '}
            and you are one <code className="font-mono text-sm">POST</code> away.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        {/* Authentication */}
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            <KeyRound className="w-5 h-5 text-purple-500" /> Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Every request is authenticated with your API key in the{' '}
            <code className="font-mono text-sm px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">X-API-Key</code>{' '}
            header. Keep it secret; treat it like a password. A missing or invalid key returns{' '}
            <code className="font-mono text-sm">401</code>.
          </p>
          <CodeBlock label="Header" code={'X-API-Key: YOUR_FORGE_KEY'} />
        </section>

        {/* Endpoint */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Generate an image</h2>
          <div className="flex items-center gap-3 mb-4 font-mono text-sm">
            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">POST</span>
            <span className="text-gray-800 dark:text-gray-200">https://shizuha.com/api/forge/generate</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Send a JSON body with a <code className="font-mono text-sm">prompt</code>. The response
            is the generated image payload.
          </p>
          <CodeBlock label="Request body" code={'{ "prompt": "a red fox in snow, golden hour, photorealistic" }'} />

          {/* Language tabs */}
          <div className="mt-6">
            <div className="flex gap-1 mb-3">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    lang === l.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <CodeBlock label={active.label} code={active.code} />
          </div>
        </section>

        {/* Rate limits + errors */}
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            <Gauge className="w-5 h-5 text-purple-500" /> Rate limits &amp; errors
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The free tier allows <strong>10 images/day</strong>. When you exceed it the API returns{' '}
            <code className="font-mono text-sm">429</code> with a{' '}
            <code className="font-mono text-sm">Retry-After</code> header; switch to pay-as-you-go
            (<strong>$0.02/image</strong>) to lift the cap.
          </p>
          <CodeBlock label="429 response" code={ERROR_429_SNIPPET} />
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Meaning</th>
                  <th className="px-4 py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {ERRORS.map(([code, name, when]) => (
                  <tr key={code} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-2 font-mono">{code}</td>
                    <td className="px-4 py-2">{name}</td>
                    <td className="px-4 py-2">{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            <CreditCard className="w-5 h-5 text-purple-500" /> Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            10 images/day free, then a flat <strong>$0.02/image</strong> — no opaque credit math.
            Full tiers and enterprise options are on the{' '}
            <Link to="/forge/pricing" className="text-purple-600 dark:text-purple-400 underline inline-flex items-center gap-1">
              pricing page <ArrowRight className="w-4 h-4" />
            </Link>.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  )
}
