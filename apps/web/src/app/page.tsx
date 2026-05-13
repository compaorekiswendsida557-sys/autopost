import Link from 'next/link';
import {
  Zap, Calendar, CheckCircle, BarChart3, Facebook,
  Sparkles, Clock, Shield, ArrowRight, Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AutoPost</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Propulsé par Claude AI (Anthropic)
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Publiez sur Facebook{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              en pilote automatique
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            AutoPost génère des publications Facebook percutantes grâce à l'IA,
            vous laisse les valider, puis les publie automatiquement au meilleur moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-200 transition-colors"
            >
              Voir comment ça marche
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Aucune carte bancaire requise • 14 jours gratuits</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-3xl p-8 border border-indigo-100">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-5 mx-4 max-w-[200px] flex items-center px-3">
                  <span className="text-xs text-gray-500">autopost.app/dashboard</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Posts publiés', value: '124', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Programmés', value: '8', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Brouillons', value: '3', color: 'text-gray-600', bg: 'bg-gray-50' },
                  { label: 'Pages FB', value: '2', color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 space-y-3">
                {[
                  { text: '🎯 Promotion flash -50% sur tous nos services ce weekend...', status: 'Publié', color: 'bg-green-100 text-green-700' },
                  { text: '💡 5 conseils pour booster votre productivité en 2025...', status: 'Programmé', color: 'bg-purple-100 text-purple-700' },
                  { text: '🚀 Notre nouveau produit arrive bientôt, restez connectés...', status: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
                ].map((post) => (
                  <div key={post.text} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Facebook className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="flex-1 text-sm text-gray-700 truncate">{post.text}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${post.color}`}>{post.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-600">Une plateforme complète pour dominer les réseaux sociaux</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles className="h-6 w-6" />,
                color: 'text-indigo-600 bg-indigo-50',
                title: 'Génération IA avancée',
                desc: 'Claude AI génère des posts adaptés à votre entreprise, votre ton et vos objectifs marketing. Plusieurs variantes en un clic.',
              },
              {
                icon: <CheckCircle className="h-6 w-6" />,
                color: 'text-green-600 bg-green-50',
                title: 'Validation avant publication',
                desc: 'Prévisualisez, modifiez et validez chaque post avant qu\'il soit publié. Vous gardez le contrôle total.',
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                color: 'text-purple-600 bg-purple-50',
                title: 'Planification intelligente',
                desc: 'Programmez vos posts à l\'avance. Calendrier de contenu hebdomadaire ou mensuel. Publication automatique.',
              },
              {
                icon: <Facebook className="h-6 w-6" />,
                color: 'text-blue-600 bg-blue-50',
                title: 'Intégration Facebook officielle',
                desc: 'Connexion sécurisée via Meta API officielle. Gérez plusieurs pages depuis un seul tableau de bord.',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                color: 'text-orange-600 bg-orange-50',
                title: 'Analyses & performances',
                desc: 'Suivez les likes, commentaires, partages et portée de chaque publication. Optimisez votre stratégie.',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                color: 'text-red-600 bg-red-50',
                title: 'Sécurité maximale',
                desc: 'Tokens chiffrés AES-256, conformité RGPD, aucun stockage de mot de passe Facebook. Vos données sont protégées.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-gray-600">Configurez une fois, publiez indéfiniment</p>
          </div>
          <div className="space-y-8">
            {[
              { n: '01', title: 'Connectez votre page Facebook', desc: 'Liez votre page Facebook en quelques secondes via OAuth sécurisé. Configurez le profil de votre entreprise (nom, activité, ton, contact, hashtags).' },
              { n: '02', title: 'Générez du contenu avec l\'IA', desc: 'Choisissez un thème, un ton et un objectif. L\'IA génère des publications professionnelles en quelques secondes, avec vos infos de contact intégrées automatiquement.' },
              { n: '03', title: 'Validez et personnalisez', desc: 'Prévisualisez le post, modifiez le texte si nécessaire, ajoutez une image ou vidéo. Puis validez ou régénérez.' },
              { n: '04', title: 'Publiez ou programmez', desc: 'Publiez immédiatement ou programmez à l\'heure de votre choix. Notre système s\'occupe de tout automatiquement.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                  {step.n}
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tarifs simples et transparents</h2>
            <p className="text-lg text-gray-600">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Gratuit', price: '0€', period: 'toujours',
                features: ['1 page Facebook', '10 posts/mois', '20 générations IA', 'Validation manuelle'],
                cta: 'Commencer', highlight: false,
              },
              {
                name: 'Pro', price: '19€', period: '/mois',
                features: ['5 pages Facebook', '150 posts/mois', '300 générations IA', 'Planification avancée', 'Analyses détaillées', 'Support prioritaire'],
                cta: 'Essai 14 jours', highlight: true,
              },
              {
                name: 'Agence', price: '49€', period: '/mois',
                features: ['Pages illimitées', 'Posts illimités', 'IA illimitée', 'Multi-utilisateurs', 'API access', 'Onboarding dédié'],
                cta: 'Contacter', highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 border-2 ${plan.highlight ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'border-gray-200 bg-white'}`}>
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Fatima K.', role: 'Gérante boutique mode', text: 'Avant AutoPost, je passais 3h par semaine à rédiger des posts. Maintenant c\'est 15 minutes. Et les résultats sont bien meilleurs !' },
              { name: 'Ibrahim D.', role: 'Agence marketing', text: 'Nous gérons 12 pages clients. AutoPost nous a permis de doubler notre productivité sans recruter. Indispensable.' },
              { name: 'Marie-Claire T.', role: 'Restauratrice', text: 'L\'IA comprend parfaitement le ton que je veux pour mon restaurant. Les posts semblent écrits par moi. Mes clients adorent.' },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à automatiser votre présence Facebook ?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Rejoignez des centaines d'entrepreneurs qui économisent du temps et augmentent leur engagement.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-bold hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Créer mon compte gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold">AutoPost</span>
          </div>
          <p className="text-sm">© 2025 AutoPost. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white">Confidentialité</a>
            <a href="#" className="hover:text-white">CGU</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
