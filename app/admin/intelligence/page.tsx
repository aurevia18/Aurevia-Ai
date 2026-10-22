import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ArrowUpRight,BrainCircuit,FileCheck2,Radio,Settings2,ShieldCheck,UsersRound} from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import {requireAdmin} from '@/lib/auth';

const controls=[
 {href:'/admin/content',title:'Customer story moderation',description:'Review submitted stories, verify evidence and consent, and publish only approved customer statements.',icon:FileCheck2},
 {href:'/admin/broadcasts',title:'Network announcements',description:'Publish administrator-authored notices and platform updates through the existing broadcast workflow.',icon:Radio},
 {href:'/admin/users',title:'Member access',description:'Review user accounts and account status using the existing user administration tools.',icon:UsersRound},
 {href:'/admin/settings',title:'Platform settings',description:'Inspect existing system settings before enabling any new provider or AI integration.',icon:Settings2},
];
export default async function AdminIntelligencePage(){try{await requireAdmin()}catch{redirect('/admin/login')}
 return <><AdminNav/><main className="account-page mx-auto max-w-6xl"><header className="account-heading"><div><span className="account-kicker">ADMINISTRATION · INTELLIGENCE</span><h1>Intelligence &amp; Network Control</h1><p>Govern AI-assisted education, portfolio explanations, and customer-story integrity.</p></div></header>
 <section className="account-callout mb-5"><ShieldCheck size={18}/><span><b>Provider status:</b> this release includes rule-based portfolio insights and clearly marked fictional learning scenarios. A live generative-AI provider, public member feed, and automated moderation are not connected. No control on this page claims to enable those services.</span></section>
 <div className="grid gap-4 sm:grid-cols-2">{controls.map(item=><Link key={item.href} href={item.href} className="card group flex min-h-36 items-start gap-4 p-5"><span className="rounded-lg border border-amber-200/20 bg-amber-100/5 p-3 text-amber-200"><item.icon size={20}/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 font-semibold">{item.title}<ArrowUpRight size={15} className="shrink-0 opacity-60"/></span><span className="muted mt-2 block text-sm leading-6">{item.description}</span></span></Link>)}</div>
 <section className="account-panel card p-5 mt-5"><div className="flex items-start gap-3"><BrainCircuit size={22} className="text-amber-200 mt-1"/><div><h2 className="text-lg font-semibold">Content integrity policy</h2><ul className="muted mt-3 list-disc space-y-2 pl-5 text-sm leading-6"><li>AI-generated learning scenarios must remain visibly labelled fictional.</li><li>Testimonials must come from genuine customers and require evidence review and explicit consent.</li><li>Never create fake names, quotes, account screenshots, earnings, withdrawal claims, or verification badges.</li><li>OpenAI is called server-side only when OPENAI_API_KEY is configured; requests are rate limited and the API key is never sent to the browser. AI may explain education and aggregate portfolio data, but must never approve funding, change ledgers, make KYC decisions, or submit trades.</li></ul><Link href="/intelligence" className="text-link mt-4 inline-flex items-center gap-2">View user intelligence workspace <ArrowUpRight size={14}/></Link></div></div></section>
 </main></>;
}
