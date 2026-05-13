export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : mai 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
        <p className="text-gray-600 leading-relaxed">
          AutoPost ("nous", "notre") s'engage à protéger votre vie privée. Cette politique de confidentialité
          explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez
          notre service de gestion et de publication de contenu sur les réseaux sociaux.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Informations collectées</h2>
        <p className="text-gray-600 leading-relaxed mb-3">Nous collectons les informations suivantes :</p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
          <li>Informations de compte : adresse e-mail, nom complet</li>
          <li>Informations Facebook : identifiant de page, nom de page, token d'accès (chiffré)</li>
          <li>Contenu publié : textes, images, dates de publication</li>
          <li>Données d'utilisation : logs d'activité, préférences</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Utilisation des données</h2>
        <p className="text-gray-600 leading-relaxed mb-3">Vos données sont utilisées pour :</p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
          <li>Fournir et améliorer le service AutoPost</li>
          <li>Publier du contenu sur vos pages Facebook en votre nom</li>
          <li>Générer du contenu via l'intelligence artificielle</li>
          <li>Envoyer des notifications liées au service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Données Facebook</h2>
        <p className="text-gray-600 leading-relaxed">
          AutoPost utilise l'API Facebook pour accéder à vos pages et publier du contenu en votre nom.
          Nous accédons uniquement aux permissions que vous avez explicitement accordées :
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm ml-1">pages_show_list</code>,
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm ml-1">pages_manage_posts</code>,
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm ml-1">pages_read_engagement</code>.
          Vos tokens d'accès sont stockés de manière chiffrée et ne sont jamais partagés avec des tiers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Partage des données</h2>
        <p className="text-gray-600 leading-relaxed">
          Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles à des tiers,
          sauf dans les cas suivants : prestataires techniques nécessaires au fonctionnement du service
          (hébergement, base de données), ou obligation légale.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Sécurité</h2>
        <p className="text-gray-600 leading-relaxed">
          Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
          chiffrement AES-256 des tokens d'accès, connexions HTTPS, authentification JWT sécurisée,
          et accès restreint aux données.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Vos droits</h2>
        <p className="text-gray-600 leading-relaxed mb-3">Vous avez le droit de :</p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
          <li>Accéder à vos données personnelles</li>
          <li>Corriger des informations inexactes</li>
          <li>Supprimer votre compte et vos données</li>
          <li>Révoquer l'accès Facebook à tout moment depuis les paramètres Facebook</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Pour toute question concernant cette politique de confidentialité, contactez-nous à :{' '}
          <a href="mailto:compaorekiswendsida557@gmail.com" className="text-indigo-600 hover:underline">
            compaorekiswendsida557@gmail.com
          </a>
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-10">
        <p className="text-xs text-gray-400 text-center">
          © 2025 AutoPost. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
