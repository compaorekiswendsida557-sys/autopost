import Link from 'next/link';
import {
  Zap, Calendar, CheckCircle, BarChart3, Facebook,
  Sparkles, Shield, ArrowRight, Star, Layers, Edit3,
  Clock, Users, TrendingUp, MessageSquare, Play,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AutoPost</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#how" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Propulsé par Google Gemini AI
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Votre présence Facebook
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              en pilote automatique
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            AutoPost génère des publications percutantes grâce à l'IA, vous les soumet pour validation,
            puis les publie automatiquement au meilleur moment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5">
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-50 transition-colors">
              <Play className="h-4 w-4 text-indigo-600" />
              Voir la démo
            </a>
          </div>
          <p className="text-sm text-gray-400">Aucune carte bancaire · Gratuit pour toujours sur le plan Free</p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 bottom-0 h-16 top-auto pointer-events-none" />
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-3xl p-6 border border-indigo-100 shadow-2xl shadow-indigo-100">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-5 max-w-[220px] flex items-center px-3">
                  <span className="text-xs text-gray-400">autopost.vercel.app/dashboard</span>
                </div>
              </div>
              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 bg-gray-50 border-r border-gray-100 p-3 hidden md:block">
                  {['Tableau de bord', 'Créer un post', 'Mes posts', 'Calendrier', 'En masse', 'Mes pages'].map((item, i) => (
                    <div key={item} className={`px-3 py-2 rounded-lg text-xs mb-1 ${i === 0 ? 'bg-indigo-600 text-white font-medium' : 'text-gray-500'}`}>{item}</div>
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Posts publiés', value: '124', color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Programmés', value: '8', color: 'text-purple-600', bg: 'bg-purple-50' },
                      { label: 'Brouillons', value: '3', color: 'text-gray-600', bg: 'bg-gray-50' },
                      { label: 'Pages FB', value: '2', color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { text: '🎯 Promotion flash -50% sur tous nos services ce weekend...', status: 'Publié', color: 'bg-green-100 text-green-700' },
                      { text: '💡 5 conseils pour booster votre productivité en 2025...', status: 'Programmé', color: 'bg-purple-100 text-purple-700' },
                      { text: '🚀 Notre nouveau produit arrive bientôt, restez connectés...', status: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
                    ].map((p) => (
                      <div key={p.text} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Facebook className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <p className="flex-1 text-xs text-gray-600 truncate">{p.text}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.color}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10×', label: 'Plus rapide', icon: <Zap className="h-5 w-5" /> },
            { value: '500+', label: 'Utilisateurs', icon: <Users className="h-5 w-5" /> },
            { value: '98%', label: 'Satisfaction', icon: <Star className="h-5 w-5" /> },
            { value: '50k+', label: 'Posts générés', icon: <TrendingUp className="h-5 w-5" /> },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-center mb-2 text-indigo-500">{s.icon}</div>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Une plateforme complète pour dominer votre présence sur Facebook</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Sparkles, color: 'text-indigo-600 bg-indigo-50', title: 'Génération IA avancée', desc: 'Gemini AI génère des posts adaptés à votre entreprise, votre ton et vos objectifs. Jusqu\'à 10 variantes en un clic.' },
              { icon: Layers, color: 'text-purple-600 bg-purple-50', title: 'Publication en masse', desc: 'Générez et programmez jusqu\'à 10 publications en une seule fois. Planning automatique sur plusieurs jours.' },
              { icon: Edit3, color: 'text-pink-600 bg-pink-50', title: 'Éditeur riche', desc: 'Éditeur de texte complet avec aperçu Facebook réel. Bold, italic, couleurs, images — tout y est.' },
              { icon: Calendar, color: 'text-green-600 bg-green-50', title: 'Planification intelligente', desc: 'Calendrier de contenu visuel. Drag & drop pour réorganiser. Publication automatique à l\'heure exacte.' },
              { icon: Facebook, color: 'text-blue-600 bg-blue-50', title: 'Multi-pages Facebook', desc: 'Connectez plusieurs pages Facebook. Gérez tout depuis un seul tableau de bord unifié.' },
              { icon: BarChart3, color: 'text-orange-600 bg-orange-50', title: 'Analyses & performances', desc: 'Suivez likes, commentaires, portée. Identifiez vos meilleurs posts et optimisez votre stratégie.' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Prêt en 4 étapes</h2>
            <p className="text-lg text-gray-500">Configurez une fois, publiez indéfiniment</p>
          </div>
          <div className="relative">
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-purple-200 hidden md:block" />
            <div className="space-y-10">
              {[
                { n: '1', icon: Facebook, title: 'Connectez votre page Facebook', desc: 'Liez votre page en quelques secondes via OAuth Meta officiel. Configurez le profil de votre entreprise : activité, ton, contacts, hashtags.', color: 'bg-blue-500' },
                { n: '2', icon: Sparkles, title: 'Générez du contenu avec l\'IA', desc: 'Choisissez un thème, un ton, un objectif et le nombre de posts. L\'IA génère des publications professionnelles en quelques secondes.', color: 'bg-indigo-500' },
                { n: '3', icon: Edit3, title: 'Validez et personnalisez', desc: 'Prévisualisez le rendu Facebook, modifiez le texte, ajoutez vos contacts et une image. Validez ou régénérez en un clic.', color: 'bg-purple-500' },
                { n: '4', icon: Clock, title: 'Planifiez et publiez', desc: 'Choisissez les horaires de publication. Notre système publie automatiquement aux créneaux définis, même quand vous dormez.', color: 'bg-pink-500' },
              ].map((step) => (
                <div key={step.n} className="flex gap-6 items-start relative">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-md z-10`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-400">ÉTAPE {step.n}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Simple et transparent</h2>
            <p className="text-lg text-gray-500">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Gratuit', price: '0', features: ['1 page Facebook', '100 posts/mois', 'Génération IA', 'Éditeur riche', 'Calendrier'],
                cta: 'Commencer', highlight: false, badge: null,
              },
              {
                name: 'Pro', price: '19', features: ['5 pages Facebook', '500 posts/mois', 'IA illimitée', 'Publication en masse', 'Analyses avancées', 'Support prioritaire'],
                cta: 'Essai 14 jours gratuit', highlight: true, badge: 'Populaire',
              },
              {
                name: 'Agence', price: '49', features: ['Pages illimitées', 'Posts illimités', 'Multi-utilisateurs', 'API Access', 'Tableau de bord client', 'Onboarding dédié'],
                cta: 'Nous contacter', highlight: false, badge: null,
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-8 border-2 ${plan.highlight ? 'border-indigo-500 bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-200 scale-105' : 'border-gray-200 bg-white'}`}>
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                    {plan.badge}
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}€</span>
                  <span className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-3 px-6 rounded-xl font-bold text-sm transition-all ${plan.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Témoignages</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Fatima K.', role: 'Gérante boutique mode', avatar: 'FK', text: 'Avant AutoPost, je passais 3h par semaine à rédiger des posts. Maintenant c\'est 15 minutes. Et les résultats sont bien meilleurs !' },
              { name: 'Ibrahim D.', role: 'Agence marketing', avatar: 'ID', text: 'Nous gérons 12 pages clients. AutoPost nous a permis de doubler notre productivité sans recruter. Absolument indispensable.' },
              { name: 'Marie-Claire T.', role: 'Restauratrice', avatar: 'MT', text: 'L\'IA comprend parfaitement le ton que je veux. Les posts semblent écrits par moi. Mes clients adorent et l\'engagement a triplé !' },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{ width: (i % 4 + 1) * 10, height: (i % 4 + 1) * 10, left: `${(i * 5) % 100}%`, top: `${(i * 7) % 100}%` }} />
          ))}
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Prêt à automatiser votre présence Facebook ?
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            Rejoignez des centaines d'entrepreneurs qui économisent du temps et augmentent leur engagement.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-2xl text-base font-extrabold hover:bg-indigo-50 transition-colors shadow-2xl">
            Créer mon compte gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-indigo-300 text-sm">Sans carte bancaire · Annulez à tout moment</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">AutoPost</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <a href="mailto:compaorekiswendsida557@gmail.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <p className="text-center text-sm">© 2025 AutoPost. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
