// main.js - gère : cookie consent, envoi du formulaire BRUT à /api/saveFormData
// et affichage dans #output-pre. Ne touche pas /script.js

// ---- cookie consent ----
(function(){
  if (localStorage.getItem("ms_cookie_consent") === "accepted" || localStorage.getItem("ms_cookie_consent") === "rejected") {
    // déjà pris en compte
    return;
  }
  const bar = document.createElement("div");
  bar.className = "cookie-bar";
  bar.innerHTML = `
    <p>
    Votre confidentialité compte ici.  
    Ce site utilise certains cookies essentiels pour fonctionner correctement, et d’autres pour analyser l’usage du site ou améliorer l'expérience.  
    Vous pouvez accepter ou refuser totalement la collecte. Votre choix n’empêchera pas l’accès au site.
</p>

<p>
    Nous utilisons les cookies pour :  
    • assurer le fonctionnement du site  
    • mesurer l’utilisation des pages pour l’améliorer  
    • afficher du contenu plus pertinent  
</p>

<div class="cookie-actions">
    <button class="reject">TOUT REFUSER</button>
    <button class="accept">TOUT ACCEPTER</button>
</div>
  `;
  document.body.appendChild(bar);
  bar.querySelector(".accept").addEventListener("click", () => {
    localStorage.setItem("ms_cookie_consent", "accepted");
    bar.remove();
  });
  bar.querySelector(".reject").addEventListener("click", () => {
    localStorage.setItem("ms_cookie_consent", "rejected");
    bar.remove();
  });
})();

// ---- collecte du formulaire (BRUT) ----
(async function(){
  const collectBtn = document.getElementById("collect-btn");
  const outputPre = document.getElementById("output-pre");

  function getFormDataObject(){
    return {
      name: document.getElementById("name").value,
      sexe: document.getElementById("sexe").value,
      annee_naissance: document.getElementById("annee").value,
      type_rencontre: document.getElementById("typeRencontre").value,
      presentation: document.getElementById("presentation").value,
      ts: new Date().toISOString()
    };
  }

  async function sendFormData() {
    const obj = getFormDataObject();
    try {
      const r = await fetch("/api/saveFormData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(obj)
      });
      const j = await r.json();
      if (j.ok) {
        outputPre.textContent += "[form] Données envoyées.\n";
      } else {
        outputPre.textContent += "[form] Erreur lors de l'envoi.\n";
      }
    } catch (e) {
      outputPre.textContent += "[form] Erreur réseau: " + e.message + "\n";
    }
  }

  if (collectBtn) {
    collectBtn.addEventListener("click", (e) => {
      sendFormData();
    });
  }
})();