// Simple interactions: theme toggle + smooth anchor links
(function(){
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || 'dark';
    root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
  });

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if(id.length > 1){
        e.preventDefault();
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// === GitHub API integration ===
// Set your repo URL here (same as in index.html top constant)
const GH_REPO_URL = (function(){
  const btn = document.querySelector('a.btn[href*="github.com"]');
  if(btn) return btn.href.replace(/\/releases.*$/,''); // ensure base repo url
  return "https://github.com/your-username/cashie-beta";
})();

function parseRepo(url){
  const m = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/#?]+)/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function fetchJSON(url){
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}

async function loadGitHubMeta(){
  const parsed = parseRepo(GH_REPO_URL);
  if(!parsed) return;
  const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
  try{
    const repo = await fetchJSON(base);
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const starsBadge = document.getElementById('starsBadge');
    const forksBadge = document.getElementById('forksBadge');
    if(starsBadge){ starsBadge.textContent = `⭐ ${stars.toLocaleString()}`; starsBadge.href = GH_REPO_URL + '/stargazers'; }
    if(forksBadge){ forksBadge.textContent = `🍴 ${forks.toLocaleString()}`; forksBadge.href = GH_REPO_URL + '/network/members'; }
  }catch(e){
    console.warn('Failed to fetch repo meta', e);
  }
}

function formatDate(iso){
  try{ return new Date(iso).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); }
  catch{ return iso }
}

async function loadChangelog(){
  const parsed = parseRepo(GH_REPO_URL);
  if(!parsed) return;
  const list = document.getElementById('changelogList');
  const link = document.getElementById('changelogLink');
  if(link) link.href = GH_REPO_URL + '/releases';
  try{
    // Try releases first
    const releases = await fetchJSON(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases`);
    if(Array.isArray(releases) && releases.length){
      list.innerHTML = releases.slice(0, 5).map(r => `
        <article class="entry">
          <h4>${r.name || r.tag_name}</h4>
          <div class="meta">Published ${formatDate(r.published_at)} · <a class="link" target="_blank" href="${r.html_url}">View release</a></div>
          <div class="body">${(r.body || '').substring(0, 600).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${(r.body||'').length>600?'…':''}</div>
        </article>`).join('');
      return;
    }
    // Fallback to recent commits on main
    const commits = await fetchJSON(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?sha=main&per_page=5`);
    list.innerHTML = commits.map(c => `
      <article class="entry">
        <h4>${(c.commit && c.commit.message) ? c.commit.message.split('\\n')[0] : 'Update'}</h4>
        <div class="meta">Committed ${formatDate(c.commit.author.date)} by ${c.commit.author.name} · <a class="link" target="_blank" href="${c.html_url}">View commit</a></div>
      </article>`).join('');
  }catch(e){
    console.warn('Failed to load changelog', e);
    list.innerHTML = '<p class="muted">Could not load changelog from GitHub right now.</p>';
  }
}

// Run on load
loadGitHubMeta();
loadChangelog();
