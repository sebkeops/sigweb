-- ============================================================
-- Patch v2 du template email par défaut.
--
-- Pourquoi : le HTML v1 utilisait `display:flex` pour le header SIGWEB
-- et `::before` pour les checkmarks bénéfices. Or Gmail (web + mobile)
-- ne supporte ni l'un ni l'autre. Résultat : header pas centré, logo
-- débordant du rond, et bénéfices sans pucesvertes.
--
-- v2 : header table-based (compat universelle), checkmarks en <span>
-- inline. Le CSS et la structure restent rétro-compatibles avec le
-- preview navigateur — donc les fichiers `docs/email-templates/*.html`
-- ont été mis à jour en parallèle pour rester la source de vérité.
--
-- À exécuter une seule fois dans l'éditeur SQL Supabase. Idempotent :
-- on cible WHERE is_default = true, donc rejouable sans danger.
-- ============================================================

UPDATE email_campaigns SET
  variant_sans_site_body_html = $sansHTML$<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Une simulation de site pour {{nom_commerce}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
body { margin: 0; padding: 40px 20px; background: #ECE7DC; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif; }
.email-wrapper { max-width: 720px; margin: 0 auto; background: #FFFFFF; padding: 0; border-radius: 6px; overflow: hidden; }
.brand-band { background: #2F6F4F; }
.brand-band td { vertical-align: middle; }
.brand-name-text { font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.04em; line-height: 1; }
.brand-tagline-text { font-family: 'Nunito', sans-serif; font-size: 11px; color: #FFFFFF; opacity: 0.9; margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
.email-content { font-family: 'Nunito', sans-serif; max-width: 600px; margin: 0 auto; color: #1A1814; line-height: 1.65; font-size: 15px; padding: 36px 36px 32px; }
.email-content p { margin: 0 0 18px 0; font-weight: 400; }
.email-content strong { color: #1A1814; font-weight: 700; }
.email-content em { font-style: italic; color: #E05C0E; font-weight: 500; }
.highlight-fact { background: #F4F8F5; border-left: 3px solid #2F6F4F; padding: 14px 18px; margin: 22px 0; font-size: 14px; border-radius: 0 4px 4px 0; line-height: 1.55; }
.highlight-fact strong { color: #2F6F4F; }
.preview-box { margin: 28px 0; text-align: center; }
.preview-box a { display: block; text-decoration: none; }
.preview-box img { width: 100%; max-width: 100%; height: auto; display: block; border-radius: 4px; border: 1px solid #D4DDD7; }
.preview-fake { background: linear-gradient(135deg, #2F6F4F22, #2F6F4F44); width: 100%; aspect-ratio: 1.91 / 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #1A1814; padding: 20px; text-align: center; border: 1px solid #D4DDD7; }
.preview-fake-inner { font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.2; color: #1A1814; }
.preview-fake-sub { font-size: 11px; font-weight: 600; opacity: 0.6; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }
.cta-row { text-align: center; margin: 28px 0 24px; }
.cta-button-primary { display: inline-block; background: #E05C0E; color: #FFFFFF !important; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 14px; letter-spacing: 0.01em; box-shadow: 0 2px 8px rgba(224, 92, 14, 0.25); }
.benefits { background: #FAF8F4; padding: 18px 22px 14px; border-radius: 4px; margin: 24px 0; font-size: 13px; line-height: 1.7; color: #3F3D33; }
.benefit-row { font-weight: 500; padding-bottom: 6px; }
.benefit-row:last-child { padding-bottom: 0; }
.benefit-check { color: #2F6F4F; font-weight: 700; margin-right: 8px; display: inline-block; }
.benefits strong, .benefit-row strong { color: #1A1814; font-weight: 700; }
.learn-more { margin: 30px 0 22px; background: #FAF8F4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(47, 111, 79, 0.15); }
.learn-more-title { font-family: 'Nunito', sans-serif; font-size: 11px; font-weight: 800; color: #FFFFFF; margin: 0; padding: 14px 22px; letter-spacing: 0.14em; text-transform: uppercase; background: #2F6F4F; }
.learn-more-links { font-size: 14px; line-height: 1.7; padding: 16px 22px 18px 19px; background: #E8F0EA; border-left: 3px solid #E05C0E; }
.learn-more-link { display: block; color: #1A1814; text-decoration: none; padding: 9px 0; border-bottom: 1px solid rgba(26,24,20,0.08); }
.learn-more-link:last-child { border-bottom: none; padding-bottom: 2px; }
.learn-more-link strong { color: #1A1814; font-weight: 700; font-size: 15px; }
.learn-more-link-arrow { color: #E05C0E; font-weight: 800; margin-left: 6px; font-size: 16px; }
.learn-more-url { display: inline-block; font-size: 12px; color: #2F6F4F; font-weight: 700; margin-top: 4px; letter-spacing: 0.02em; }
.signature { margin-top: 32px; padding-top: 22px; border-top: 1px solid #EBE0CC; font-size: 14px; line-height: 1.6; color: #3F3D33; }
.signature-table { width: 100%; }
.signature-logo-cell { width: 70px; vertical-align: top; padding-right: 16px; }
.signature-logo-img { width: 56px; height: 56px; display: block; border-radius: 50%; object-fit: cover; object-position: 50% 5%; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.signature-text-cell { vertical-align: top; }
.signature-name { font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700; color: #1A1814; margin-bottom: 2px; }
.signature-role { font-size: 13px; color: #6E6B5E; margin-bottom: 8px; font-weight: 500; }
.signature a { color: #2F6F4F; text-decoration: none; font-weight: 600; }
.signature-coords { font-size: 13px; }
.footer-legal { font-size: 11px; line-height: 1.5; color: #9A8E7E; text-align: center; padding: 18px 36px 24px; background: #FAF8F4; border-top: 1px solid #EBE0CC; }
.footer-legal a { color: #9A8E7E; }
</style>
</head>
<body>
<div class="email-wrapper">
  <table class="brand-band" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#2F6F4F;">
    <tr>
      <td align="center" style="padding:18px 36px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td valign="middle" style="padding-right:14px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFFFFF;border-radius:22px;width:44px;height:44px;">
                <tr>
                  <td align="center" valign="middle" style="height:44px;width:44px;">
                    <img src="{{logo_url}}" alt="SIGWEB" width="32" style="display:block;border:0;max-width:32px;height:auto;" />
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle">
              <div class="brand-name-text">SIGWEB</div>
              <div class="brand-tagline-text">Sites internet pour commerçants et artisans</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div class="email-content">
    <p>Bonjour,</p>
    <p>Je m'appelle <strong>Sébastien Siguenza</strong>. J'habite à Ségoufielle, dans le Gers, et je crée des sites internet pour les commerçants et artisans entre Toulouse et le Gers.</p>
    <p>En préparant ma tournée à {{ville}}, je me suis arrêté sur <strong>{{nom_commerce}}</strong>.</p>
    <div class="highlight-fact">
      Avec <strong>{{nb_avis}} avis Google</strong> et une note de <strong>{{rating}}/5</strong>, vous avez clairement gagné la confiance des habitants. Mais quand vos clients cherchent une {{categorie}} sur leur téléphone, <em>ils ne tombent que sur votre fiche Google</em> — et beaucoup repartent sans avoir vu vos spécialités, vos horaires détaillés, ou pu commander à l'avance.
    </div>
    <p>J'ai pris le temps de préparer une <strong>simulation de site internet</strong> spécialement pour {{nom_commerce}}, avec vos vraies photos et vos vrais avis Google :</p>
    <div class="preview-box">
      <a href="{{maquette_url}}">
        <div class="preview-fake">
          <div>
            <div class="preview-fake-inner">{{nom_commerce}}</div>
            <div class="preview-fake-sub">Aperçu de la simulation</div>
          </div>
        </div>
      </a>
    </div>
    <div class="cta-row">
      <a href="{{maquette_url}}" class="cta-button-primary">Voir la simulation complète →</a>
    </div>
    <div class="benefits">
      <div class="benefit-row"><span class="benefit-check">✓</span>Mise en ligne en <strong>2 à 4 semaines</strong></div>
      <div class="benefit-row"><span class="benefit-check">✓</span>Espace de gestion <strong>autonome</strong> (modifiable depuis votre téléphone)</div>
      <div class="benefit-row"><span class="benefit-check">✓</span>Simulation <strong>gratuite et sans engagement</strong></div>
    </div>
    <p>Si l'idée vous parle ou si vous avez des questions, je suis joignable par téléphone ou par retour de mail. Réponse sous 24h.</p>
    <div class="learn-more">
      <div class="learn-more-title">En savoir plus sur SIGWEB</div>
      <div class="learn-more-links">
        <a href="{{site_url}}" class="learn-more-link">
          <strong>Voir mon site et mes réalisations</strong> <span class="learn-more-link-arrow">→</span><br>
          <span class="learn-more-url">{{site_display}}</span>
        </a>
        <a href="{{simulateur_url}}" class="learn-more-link">
          <strong>Estimer le coût de votre projet en 2 minutes</strong> <span class="learn-more-link-arrow">→</span><br>
          <span class="learn-more-url">{{site_display}}/simulateur</span>
        </a>
      </div>
    </div>
    <p>Très bonne journée,</p>
    <div class="signature">
      <table class="signature-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="signature-logo-cell">
            <img src="{{avatar_url}}" alt="Sébastien Siguenza" class="signature-logo-img" width="56" height="56">
          </td>
          <td class="signature-text-cell">
            <div class="signature-name">Sébastien Siguenza</div>
            <div class="signature-role">SIGWEB · Ségoufielle, Gers</div>
            <div class="signature-coords">
              <a href="tel:{{contact_phone_e164}}">{{contact_phone_display}}</a> · <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
              <a href="{{site_url}}">{{site_display}}</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  <div class="footer-legal">
    Vous recevez ce message car {{nom_commerce}} apparaît dans mon registre de prospection commerciale locale.<br>
    <a href="{{unsubscribe_url}}">Ne plus recevoir d'emails de SIGWEB</a>
  </div>
</div>
</body>
</html>$sansHTML$,

  variant_avec_site_body_html = $avecHTML$<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Une nouvelle vitrine pour {{nom_commerce}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
body { margin: 0; padding: 40px 20px; background: #ECE7DC; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif; }
.email-wrapper { max-width: 720px; margin: 0 auto; background: #FFFFFF; padding: 0; border-radius: 6px; overflow: hidden; }
.brand-band { background: #2F6F4F; }
.brand-band td { vertical-align: middle; }
.brand-name-text { font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.04em; line-height: 1; }
.brand-tagline-text { font-family: 'Nunito', sans-serif; font-size: 11px; color: #FFFFFF; opacity: 0.9; margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
.email-content { font-family: 'Nunito', sans-serif; max-width: 600px; margin: 0 auto; color: #1A1814; line-height: 1.65; font-size: 15px; padding: 36px 36px 32px; }
.email-content p { margin: 0 0 18px 0; font-weight: 400; }
.email-content strong { color: #1A1814; font-weight: 700; }
.email-content em { font-style: italic; color: #E05C0E; font-weight: 500; }
.highlight-fact { background: #F4F8F5; border-left: 3px solid #2F6F4F; padding: 14px 18px; margin: 22px 0; font-size: 14px; border-radius: 0 4px 4px 0; line-height: 1.55; }
.highlight-fact strong { color: #2F6F4F; }
.preview-box { margin: 28px 0; text-align: center; }
.preview-box a { display: block; text-decoration: none; }
.preview-box img { width: 100%; max-width: 100%; height: auto; display: block; border-radius: 4px; border: 1px solid #D4DDD7; }
.preview-fake { background: linear-gradient(135deg, #2F6F4F22, #2F6F4F44); width: 100%; aspect-ratio: 1.91 / 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #1A1814; padding: 20px; text-align: center; border: 1px solid #D4DDD7; }
.preview-fake-inner { font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.2; color: #1A1814; }
.preview-fake-sub { font-size: 11px; font-weight: 600; opacity: 0.6; margin-top: 8px; letter-spacing: 0.1em; text-transform: uppercase; }
.cta-row { text-align: center; margin: 28px 0 24px; }
.cta-button-primary { display: inline-block; background: #E05C0E; color: #FFFFFF !important; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 700; font-size: 14px; letter-spacing: 0.01em; box-shadow: 0 2px 8px rgba(224, 92, 14, 0.25); }
.benefits { background: #FAF8F4; padding: 18px 22px 14px; border-radius: 4px; margin: 24px 0; font-size: 13px; line-height: 1.7; color: #3F3D33; }
.benefit-row { font-weight: 500; padding-bottom: 6px; }
.benefit-row:last-child { padding-bottom: 0; }
.benefit-check { color: #2F6F4F; font-weight: 700; margin-right: 8px; display: inline-block; }
.benefits strong, .benefit-row strong { color: #1A1814; font-weight: 700; }
.learn-more { margin: 30px 0 22px; background: #FAF8F4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(47, 111, 79, 0.15); }
.learn-more-title { font-family: 'Nunito', sans-serif; font-size: 11px; font-weight: 800; color: #FFFFFF; margin: 0; padding: 14px 22px; letter-spacing: 0.14em; text-transform: uppercase; background: #2F6F4F; }
.learn-more-links { font-size: 14px; line-height: 1.7; padding: 16px 22px 18px 19px; background: #E8F0EA; border-left: 3px solid #E05C0E; }
.learn-more-link { display: block; color: #1A1814; text-decoration: none; padding: 9px 0; border-bottom: 1px solid rgba(26,24,20,0.08); }
.learn-more-link:last-child { border-bottom: none; padding-bottom: 2px; }
.learn-more-link strong { color: #1A1814; font-weight: 700; font-size: 15px; }
.learn-more-link-arrow { color: #E05C0E; font-weight: 800; margin-left: 6px; font-size: 16px; }
.learn-more-url { display: inline-block; font-size: 12px; color: #2F6F4F; font-weight: 700; margin-top: 4px; letter-spacing: 0.02em; }
.signature { margin-top: 32px; padding-top: 22px; border-top: 1px solid #EBE0CC; font-size: 14px; line-height: 1.6; color: #3F3D33; }
.signature-table { width: 100%; }
.signature-logo-cell { width: 70px; vertical-align: top; padding-right: 16px; }
.signature-logo-img { width: 56px; height: 56px; display: block; border-radius: 50%; object-fit: cover; object-position: 50% 5%; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.signature-text-cell { vertical-align: top; }
.signature-name { font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700; color: #1A1814; margin-bottom: 2px; }
.signature-role { font-size: 13px; color: #6E6B5E; margin-bottom: 8px; font-weight: 500; }
.signature a { color: #2F6F4F; text-decoration: none; font-weight: 600; }
.signature-coords { font-size: 13px; }
.footer-legal { font-size: 11px; line-height: 1.5; color: #9A8E7E; text-align: center; padding: 18px 36px 24px; background: #FAF8F4; border-top: 1px solid #EBE0CC; }
.footer-legal a { color: #9A8E7E; }
</style>
</head>
<body>
<div class="email-wrapper">
  <table class="brand-band" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#2F6F4F;">
    <tr>
      <td align="center" style="padding:18px 36px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td valign="middle" style="padding-right:14px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFFFFF;border-radius:22px;width:44px;height:44px;">
                <tr>
                  <td align="center" valign="middle" style="height:44px;width:44px;">
                    <img src="{{logo_url}}" alt="SIGWEB" width="32" style="display:block;border:0;max-width:32px;height:auto;" />
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle">
              <div class="brand-name-text">SIGWEB</div>
              <div class="brand-tagline-text">Sites internet pour commerçants et artisans</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div class="email-content">
    <p>Bonjour,</p>
    <p>Je m'appelle <strong>Sébastien Siguenza</strong>. J'habite à Ségoufielle, dans le Gers, et je crée des sites internet pour les commerçants et artisans entre Toulouse et le Gers.</p>
    <p>En préparant ma tournée à {{ville}}, je me suis attardé sur <strong>{{nom_commerce}}</strong>.</p>
    <div class="highlight-fact">
      Avec <strong>{{nb_avis}} avis Google</strong> et une note de <strong>{{rating}}/5</strong>, vous avez visiblement <em>une vraie clientèle qui vous apprécie</em>. J'ai jeté un œil à votre site actuel — il a le mérite d'exister, mais je crois honnêtement qu'il ne rend pas justice à la qualité de votre {{categorie}} aujourd'hui.
    </div>
    <p>J'ai pris le temps de préparer une <strong>simulation modernisée</strong> spécialement pour {{nom_commerce}}, avec vos photos et vos vrais avis Google :</p>
    <div class="preview-box">
      <a href="{{maquette_url}}">
        <div class="preview-fake">
          <div>
            <div class="preview-fake-inner">{{nom_commerce}}</div>
            <div class="preview-fake-sub">Aperçu de la simulation</div>
          </div>
        </div>
      </a>
    </div>
    <div class="cta-row">
      <a href="{{maquette_url}}" class="cta-button-primary">Voir la simulation complète →</a>
    </div>
    <div class="benefits">
      <div class="benefit-row"><span class="benefit-check">✓</span>Mise en ligne en <strong>2 à 4 semaines</strong></div>
      <div class="benefit-row"><span class="benefit-check">✓</span>Espace de gestion <strong>autonome</strong> (modifiable depuis votre téléphone)</div>
      <div class="benefit-row"><span class="benefit-check">✓</span>Simulation <strong>gratuite et sans engagement</strong></div>
    </div>
    <p>Si l'idée vous parle ou si vous avez des questions, je suis joignable par téléphone ou par retour de mail. Réponse sous 24h.</p>
    <div class="learn-more">
      <div class="learn-more-title">En savoir plus sur SIGWEB</div>
      <div class="learn-more-links">
        <a href="{{site_url}}" class="learn-more-link">
          <strong>Voir mon site et mes réalisations</strong> <span class="learn-more-link-arrow">→</span><br>
          <span class="learn-more-url">{{site_display}}</span>
        </a>
        <a href="{{simulateur_url}}" class="learn-more-link">
          <strong>Estimer le coût d'une refonte en 2 minutes</strong> <span class="learn-more-link-arrow">→</span><br>
          <span class="learn-more-url">{{site_display}}/simulateur</span>
        </a>
      </div>
    </div>
    <p>Très bonne journée,</p>
    <div class="signature">
      <table class="signature-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="signature-logo-cell">
            <img src="{{avatar_url}}" alt="Sébastien Siguenza" class="signature-logo-img" width="56" height="56">
          </td>
          <td class="signature-text-cell">
            <div class="signature-name">Sébastien Siguenza</div>
            <div class="signature-role">SIGWEB · Ségoufielle, Gers</div>
            <div class="signature-coords">
              <a href="tel:{{contact_phone_e164}}">{{contact_phone_display}}</a> · <a href="mailto:{{contact_email}}">{{contact_email}}</a><br>
              <a href="{{site_url}}">{{site_display}}</a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  <div class="footer-legal">
    Vous recevez ce message car {{nom_commerce}} apparaît dans mon registre de prospection commerciale locale.<br>
    <a href="{{unsubscribe_url}}">Ne plus recevoir d'emails de SIGWEB</a>
  </div>
</div>
</body>
</html>$avecHTML$,

  updated_at = now()
WHERE is_default = true;
